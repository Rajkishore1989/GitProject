/*global define*/
define(['jquery', 'url'], function ($, url) {
    'use strict';
    return {
        init: function () {
            var displayErrorMessage, formExist, recoverPassword, toggleRecoverPassword;
            formExist = $('#formRecoverPassword').length;
            if (formExist === 0) {
                displayErrorMessage = function (value) {
                    $('#divChangePasswordError').show();
                    return $('#divChangePasswordError').html(value);
                };
                toggleRecoverPassword = function (displayRecover) {
                    $('#mainContent').toggle();
                    $('#changePassword').toggle();
                    $('#divError').hide();
                    $('#divChangePasswordError').hide();
                    if (displayRecover) {
                        $('#inputChangePassword').focus();
                        return $('#inputChangePassword').val($('#username').val());
                    } else {
                        $('#password').focus();
                        return $('#inputChangePassword').val('');
                    }
                };
                recoverPassword = function () {
                    var reg;
                    if ($('#inputChangePassword').val().length === 0) {
                        return displayErrorMessage('Please fill the user');
                    } else {
                        reg = {
                            userName: $('#inputChangePassword').val()
                        };
                        return $.post(url.resolve('/Login/RecoverPassword'), reg, function (data, textStatus) {
                            if (data.Successful) {
                                toggleRecoverPassword(false);
                                $('#divError').show();
                                $('#divError').html('<div id="divSentMail">We\'ve sent password reset instructions to your email address.</div>');
                                $('#divError').css('visibility', 'visible');
                                return $('#divSentMail').fadeOut(6000 * 2, function () {
                                    return $('#divError').hide();
                                });
                            } else {
                                return displayErrorMessage(data.Comments);
                            }
                        });
                    }
                };
                $('#buttonRecover').on('click', recoverPassword);
                $("#inputChangePassword").off('keydown').on('keydown', function (e) {
                    var keyCode = (window.event) ? e.which : e.keyCode;

                    if (keyCode === 13) {
                        e.preventDefault();
                        recoverPassword();
                    }
                });
                $('#buttonCancel').on('click', function () {
                    return toggleRecoverPassword(false);
                });
                return $('#aForgetPassword').on('click', function () {
                    return toggleRecoverPassword(true);
                });
            }
        }
    };
});