/*global define*/
(function () {
    define(['jquery', 'url'], function ($, url) {
        "use strict";
        return {
            init: function ($el) {
                return $el.find('.action-unlock-client').on('click', function () {
                    var $tr, clientid;
                    $tr = $(this).parents('tr');
                    clientid = $tr.data('clientid');
                    return $.post(url.resolve('/Admin/LockedClients/UnlockClient'), {
                        ClientID: clientid
                    }, function () {
                        return $tr.remove();
                    });
                });
            }
        };
    });
}).call(this);
