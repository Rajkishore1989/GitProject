/*global define*/
define(['jquery'],
function ($) {
    'use strict';
    return {
        init: function ($el) {
            
            $('#fileUpload').on('change', function () {
                $('#fileName').html(this.value.split('/').pop().split('\\').pop());
            });
        }
    };
});