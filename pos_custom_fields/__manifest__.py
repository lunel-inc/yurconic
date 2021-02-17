# -*- coding: utf-8 -*-
{
    'name': 'POS Custom Fields',
    'author': 'LuNel, Inc',
    'summary': 'Manage custom fields in POS',
    'description': "",
    'license': 'AGPL-3',
    'version': '1.0',
    'data': [
        'security/ir.model.access.csv',

        'views/product_view.xml',
        'views/custom_field_views.xml',
        'views/point_of_sale_assets.xml',

    ],
    'qweb': ['static/src/xml/Popups/CustomFieldPopup.xml'],
    'category': 'Sales/Point of Sale',
    'depends': ['point_of_sale'],
    'demo': [],
    'installable': True,
    'application': False,
}
