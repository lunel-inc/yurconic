odoo.define('pos_custom_fields.ProductScreen', function (require) {
    'use strict';

    const ProductScreen = require('point_of_sale.ProductScreen');
    const Registries = require('point_of_sale.Registries');

    const CustomProductScreen = ProductScreen => class extends ProductScreen {

        saveChanges() {
            let processedChanges = {};
            for (let [key, value] of Object.entries(this.changes)) {
                if (this.intFields.includes(key)) {
                    processedChanges[key] = parseInt(value) || false;
                } else {
                    processedChanges[key] = value;
                }
            }
            if ((!this.props.partner.name && !processedChanges.name) ||
                processedChanges.name === '' ){
                return this.showPopup('ErrorPopup', {
                  title: _('A Customer Name Is Required'),
                });
            }
            processedChanges.id = this.props.partner.id || false;
            this.trigger('save-changes', { processedChanges });
        }

        async _clickProduct(event) {
            if (event.detail.custom_field_ids.length > 0) {
                const customFields = this._getCustomFields(event.detail);
                const {confirmed} = await this.showPopup('CustomFieldPopup', {
                    title: this.env._t('Please Fill Form'),
                    customFields: customFields,
                });
                if (confirmed) {
                }
                return;
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


