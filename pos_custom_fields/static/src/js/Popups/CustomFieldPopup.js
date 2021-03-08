odoo.define('pos_custom_fields.CustomFieldPopup', function(require) {
    'use strict';

    const { useListener } = require('web.custom_hooks');
    const Registries = require('point_of_sale.Registries');
    const AbstractAwaitablePopup = require('point_of_sale.AbstractAwaitablePopup');
    var core = require('web.core');
    var _t = core._t;

    class CustomFieldPopup extends AbstractAwaitablePopup {

        constructor() {
            super(...arguments);
            useListener('click-save', () => this.env.bus.trigger('save-customfields'));
            useListener('add-product', this.add_product_to_localstorage);
            this.changes = [];
            var selected_product = arguments[1].selected_product
            this.changes[selected_product.id] = [{key: 'add_product', value: 1}]
        }

        mounted() {
            this.env.bus.on('save-customfields', this, this.saveChanges);
        }

        willUnmount() {
            this.env.bus.off('save-customfields', this);
        }

        get currentOrder() {
            return this.env.pos.get_order();
        }

        getCheckboxValues(event){
            var checked_tags = $(event.currentTarget.closest('.s_pos_form_field')).find('input[type=checkbox]:checked');
            var checked_tag_values = ''
            _.each(checked_tags, function (checked_tag) {
                checked_tag_values += checked_tag.getAttribute('choice') + ", "
            });
            return checked_tag_values
        }

        captureChange(event) {
            var product_id = event.target.getAttribute('product_id');

            if (!this.changes[product_id]){
                this.changes[product_id] = [{key: event.target.name, value: event.target.value}]
            }else{
                var update_dict = false
                for (var key in this.changes[product_id]) {
                    if (this.changes[product_id][key]['key'] == event.target.name) {
                        if (event.target.type === "checkbox"){
                            var checked_tag_values = this.getCheckboxValues(event)
                            this.changes[product_id][key]['value'] = checked_tag_values
                        }else{
                            this.changes[product_id][key]['value'] = event.target.value
                        }
                        update_dict = true
                        break;
                    }
                }
                if(!update_dict){
                    if (event.target.type === "checkbox"){
                        var checked_tag_values = this.getCheckboxValues(event)
                        this.changes[product_id].push({key: event.target.name, value: checked_tag_values});
                    }else{
                        this.changes[product_id].push({key: event.target.name, value: event.target.value});
                    }
                }
            }
        }

        saveChanges() {
            let processedChanges = {};
            this.trigger('add-product');
            if (!this.check_error_fields({})) {
                this.update_status('error', _t("Please fill in the form correctly."));
                return;
            }
            for (let [product_id, value] of Object.entries(this.changes)) {
                console.log(product_id, value)

                for (var i = 0; i < value.length; i++) {
                    if (value[i]['key'] === "qty_update" || value[i]['key'] === "add_product"){
                        if (!this.currentOrder) {
                            this.env.pos.add_new_order();
                        }
                        var product = this.env.pos.db.get_product_by_id(product_id);
                        this.currentOrder.add_product(product, {quantity: parseInt(value[i]['value']), custom_field_value: value});
                    }
                }
            }
            this.trigger('close-popup');
        }

        add_product_to_localstorage(event) {
            var add_product_selector = $('select[name="add_product"]');
            for(var i = 0; i < add_product_selector.length; i++){
                var product_id = add_product_selector[i].getAttribute('product_id');
                if (add_product_selector[i].value === "0"){
                    continue;
                }
                if (!this.changes[product_id]){
                    this.changes[product_id] = [{key: add_product_selector[i].name, value: $(add_product_selector[i]).closest("div .s_pos_form_field").find('#qty_update').val() || "1"}]
                }else{
                    var update_dict = false
                    for (var key in this.changes[product_id]) {
                        if (this.changes[product_id][key]['key'] == add_product_selector[i].name) {
                            this.changes[product_id][key]['value'] = $(add_product_selector[i]).closest("div .s_pos_form_field").find('#qty_update').val() || "1"
                            update_dict = true
                            break;
                        }
                    }
                    if(!update_dict){
                        this.changes[product_id].push({key: add_product_selector[i].name, value: add_product_selector[i].value});
                    }
                }
            }
        }

        check_error_fields(error_fields) {
            var self = this;
            var form_valid = true;
            // Loop on all fields
            $($.find('.s_pos_form_field')).each(function (k, field) { // !compatibility
                var $field = $(field);
                var field_name = $field.find('.client-address').attr('name')

                // Validate inputs for this field
                var inputs = $field.find('.s_website_form_input, .o_website_form_input').not('#editable_select'); // !compatibility
                var invalid_inputs = inputs.toArray().filter(function (input, k, inputs) {
                    // Special check for multiple required checkbox for same
                    // field as it seems checkValidity forces every required
                    // checkbox to be checked, instead of looking at other
                    // checkboxes with the same name and only requiring one
                    // of them to be checked.
                    if (input.required && input.type === 'checkbox') {
                        // Considering we are currently processing a single
                        // field, we can assume that all checkboxes in the
                        // inputs variable have the same name
                        var checkboxes = _.filter(inputs, function (input) {
                            return input.required && input.type === 'checkbox';
                        });
                        return !_.any(checkboxes, checkbox => checkbox.checked);

                    // Special cases for dates and datetimes
                    }
                    return !input.checkValidity();
                });

                // Update field color if invalid or erroneous
                $field.removeClass('o_has_error').find('.form-control, .custom-select').removeClass('is-invalid');
                if (invalid_inputs.length || error_fields[field_name]) {
                    $field.addClass('o_has_error').find('.form-control, .custom-select').addClass('is-invalid');
                    if (_.isString(error_fields[field_name])) {
                        $field.popover({content: error_fields[field_name], trigger: 'hover', container: 'body', placement: 'top'});
                        // update error message and show it.
                        $field.data("bs.popover").config.content = error_fields[field_name];
                        $field.popover('show');
                    }
                    form_valid = false;
                }
            });
            return form_valid;
        }

        update_status(status, message) {
            if (status !== 'success') { // Restore send button behavior if result is an error
                $($.find('.s_pos_form_field')).find('.s_website_form_send, .o_website_form_send')
                    .removeAttr('disabled').removeClass('disabled'); // !compatibility
            }
            var $result = $('#error_msg'); // !compatibility
            $result.replaceWith($('<span id="s_website_form_result" style="color: red;"><i class="fa fa-close mr4" style="padding: 20px;" role="img" aria-label="Error" title="Error"></i>Please fill required fields correctly.</span>'));
            if (status !== 'success'){
                return false
            }
        }

        cancel() {
            this.props.resolve({ confirmed: false, payload: null });
            this.trigger('close-popup');
        }
    }
    CustomFieldPopup.template = 'CustomFieldPopup';
    CustomFieldPopup.defaultProps = {
        cancelText: 'Discard',
    };

    Registries.Component.add(CustomFieldPopup);

    return CustomFieldPopup;
});

