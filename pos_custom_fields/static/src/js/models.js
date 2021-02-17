odoo.define('pos_custom_fields.models', function (require) {

var models = require('point_of_sale.models');
const ProductScreen = require('point_of_sale.ProductScreen');

models.load_fields('product.product', 'custom_field_ids');

models.load_models([{
    model:  'custom.field',
    fields: ['title', 'is_page', 'product_id', 'sequence','field_ids','field_type','constr_mandatory','constr_error_msg','is_conditional', 'is_custom_qty', 'add_product_id'],
    loaded: function(self, custom_field_ids) {
        _.map(custom_field_ids, function (custom_field_id) { custom_field_id.custom_field_answer_ids = []; });
        self.custom_field_ids = custom_field_ids
    }
},
{
    model:  'custom.field.answer',
    fields: ['custom_field_id', 'sequence', 'value'],
    loaded: function(self, custom_field_answer_ids) {
//        self.custom_field_answer_ids = custom_field_answer_ids
        var custom_field_by_id = {};
        _.each(self.custom_field_ids, function (custom_field_id) {
            custom_field_by_id[custom_field_id.id] = custom_field_id;
        });

        _.each(custom_field_answer_ids, function (field_answer) {
            var custom_field = custom_field_by_id[field_answer.custom_field_id[0]];
            custom_field.custom_field_answer_ids.push(field_answer);
        });
    }
}
]);
});
