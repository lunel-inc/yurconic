odoo.define('pos_custom_fields.models', function (require) {

    var models = require('point_of_sale.models');
    var _super_orderline = models.Orderline.prototype;
    var _super_order = models.Order.prototype;

    models.load_fields('product.product', 'custom_field_ids');

    models.load_fields('pos.order.line', 'custom_field_value');

    models.load_models([{
        model: 'custom.field',
        fields: ['title', 'is_page', 'product_id', 'sequence', 'field_ids', 'field_type', 'constr_mandatory', 'constr_error_msg', 'is_conditional', 'is_custom_qty', 'add_product_id'],
        loaded: function (self, custom_field_ids) {
            _.map(custom_field_ids, function (custom_field_id) {
                custom_field_id.custom_field_answer_ids = [];
            });
            self.custom_field_ids = custom_field_ids
        }
    },

        {
            model: 'custom.field.answer',
            fields: ['custom_field_id', 'sequence', 'value', 'product_id'],
            loaded: function (self, custom_field_answer_ids) {
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


    models.Orderline = models.Orderline.extend({
        initialize: function (attr, options) {
            _super_orderline.initialize.call(this, attr, options);
            this.custom_field_value = "";
        },

        set_custom_field_values: function (custom_field_value) {
            this.order.assert_editable();
            this.custom_field_value = custom_field_value
            this.trigger('change', this);
        },

        export_as_JSON: function () {
            var json = _super_orderline.export_as_JSON.apply(this, arguments);
            json.custom_field_value = this.custom_field_value;
            return json;
        },

        init_from_JSON: function (json) {
            _super_orderline.init_from_JSON.apply(this, arguments);
            this.custom_field_value = json.custom_field_value;
        },
    });

    models.Order = models.Order.extend({
        add_product: function (product, options) {
            var res = _super_order.add_product.apply(this, arguments);
            if (options.custom_field_value !== undefined) {
                this.get_last_orderline().set_custom_field_values(options.custom_field_value);
            }
        },
    })

});
