odoo.define('pos_custom_fields.ProductScreen', function (require) {
    'use strict';

    const ProductScreen = require('point_of_sale.ProductScreen');
    const Registries = require('point_of_sale.Registries');
    var core = require('web.core');
    var _t = core._t;

    const CustomProductScreen = ProductScreen => class extends ProductScreen {

        async _clickProduct(event) {
            if (event.detail.custom_field_ids.length > 0) {
                const customFields = this._getCustomFields(event.detail);
                let { confirmed, payload } = await this.showPopup('CustomFieldPopup', {
                    title: this.env._t('Please Fill Form'),
                    customFields: customFields,
                    selected_product:event.detail,
                });
                if (confirmed) {
/*                    if (!this.check_error_fields({})) {
                        this.update_status('error', _t("Please fill in the form correctly."));
//                        this.props.resolve({ confirmed: false});
//                        return await confirmed;
//                        Promise.reject();
                        return;
                    }*/
                    this.currentOrder.add_product(event.detail, {
                        quantity: 1,
                    });
                }
            } else {
                return super._clickProduct(...arguments);
            }
        }

        _getCustomFieldsByID(id) {
            var custom_field_ids = this.env.pos.custom_field_ids
            var custom_field_value = {}
            for (var i = 0; i < custom_field_ids.length; i++) {
                if (custom_field_ids[i].id === id) {
                    if (custom_field_ids[i]['add_product_id']){
                        var sub_product = this.env.pos.db.get_product_by_id(custom_field_ids[i]['add_product_id'][0])
                        var result = this._getCustomFields(sub_product)
                        custom_field_ids[i]['add_product_id'].push(result)
                    }
                    return custom_field_ids[i]
                }
            }
        }

        _getCustomFields(product) {
            var results = [];
            for (var i = 0; i < product.custom_field_ids.length; i++) {
                results.push(this._getCustomFieldsByID(product.custom_field_ids[i]));
            }
            return results
        }
    };

    Registries.Component.extend(ProductScreen, CustomProductScreen);

    return ProductScreen;
});


