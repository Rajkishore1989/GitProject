/*global define*/
define(['jquery', 'alert', 'returnCodeActions', 'menu-hud'], function ($, alert, actions, menuHud) {
    "use strict";
    return {
        init: function (login) {
            var $logout;
            $('#navBack').on('click', function () {
                window.history.back();
                return false;
            });
            $('#navForward').on('click', function () {
                window.history.forward();
                return false;
            });
            $('#navReload').on('click', function () {
                window.location = window.location;
                return false;
            });
            $('#menu-hud-open').on('click', function () {
                menuHud.show();
                return false;
            });
            $logout = $('#logoff');
            $logout.on('click', function (e) {
                $.get($logout.attr('href'), function () {
                    //login();
                    sessionStorage.clear();
                    localStorage.clear();
                    window.location.href = '/login/';
                });
                e.preventDefault();
                //$('#menu li:not(.pre,.secondary)').remove();
                //$('#FooterBranch').text('');
                return false;
            });
            document.addEventListener('keyup', function (e) {
                if (e.altKey) {
                    if (e.keyCode === 71) {
                        menuHud.show();
                    }
                    else if (e.keyCode === 72) {
                        return $('#home').trigger('click');
                    } else if (e.keyCode === 76) {
                        return $logout.trigger('click');
                    }
                }
            }, false);
            $('#loader').hide().ajaxStart(function () {
                return $(this).show();
            }).ajaxStop(function () {
                    return $(this).hide();
                }).ajaxError(function () {
                    return $(this).hide();
                });
            return $.ajaxSetup({
                statusCode: actions
            });
        }
    };
});
