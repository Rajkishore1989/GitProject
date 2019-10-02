/* global define*/
define(['jquery', 'lib/jquery.ui.datepicker.customized'], function ($) {
    "use strict";
    $.datepicker.setDefaults({
        dateFormat: 'yy-mm-dd',
        changeMonth: true,
        changeYear: true
    });
});
