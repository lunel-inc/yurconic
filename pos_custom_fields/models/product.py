# -*- coding: utf-8 -*-

import logging
from odoo import fields, models

_logger = logging.getLogger(__name__)


class ProductProduct(models.Model):
    _inherit = "product.product"

    # packaging_ids = fields.One2many('product.packaging', 'product_id', 'Product Packages',
    #                                 help="Gives the different ways to package the same product.")
    # question_and_page_ids = fields.One2many('custom.fields', 'product_id', string='Sections and Questions', copy=True)
    custom_field_ids = fields.One2many('custom.field', 'product_id', string='Custom Fields', copy=True)
