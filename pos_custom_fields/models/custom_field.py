# -*- coding: utf-8 -*-

import logging
from odoo import fields, models, api, _
from odoo.exceptions import UserError

_logger = logging.getLogger(__name__)


class CustomFields(models.Model):
    _name = "custom.field"
    _description = "Custom Field"
    _rec_name = 'title'
    _order = 'sequence, id'

    @api.model
    def default_get(self, fields):
        defaults = super(CustomFields, self).default_get(fields)
        if (not fields or 'field_type' in fields):
            defaults['field_type'] = 'char_box'
        return defaults

    # question generic data
    title = fields.Char('Title', required=True, translate=True)
    is_page = fields.Boolean('Is a page?')
    product_id = fields.Many2one('product.product', string='Product', ondelete='cascade')
    sequence = fields.Integer('Sequence', default=10)
    # page specific
    field_ids = fields.One2many('custom.field', 'product_id', string='Custom Fields')  # TODO: Removed compute.
    # question specific
    field_type = fields.Selection([
        ('char_box', 'Single Line Text Box'),
        ('add_product', 'Add Product'),
        ('simple_choice', 'Multiple choice: only one answer'),
        ('multiple_choice', 'Multiple choice: multiple answers allowed')], string='Field Type', readonly=False, store=True)
    # question validation
    constr_mandatory = fields.Boolean('Mandatory Answer')
    constr_error_msg = fields.Char('Error message', translate=True, default=lambda self: _("This question requires an answer."))
    # answers
    # user_input_line_ids = fields.One2many('survey.user_input.line', 'product_id', string='Answers',
    #                                       domain=[('skipped', '=', False)], groups='survey.group_survey_user')
    custom_field_answer_ids = fields.One2many('custom.field.answer', 'custom_field_id', string='Custom Field Answer', copy=True,
                                              help='Labels used for proposed choices: simple choice, multiple choice and columns of matrix')
    add_product_id = fields.Many2one('product.product', string='Select Product', domain="[('available_in_pos','=',True)]")
    is_custom_qty = fields.Boolean("Custom QTY?")
    # Conditional display
    is_conditional = fields.Boolean(
        string='Conditional Display', copy=False, help="""If checked, this question will be displayed only 
        if the specified conditional answer have been selected in a previous question""")

    @api.constrains('custom_field_answer_ids')
    def _constraint_percentage(self):
        for record in self:
            if record.field_type == 'simple_choice' and len(record.custom_field_answer_ids.mapped('product_id')) and len(
                    record.custom_field_answer_ids.mapped('product_id')) != len(record.custom_field_answer_ids):
                raise UserError(_("Either select all product or don't select product in Custom Field: {}'s Answers!!!".format(record.title)))
