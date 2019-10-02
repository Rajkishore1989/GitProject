/*global define,window*/
define(['alert'], function (alert) {
    'use strict';
    return {
        400: function () {
            // Do nothing
        },
        401: function () {
            window.location.href = '/login/';
        },
        403: function (jqXHR) {
            return alert(jqXHR.responseText || jqXHR, 'Forbidden');
        },
        404: function () {
            return alert('We are sorry, but the page you requested was not found.', 'Page Not Found');
        },
        500: function (jqXHR, textStatus, error) {
            var message = error;
            if (jqXHR.responseText) {
                var $msg = $(error.responseText);
                message = $msg.find('.error').html();
            }

                    if (jqXHR.status) {
                        message = jqXHR.message;
                    }  else if (!message) {
                message = 'There was an error while trying to process your request.';
            }

                    if (typeof jqXHR !== 'string' && !jqXHR.status) {
                var errorId = jqXHR.getResponseHeader('X-ErrorLogId');
                if (errorId) {
                    message += '<br/><br/>Error Id: ' + errorId;
                }
            }

            return alert(message, 'Application Error'); // Angular error
        }
    };
});
