import logging

from odoo import models, fields

_logger = logging.getLogger(__name__)


class PosOrderLine(models.Model):
    _inherit = "pos.order.line"

    custom_field_value = fields.Html('Custom Field Value', default=False)

    def _order_line_fields(self, line, session_id=None):
        res = super(PosOrderLine, self)._order_line_fields(line, session_id)
        html_value = """
        <table class="table table-striped table-sm table-hover">
            <tbody>"""
        for custom_value in res[2]['custom_field_value']:
            if custom_value.get('key', '') == 'qty_update' or custom_value.get('key', '') == 'add_product':
                continue

            html_value += """
                <tr class="collapse show o_ws_category_1">
                    <td>
                        <span>""" + custom_value.get('key', '') + """</span>
                    </td>
                    <td>
                        <span>""" + custom_value.get('value', '') + """</span>
                    </td>
                </tr>
            """
        html_value += """
            </tbody>
        </table>"""
        res[2]['custom_field_value'] = html_value
        return res
