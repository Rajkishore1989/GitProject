/* global define*/
define(['jquery'], function ($) {
    "use strict";
    return {
        init: function ($el) {
            return $el.find('.module .head').on('click', function () {
                return $(this).next().toggle();
            });
        }
    };
});
