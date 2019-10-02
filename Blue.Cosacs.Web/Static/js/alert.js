/*global define*/
define(['jquery', 'confirm'], function($, confirm) {
    "use strict";
    var $c = $('#confirm');
    return function(text, title, callback) {
        var $cancel = $c.find('button.cancel').hide();
        return confirm(text, title, function() {
            if (callback !== undefined && callback !== null) {
                callback();
            }
            return $cancel.show();
        });
    };
});