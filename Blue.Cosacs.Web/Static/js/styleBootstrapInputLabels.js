/*global define, alert */
define(['jquery', 'jquery.validate.unobtrusive'], function ($) {
    "use strict";

    var findGroupElement = function(element) {
        return element.closest('.form-group');
    };
    var findFormElement = function(element) {
        return element.closest('form');
    };

    return function (inputElement, selectElement) {

        if ((inputElement === null || inputElement === undefined) &&
            (selectElement === null || selectElement === undefined)) {
            return null;
        }

        if (!$.contains(document.documentElement, inputElement[0])) {
            inputElement = $(inputElement);
        }

        var groupElement = null,
            formElement = null,
            pickListValidationElement = null;

        if (inputElement.length > 0) {

            groupElement = findGroupElement(inputElement);
            formElement = findFormElement(groupElement);

            if (groupElement.length > 0) {
                inputElement.change(function() {

                    $.validator.unobtrusive.parse(formElement);
                    formElement.valid();

                    if ($(this).hasClass('input-validation-error')) {
                        groupElement.addClass('has-error');
                    } else {
                        groupElement.removeClass('has-error');
                    }
                });
                inputElement.keyup(function() {
                    $(this).trigger('change');
                });
            }

            setTimeout(function () { inputElement.trigger('change'); }, 100);
        }

        if (!$.contains(document.documentElement, selectElement[0])) {
            selectElement = $(selectElement);
        }
        if (selectElement.length > 0) {

            pickListValidationElement = selectElement.closest('.pickListInputValidationClass');
            groupElement = findGroupElement(selectElement);
            formElement = findFormElement(groupElement);

            if (pickListValidationElement.length > 0 &&
                groupElement.length > 0 && formElement.length > 0) {
                pickListValidationElement.change(function () {
                    var tmpPickListElem = $(this).find('input.picklist'),
                        tmpPickListVal = tmpPickListElem.val();

                    $.validator.unobtrusive.parse(formElement);
                    formElement.valid();

                    if (tmpPickListElem.length > 0 && tmpPickListVal && parseInt(tmpPickListVal, 10) > 0) {
                        $(this).removeClass("input-validation-error");
                        groupElement.removeClass('has-error');
                    } else {
                        $(this).addClass("input-validation-error");
                        groupElement.addClass('has-error');
                    }
                });
                pickListValidationElement.keyup(function() {
                    $(this).trigger('change');
                });
            }

            setTimeout(function () { pickListValidationElement.trigger('change'); }, 90);
        }

        return null;
    };
});
