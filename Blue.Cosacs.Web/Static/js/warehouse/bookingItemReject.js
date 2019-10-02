/*global define*/
define(['jquery', 'jquery.pickList'], function ($) {
    "use strict";
    return {
        init: function () {
            $('.deselect').change(function () {
                if ($(this).val().length === 0) {
                    $(this).parents('td').find('.delQuantity').hide();
                    $(this).parents('.panel').find('.delQuantity').hide();
                } else {
                    $(this).parents('td').find('.delQuantity').show();
                    $(this).parents('.panel').find('.delQuantity').show();
                }
            });

            $('select.rejectItemSel').pickList({ allow_single_deselect: true });
            $('.delQtySel').chosen({ allow_single_deselect: true });
            $('.delQuantity').hide();
        }
    };
});
