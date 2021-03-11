from odoo import fields, models, api, _


class CustomFieldAnswer(models.Model):
    _name = 'custom.field.answer'
    _rec_name = 'value'
    _order = 'sequence, id'
    _description = 'Custom Field Label'

    custom_field_id = fields.Many2one('custom.field', string='Custom Field', ondelete='cascade')
    sequence = fields.Integer('Label Sequence order', default=10)
    value = fields.Char('Suggested value', translate=True, required=True)
    product_id = fields.Many2one('product.product', string='Product', ondelete='cascade', domain="[('available_in_pos','=',True)]")
