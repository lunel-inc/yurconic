import logging
from odoo import fields, models

_logger = logging.getLogger(__name__)


class ProductProduct(models.Model):
    _inherit = "product.product"

    custom_field_ids = fields.One2many('custom.field', 'product_id', string='Custom Fields', copy=True)
