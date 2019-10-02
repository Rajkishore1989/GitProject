/*global define*/
define(['jquery', 'url', 'admin/additionalProfile', 'styleBootstrapInputLabels', 'notification', 'jquery.validate.unobtrusive', 'jquery.pickList'],
    function ($, url, addProfile, bootstrapInputLabels, notification) {
    'use strict';
    return {
        init: function ($el) {
            var branchNoLoaded, editor, setCancel, setEdit, setSave, viewer;
            editor = $el.find('#editor');
            viewer = $el.find('#viewer');
            branchNoLoaded = false;
            setEdit = function () {
                return $el.find('#edit').on('click', function () {
                    editor.show();
                    viewer.hide();
                    if (!branchNoLoaded) {
                        $('#BranchNo').pickList();
                    }
                    branchNoLoaded = true;
                    editor.find(".chzn-container")
                          .removeAttr("style")
                          .addClass("picklist"); // style select boxes on the form (bootstrap)

                    $el.find('input.form-control, input.picklist').each(function() {
                        var idAttr, tmpInput, tmpSelect;
                        idAttr = $(this).attr('id');
                        tmpInput = $el.find('input.form-control#' + idAttr);
                        tmpSelect = $el.find('input.picklist#' + idAttr);
                        return bootstrapInputLabels(tmpInput, tmpSelect);
                    });

                    return $.validator.unobtrusive.parse(editor);
                });
            };

            $('#userLogin').blur(function(){
                var txt = $('#userLogin');

                if (txt.val().length > 0){
                    var values = {
                        Login : txt.val(),
                        current: txt.attr('currentUser')
                    };

                    $.post(url.resolve('Admin/Users/CheckLoginUpdate'), values, function (data) {
                       if (data){
                           txt.addClass('input-validation-error');
                       }
                        else{
                           txt.removeClass('input-validation-error');
                       }
                        return true;
                    });
                }
            });

            setEdit();
            setSave = function () {
                return $el.find('#save').on('click', function () {
                    var form;
                    form = editor.find('form');
                    if (form.valid()) {
                        $.post(url.resolve('/Admin/Users/Details'), form.serialize(), function (data) {
                            if ($(data).find('form').length > 0) {
                                editor.replaceWith(data);
                                editor = $el.find('#editor').show();
                                setSave();
                            } else {
                                $('.field-validation-error').html('');
                                $('input.input-validation-error').removeClass('input-validation-error');
                                viewer.replaceWith(data);
                                viewer = $el.find('#viewer');
                                editor.hide();
                                setEdit();
                                setCancel();
                                notification.show("User details saved successfully.");
                            }
                        });
                    }
                });
            };
            setCancel = function () {
                return $el.find('#cancel').on('click', function () {
                    editor.hide();
                    return viewer.show();
                });
            };
            setSave();
            setCancel();
            return addProfile.init($el);
        }
    };
});
