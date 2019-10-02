/* global define,document*/
define(['jquery', 'url'], function ($, url) {
    "use strict";
    var serverUrl = url.resolve('Exceptions'),
        handleError = function (message, url, line, col) {
            $.post(serverUrl, {
                message: message,
                scriptUrl: url,
                line: line,
                documentUrl: document.location.href
            });
            return false;
        };
    return {
        init: function () {
            var handler = window.onerror = handleError;
            return handler;
        }
    };
});
