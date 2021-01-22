# -*- coding: utf-8 -*-
from odoo import fields, models, api, _


class AccountMoveLine(models.Model):
    _inherit = 'account.move.line'

    pos_order_line_id = fields.Many2one('pos.order.line', 'POS Order Line', ondelete='set null', index=True)
