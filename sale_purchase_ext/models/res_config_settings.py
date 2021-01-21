# -*- coding: utf-8 -*-

from odoo import api, fields, models, _


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    penndot_partner_id = fields.Many2one(comodel_name='res.partner', string="Default PennDOT Vendor", related='company_id.account_penndot_partner_id', readonly=False)
