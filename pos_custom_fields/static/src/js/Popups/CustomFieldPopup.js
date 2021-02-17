odoo.define('pos_custom_fields.CustomFieldPopup', function(require) {
    'use strict';

    const AbstractAwaitablePopup = require('point_of_sale.AbstractAwaitablePopup');
    const Registries = require('point_of_sale.Registries');

    // formerly ConfirmPopupWidget
    class CustomFieldPopup extends AbstractAwaitablePopup {

        constructor() {
            super(...arguments);
            this.changes = [];
        }

        get currentOrder() {
            return this.env.pos.get_order();
        }

        captureChange(event) {
            var product_id = event.target.getAttribute('product_id');

            if (!this.changes[product_id]){
                if (event.target.name === 'qty_update'){
                    if (!this.currentOrder) {
                        this.env.pos.add_new_order();
                    }
                    var product = this.env.pos.db.get_product_by_id(product_id);
                    this.currentOrder.add_product(product, {quantity: parseInt(event.target.value)});
                }
                else{
                    this.changes[product_id] = [{key: event.target.name, value: event.target.value}]
                }
            }else{
                var update_dict = false
                for (var key in this.changes[product_id]) {
                    if (this.changes[product_id][key]['key'] == event.target.name) {
                        this.changes[product_id][key]['value'] = event.target.value
                        update_dict = true
                        break;
                    }
                }
                if(!update_dict){
                    this.changes[product_id].push({key: event.target.name, value: event.target.value});
                }
            }
        }
    }
    CustomFieldPopup.template = 'CustomFieldPopup';
    CustomFieldPopup.defaultProps = {
        confirmText: 'Ok',
        cancelText: 'Cancel',
        title: 'Confirm ?',
        body: '',
        customFields: [],
    };

    Registries.Component.add(CustomFieldPopup);

    return CustomFieldPopup;
});

