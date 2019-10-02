/*global define, $, window*/
define(['url', 'pjax', 'recoverPassword', 'text!admin/Templates/Login.htm', 'localisation', 'single-click'],

function (url, pjax, recoverPassword, loginTemplate, localisation, singleClick) {
    'use strict';

    var Result = {
        Ok: 'Ok',
        TooSimple: 'TooSimple',
        MustChange: 'MustChange',
        EqualsOld: 'EqualsOld'
    },
    go = pjax.go,
        displayErrorWarningMessage = function (value, mainElement, isError) {
            var ele = $(mainElement).find((isError) ? '#divError' : '#divWarning');
            $(ele).fadeIn('fast');
            return $(ele).html(value);
        },
        checkResolution = function() {
            var viewportWidth = $(window).width(); // Browser width
            var screenWidth = screen.width; //Screen width

            if (screenWidth < 1200) {
                displayErrorWarningMessage('Your screen resolution is too small to use Cosacs properly. The minimum supported is 1280x768 px.', $('#login'), true);
            } else {
                $('#divError').hide();

                if (viewportWidth < 1200) {
                    displayErrorWarningMessage('Your browser window is too small. Please resize at least to 1280x768 px or maximize it.', $('#login'), false);
                } else {
                    $('#divWarning').hide();
                }
            }            
        },
        displayConfirmChangePassArea = function () {
            $('#divConfirmChangePass').show();
            $('#aForgetPassword').hide();
            $('#username').css('background-color', '#ddd');
            return $('#password').css('background-color', '#ddd');
        },
        hideConfirmChangePassArea = function () {
            $('#divConfirmChangePass').hide();
            $('#divChangePasswordError').hide();
            $('#aForgetPassword').show();
            $('#username').css('background-color', 'white');
            return $('#password').css('background-color', 'white');
        },
        stateForm = Result.Ok,
        stateFormRecPassword = Result.Ok,
        recPass = function () {
            $('#recoverPassword').find('form#recover-password').on('submit', function (e) {
                var values;
                if ($('#newPassword').val() !== $('#confirmPassword').val()) {
                    displayErrorWarningMessage('The password you entered did not match', $('#recoverPassword'), true);
                    e.preventDefault();
                    $('#newPassword').focus();
                    singleClick.reset();
                }
                values = {
                    user: $('#username').val(),
                    token: $('#hiddenToken').val(),
                    newPassword: $('#newPassword').val()
                };
                $.ajax({
                    url: url.resolve('/Login/ChangePassword'),
                    data: values,
                    type: 'POST',
                    success: function (data) {
                        stateFormRecPassword = data.Result;
                        if (stateFormRecPassword === Result.Ok) {
                            window.location = data.NewPage;
                        } else {
                            displayErrorWarningMessage(data.Message, $('#recoverPassword'), true);
                            $('#newPassword').focus();
                            singleClick.reset();
                        }
                    },
                    statusCode: {
                        401: function () {
                            displayErrorWarningMessage('Invalid password change request.', $('#recoverPassword'), true);
                            singleClick.reset();
                        }
                    }
                });
                e.preventDefault();
            });
        };

    return {
        recPassInit: recPass,
        loginInit: function () {
            var $login = $('#login');
            if ($login.length === 0) {
                $('#center').html(loginTemplate);
                hideConfirmChangePassArea();
                $('#changePassword').hide();
                $('#divError').hide();

                checkResolution();
                $(window).resize(function() {
                    checkResolution();
                });

                $('#username, #password').on('keyup', function (e) {
                    var code = e.which;
                    if (code !== 13) {
                        $('#divError').fadeOut('fast');
                    } 
                });

                $login = $('#login');
                $login.find('form').on('submit', function (e) {
                    if (stateForm !== Result.Ok) {
                        if ($('#newPassword').val() !== $('#confirmPassword').val()) {
                            displayErrorWarningMessage('The passwords you entered did not match', $login, true);
                            e.preventDefault();
                            $('#newPassword').focus();
                            return;
                        }
                    }
                    $.ajax({
                        url: url.resolve('/Login'),
                        data: $(this).serialize(),
                        type: 'POST',
                        success: function (data) {
                            stateForm = data.Result;
                            if (stateForm === Result.Ok) {
                                localStorage.clear();
                                sessionStorage.clear();
                                localStorage.User = JSON.stringify(data.User);
                                localStorage.config = JSON.stringify(data.Config);
                                hideConfirmChangePassArea();
                                $login.hide().find('input[type=password]').val('');
                                localisation.fetchLocalisationSettings().then(function () {
                                    go('/' /*window.location.href*/ , false); //system redirects to homepage everytime users successfully log in
                                });
                            } else if (stateForm === Result.MustChange) {
                                displayConfirmChangePassArea();
                                displayErrorWarningMessage(data.Message, $('#login'), true);
                                $('#newPassword').focus();
                            } else {
                                displayErrorWarningMessage(data.Message, $('#login'), true);
                                $('#newPassword').focus();
                            }
                        },
                        statusCode: {
                            401: function (response) {
                                try {
                                    var data = JSON.parse(response.responseText);
                                    if (data.locked) {
                                        displayErrorWarningMessage(data.lockedMessage, $('#login'), true);
                                    } else {
                                        displayErrorWarningMessage('Login failed. Please check your credentials.', $('#login'));
                                        $login.find('input[type=password]').val('');
                                    }
                                } catch (exc) {
                                    //do something
                                    displayErrorWarningMessage(response.responseText, $('#login'), true);
                                }
                            }
                        }
                    });

                    e.preventDefault();
                });
                recPass();
                recoverPassword.init();
            }
            return $login;
        }
    };
});