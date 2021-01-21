# -*- coding: utf-8 -*-
from odoo import fields, models, api, _


class ResCompany(models.Model):
    _inherit = "res.company"

    account_penndot_partner_id = fields.Many2one('res.partner', string="Default PennDOT Vendor")
