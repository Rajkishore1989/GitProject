/*global define*/
define(['jquery', 'modal'], function ($) {
    "use strict";
    var $c = $('#confirm').modal({
            show: false
        }),
        result = false;

    return function (text, title, callback, hidebuttons, actionOkText) {
        $c.find('button.ok').text(actionOkText || 'OK');
        if (hidebuttons) {
            $c.find('button.cancel').hide();
            $c.find('button.ok').hide();
        }
        result = false;
        return $c.find('h3').html(title).end()
                 .find('p').html(text || '').end()
                 .find('button.ok').off('click').on('click',function () {
                    result = true;
                    return $c.modal('hide');
                }).end().find('button.cancel').off('click').on('click',function () {
                    result = false;
                    return $c.modal('hide');
                }).end()
                .modal('show').off('hide.bs.modal').on('hide.bs.modal', function () {
                    if (callback !== null) {
                        return callback(result);
                    }
                });
    };
});
