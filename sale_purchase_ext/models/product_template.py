from odoo import models, fields, api, _
import logging

_logger = logging.getLogger(__name__)


class ProductTemplate(models.Model):
    _inherit = "product.template"

    is_create_pd_invoice = fields.Boolean('Create Cheque?', default=False, help="It will create vendor bill automatically whenever this product sold.")
    pd_cheque_type = fields.Selection([('batch', 'Batch'), ('individual', 'Individual')], string="Cheque", default='batch')
    pd_partner_id = fields.Many2one("res.partner", string="For Vendor")

    @api.onchange('is_create_pd_invoice')
    def onchange_is_create_pd_invoice(self):
        if self.is_create_pd_invoice:
            pd_partner_id = self.env.user.company_id and self.env.user.company_id.account_penndot_partner_id or False
            self.pd_partner_id = pd_partner_id.id if pd_partner_id else False
        else:
            self.pd_partner_id = False
