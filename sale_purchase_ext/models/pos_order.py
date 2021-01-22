# -*- coding: utf-8 -*-
from odoo import fields, models, api, _
from dateutil.relativedelta import relativedelta
from odoo.exceptions import ValidationError, UserError


class PosOrder(models.Model):
    _inherit = "pos.order"

    @api.model
    def _process_order(self, order, draft, existing_order):
        res = super(PosOrder, self)._process_order(order=order, draft=draft, existing_order=existing_order)
        for order in self.browse(res):
            for line in order.lines:
                if line.product_id.is_create_pd_invoice and line.product_id.pd_partner_id:
                    line._purchase_service_create()
        return res


class PosOrderLine(models.Model):
    _inherit = "pos.order.line"

    def _purchase_get_date_order(self, supplierinfo):
        """ return the ordered date for the purchase order, computed as : SO commitment date - supplier delay """
        commitment_date = fields.Datetime.from_string(self.order_id.commitment_date or fields.Datetime.now())
        return commitment_date - relativedelta(days=int(supplierinfo.delay))

    def _purchase_service_prepare_vendor_bill_values(self, partner_supplier):
        self.ensure_one()
        fpos = self.env['account.fiscal.position'].sudo().get_fiscal_position(partner_supplier.id)
        invoice_vals = {
            'ref': '',
            'invoice_date': self.order_id.date_order,
            # 'move_type': move_type,
            'narration': self.order_id.note,
            'currency_id': partner_supplier.property_purchase_currency_id.id or self.env.company.currency_id.id,
            # 'invoice_user_id': self.user_id and self.user_id.id,
            'partner_id': partner_supplier.id,
            'fiscal_position_id': fpos.id,
            # 'payment_reference': self.partner_ref or '',
            # 'partner_bank_id': self.partner_id.bank_ids[:1].id,
            'invoice_origin': self.order_id.name,
            'invoice_payment_term_id': partner_supplier.property_supplier_payment_term_id.id,
            'invoice_line_ids': [],
            'company_id': self.company_id.id,
        }
        return invoice_vals

    def _purchase_service_prepare_line_values(self, vendor_bill, quantity=False):
        self.ensure_one()
        # compute quantity from SO line UoM
        product_quantity = self.qty
        if quantity:
            product_quantity = quantity

        purchase_qty_uom = self.product_uom_id._compute_quantity(product_quantity, self.product_id.uom_po_id)

        fpos = vendor_bill.fiscal_position_id
        taxes = fpos.map_tax(self.product_id.supplier_taxes_id)
        if taxes:
            taxes = taxes.filtered(lambda t: t.company_id.id == self.company_id.id)

        # compute unit price
        price_unit = self.env['account.tax'].sudo()._fix_tax_included_price_company(self.price_unit, self.product_id.supplier_taxes_id, taxes, self.company_id)
        if vendor_bill.currency_id and self.currency_id != vendor_bill.currency_id:
            price_unit = self.currency_id.compute(price_unit, vendor_bill.currency_id)

        # accounts = self.product_id.product_tmpl_id.get_product_accounts(fiscal_pos=fpos)
        # account_id = accounts['expense'] or vendor_bill.journal_id.default_account_id

        res = {
            'name': self.full_product_name,
            'product_id': self.product_id.id,
            'product_uom_id': self.product_id.uom_po_id.id,
            'quantity': purchase_qty_uom,
            'price_unit': price_unit,
            'tax_ids': [(6, 0, taxes.ids)],
            # 'account_id' : account_id.id,
            'pos_order_line_id': self.id,
        }
        if not vendor_bill:
            return res

        if self.currency_id == vendor_bill.company_id.currency_id:
            currency = False
        else:
            currency = vendor_bill.currency_id

        res.update({
            'move_id': vendor_bill.id,
            'currency_id': currency and currency.id or False,
            'date_maturity': vendor_bill.invoice_date_due,
            'partner_id': vendor_bill.partner_id.id,
        })
        return res

    def _purchase_service_create(self, quantity=False):
        """ On Sales Order confirmation, some lines (services ones) can create a purchase order line and maybe a purchase order.
            If a line should create a RFQ, it will check for existing PO. If no one is find, the SO line will create one, then adds
            a new PO line. The created purchase order line will be linked to the SO line.
            :param quantity: the quantity to force on the PO line, expressed in SO line UoM
        """
        AccountMove = self.env['account.move'].with_context(default_move_type='in_invoice')
        supplier_invoice_map = {}
        sale_line_purchase_map = {}
        for line in self:
            line = line.with_company(line.company_id)
            # determine vendor of the vendor bill
            partner_supplier = line.product_id.pd_partner_id
            if not partner_supplier:
                raise UserError(_("There is no vendor associated to the product %s. Please define a vendor for this product.") % (line.product_id.display_name,))

            if line.product_id.pd_check_type == 'individual':
                values = line._purchase_service_prepare_vendor_bill_values(partner_supplier)
                vendor_bill = AccountMove.create(values)
            else:
                # determine (or create) PO
                vendor_bill = supplier_invoice_map.get(partner_supplier.id)
                if not vendor_bill:
                    vendor_bill = AccountMove.search([
                        ('partner_id', '=', partner_supplier.id),
                        ('state', '=', 'draft'),
                        ('company_id', '=', line.company_id.id),
                        ('move_type', '=', 'in_invoice'),
                    ], limit=1)
                if not vendor_bill:
                    values = line._purchase_service_prepare_vendor_bill_values(partner_supplier)
                    vendor_bill = AccountMove.create(values)
                else:  # update origin of existing PO
                    so_name = line.order_id.name
                    origins = []
                    if vendor_bill.invoice_origin:
                        origins = vendor_bill.invoice_origin.split(', ') + origins
                    if so_name not in origins:
                        origins += [so_name]
                        vendor_bill.write({
                            'invoice_origin': ', '.join(origins)
                        })
            supplier_invoice_map[partner_supplier.id] = vendor_bill

            # add a PO line to the PO
            values = line._purchase_service_prepare_line_values(vendor_bill, quantity=quantity)
            vendor_bill.write({'invoice_line_ids': [(0, 0, values)]})
            # vendor_bill_line = line.env['account.move.line'].create(values)

            # link the generated purchase to the SO line
            # sale_line_purchase_map.setdefault(line, line.env['account.move.line'])
            # sale_line_purchase_map[line] |= vendor_bill_line
        return True
