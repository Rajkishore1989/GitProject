define(['lib/events', 'alert', 'url', 'confirm', 'single-click', 'lib/jquery.containsCaseInsensitive', 'lib/select2', 'jquery.pickList'],
    function (events, alert, url, confirm, singleClick) {
        var userId = function ($el) {
                return $el.data('userid');
            },
            init = function ($el) {
                var changePasswordEnterKey, recoverPassword, search;
                if ($('#divResetPassword').length > 0 && $('#divResetPassword').data('locked').toLowerCase() === 'true') {
                    $('#divResetPassword').hide();
                }
                events.on('Admin.User.Lock', function (locked) {
                    if (locked) {
                        $('#divResetPassword').hide();
                    } else {
                        $('#divResetPassword').show();
                    }
                });
                changePasswordEnterKey = function (e) {
                    if (event.keyCode === 13) {
                        return $('#buttonChangePassword').click();
                    }
                };
                $('#newPassword').on('keyup', changePasswordEnterKey);
                $('#currentPassword').on('keyup', changePasswordEnterKey);
                $('#confirmPassword').on('keyup', changePasswordEnterKey);
                $el.find('#addRole').chosen();
                $el.find('.glyphicons.bin').on('click', function () {
                    var roleId = $(this).data('roleid'),
                        roleName = $(this).parent().find('a').text();
                    return confirm("Are you sure you want to remove the role " + roleName + " from this user?", "Remove Role", function (ok) {
                        if (ok) {
                            return $.ajax({
                                type: 'POST',
                                url: url.resolve('/Admin/Roles/UnassignUserAndReturnPermissions'),
                                data: {
                                    roleId: roleId,
                                    userId: userId($el)
                                },
                                success: function (data) {
                                    $el.html($(data).html());
                                    init($el);
                                    return $el.find('#addRole').chosen(true);
                                }
                            });
                        }
                    });
                });
                $el.find('table tr:not(.hide)').filter(":odd").addClass('tableShade');
                $('#buttonChangePassword').on('click', function () {
                    var currentPassword, values;
                    if ($('#newPassword').val() !== $('#confirmPassword').val()) {
                        alert('The passwords you entered did not match', 'Change Password', function () {
                            singleClick.reset();
                        });
                    } else {
                        currentPassword = $('#currentPassword');
                        if (currentPassword.length === 0) {
                            values = {
                                currentPassword: '',
                                newPassword: $('#newPassword').val(),
                                userId: $('#buttonChangePassword').data('user')
                            };
                        } else {
                            values = {
                                currentPassword: $('#currentPassword').val(),
                                newPassword: $('#newPassword').val(),
                                userId: $('#buttonChangePassword').data('user')
                            };
                        }
                        return $.ajax({
                            url: url.resolve('/Admin/Users/ChangePassword'),
                            data: values,
                            type: 'POST',
                            success: function (data, textStatus, jqXHR) {
                                if (data.Successful === true) {
                                    alert('Password changed', 'Change Password');
                                    $('#currentPassword').val('');
                                    $('#newPassword').val('');
                                    $('#confirmPassword').val('');
                                } else {
                                    alert(data.Message, 'Change Password', function () {
                                        singleClick.reset();
                                    });
                                }
                            },
                            statusCode: {
                                401: function () {
                                    return alert('The current password is not correct.', 'Change Password', function () {
                                        singleClick.reset();
                                    });
                                }
                            }
                        });
                    }
                });
                recoverPassword = function () {
                    var reg = {
                        userName: $('#buttonResetPassword').data('user')
                    };
                    return $.post(url.resolve('/Login/RecoverPassword'), reg, function (data, textStatus, jqXHR) {
                        if (data.Successful) {
                            alert('We\'ve sent password reset instructions to your email address.', 'Recover Password');
                        } else {
                            alert(data.Comments, 'Recover Password');
                        }
                    });
                };
                $('#buttonResetPassword').on('click', recoverPassword);
                $el.find('#searchBox').keyup(function () {
                    return search($(this).val());
                });
                search = function (s) {
                    if (typeof s.length === 'undefined' || s.length === 0) {
                        $el.find('tbody > tr').show();
                    } else {
                        $el.find('tbody > tr').hide();
                        $el.find("tbody > tr > td:containsNC('" + s + "')").parent('tr').show();
                    }
                    return $el.find('table tr').not(':hidden').filter(":odd").addClass('tableShade');
                };
                $el.find('#searchBox').on('search', search);
                return $el.find('#addRole').change(function () {
                    var roleId = $(this).val();
                    if (roleId > 0) {
                        return $.ajax({
                            type: 'POST',
                            url: url.resolve('/Admin/Roles/AddRoleAndReturnPermissions'),
                            data: {
                                roleId: roleId,
                                userId: userId($el)
                            },
                            success: function (data) {
                                $el.html($(data).html());
                                init($el);
                                return $el.find('#addRole').chosen(true);
                            }
                        });
                    }
                });
            };
        return {
            init: init
        };
    });
