/*global define*/
define(['jquery', 'url', 'styleBootstrapInputLabels', 'jquery.pickList', 'chosen.jquery', 'jquery.validate.unobtrusive'], function ($, url, bootstrapInputLabels) {
    return {
        init: function ($el) {
            var minAlphanumericCharNum, minPasswordLength;
            $el.find('.picklist').pickList();
            $.validator.unobtrusive.parse($el);
            setTimeout(function () {
                return $el.find('.pickListInputValidationClass').trigger('change');
            }, 100);
            minPasswordLength = $el.data('minPasswordLength');
            minAlphanumericCharNum = $el.data('minAlphanumericCharNum');

            $.validator.addMethod("validatePasswordComplexity", function (value, element, param) {
                var nonAlphanumChars;
                nonAlphanumChars = value.replace(/[a-z0-9]/gi, '').length;
                if (!isNaN(nonAlphanumChars) && value.length >= minPasswordLength && nonAlphanumChars >= minAlphanumericCharNum) {
                    return true;
                }
                return false;
            }, "The password does not match the minimum complexity. Minimum password length is " + minPasswordLength + ", and should include at least " + minAlphanumericCharNum + " non Alphanumeric characters.");
            $.validator.addClassRules("passwordComplexity", {
                validatePasswordComplexity: true
            });
            $('#createUserForm').validate({
                rules: {
                    validatePasswordComplexity: true,
                    Login: {
                        required: true,
                        remote: url.resolve('Admin/Users/CheckLogin')
                    }
                },
                messages: {
                    Login: {
                        remote: $.format('{0} is already in use')
                    }
                }
            });

            $el.find('input.form-control, input.picklist').each(function () {
                var idAttr, tmpInput, tmpSelect;
                idAttr = $(this).attr('id');
                tmpInput = $el.find('input.form-control#' + idAttr);
                tmpSelect = $el.find('input.picklist#' + idAttr);
                return bootstrapInputLabels(tmpInput, tmpSelect);
            });
            return $el.find('.chzn-container').removeAttr("style").addClass("picklist");
        }
    };
});