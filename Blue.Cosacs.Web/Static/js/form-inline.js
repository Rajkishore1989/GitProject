/* global define */
define(['jquery', 'alert', 'confirm', 'underscore', 'backbone', 'notification', 'styleBootstrapInputLabels',
    'jquery.validate.unobtrusive', 'jquery.message'],
    function($, alert, confirm, _, Backbone, notification, bootstrapInputLabels) {
    'use strict';
    var MainForm, ajax, icon, rest;
    icon = function(cssClass, title) {
        return "<a class='glyphicons glyph-btn " + cssClass + "' href='#' title='" + title + "'></a>";
    };
    ajax = function(method, url, data, f) {
        return $.ajax({
            type: method,
            url: url,
            data: data,
            complete: f
        });
    };
    rest = {
        get: function(url, f) {
            return $.get(url, f, 'html');
        },
        del: function(url, f) {
            return ajax('DELETE', url, null, f);
        },
        put: function(url, data, f) {
            return ajax('PUT', url, data, f);
        },
        post: function(url, data, f) {
            return ajax('POST', url, data, f);
        }
    };
    MainForm = (function() {

        var Form = function($el, label, controller) {
            var _this = this;
            this.$el = $el;
            this.label = label;
            this.controller = controller;
            _.extend(this, Backbone.Events);
            this.templateNew = $('#templateNew').html();
            this.$el.find('.data tfoot .actions').html('').append(icon('action-new plus', 'New')).end().find('.action-new').on('click', function() {
                return _this.onNew();
            });
            this.viewActionsAll();
        };

        //Form.name = 'Form';

        Form.prototype.key = function(row) {
            return row.data('id');
        };

        Form.prototype.get = function(row, success) {
            var url;
            url = "" + this.controller + "/RecordEdit/" + (this.key(row));
            return rest.get(url, success);
        };

        Form.prototype.del = function(row) {
            var url,
            _this = this;
            url = "" + this.controller + "/" + (this.key(row));
            return rest.del(url, function(request) {
                if (request.status === 200) {
                    notification.show(_this.label + ' deleted successfully');
                    return row.remove();
                } else if (request.status === 400) {
                    return alert(request.statusText, "" + _this.label + " Not Deleted");
                }
            });
        };

        Form.prototype.create = function(row) {
            var data,
            _this = this;
            data = row.find('form').serialize();
            return rest.post(this.controller, data, function(request) {
                if (request.status === 201) {
                    _this.newRow = _this.oldRow = null;
                    return _this.prepareView(row, request.responseText);
                } else if (request.status === 400) {
                    return alert(request.statusText, "" + _this.label + " Not Saved");
                }
            });
        };

        Form.prototype.update = function(row) {
            var data, url,
            _this = this;
            data = row.find('form').serialize();
            url = "" + this.controller + "/" + (this.key(row));
            return rest.put(url, data, function(request) {
                if (request.status === 200) {
                    _this.newRow = _this.oldRow = null;
                    return _this.prepareView(row, request.responseText);
                } else if (request.status === 400) {
                    return alert(request.statusText, "" + _this.label + " Not Saved");
                }
            });
        };

        Form.prototype.viewActionsAll = function() {
            return this.viewActions(this.$el.find('.data tbody tr'));
        };

        Form.prototype.viewActions = function($rows) {
            var form;
            form = this;
            return $rows.find('.actions:empty').append(icon('action-delete bin', 'Delete')).append(icon('action-edit pencil', 'Edit')).end().find('.action-delete').on('click', function() {
                var row;
                row = $(this).parents('tr:first');
                confirm("Are you sure you want to delete this " + form.label + "?", "Delete " + form.label, function(ok) {
                    if (ok) {
                        return form.del(row);
                    }
                }, false, 'Delete');
                return false;
            }).end().find('.action-edit').on('click', function() {
                var _this = this;
                form.confirmEditCancel(function() {
                    var $row, $tbody;
                    $row = $(_this).parents('tr:first');
                    $tbody = $row.parents('tbody:first');
                    return form.get($row, function(html) {
                        var editForm = form.prepareEdit($(html).insertAfter($row.hide()), $row);
                        editForm.newRow.find(".chzn-container")
                                       .removeAttr("style")
                                       .addClass("picklist"); // style select boxes on the form (bootstrap)
                        return editForm;
                    });
                });
                return false;
            });
        };

        Form.prototype.prepareView = function(row, viewHtml) {
            row.hide();
            this.viewActions($(viewHtml).insertAfter(row));
            return row.remove();
        };

        Form.prototype.isEditing = function() {
            return !(_.isUndefined(this.newRow) || _.isNull(this.newRow));
        };

        Form.prototype.confirm = function(confirmRequired, confirmText, confirmTitle, action, actionOkText) {
            if (!confirmRequired) {
                return action();
            } else {
                return confirm(confirmText, confirmTitle, function(ok) {
                    if (ok) {
                        return action();
                    }
                }, false, actionOkText);
            }
        };

        Form.prototype.confirmEditCancel = function(action) {
            this.confirm(this.isEditing(), "Are you sure you want to cancel the current edit operation?", "Cancel Edit", action, "Stop editing");
            $('tfoot').hide();
            $('.pencil').hide();
            return false;
        };

        Form.prototype.cancelEdit = function() {
            var key;
            if (this.newRow) {
                key = this.newRow.data('id');
                this.newRow.remove();
                $('tfoot').show();
                $('.pencil').show();
                if (key !== 0 && this.oldRow) {
                    this.oldRow.show();
                }
                this.newRow = this.oldRow = null;
            }
            return false;
        };

        Form.prototype.finishEdit = function(element, isRowCreation) {
            var f, form;
            form = this.newRow.find('form');
            if (form.valid()) {
                f = this.key(this.newRow) === 0 ? this.create : this.update;
                _.bind(f, this)(this.newRow);
                $('tfoot').show();
                $('.pencil').show();
                notification.show(this.label + (isRowCreation ? ' added ' : ' saved ') + 'successfully');
            }
            return false;
        };

        Form.prototype.prepareEdit = function(newRow, oldRow, isRowCreation) {
            var _this = this;
            $('tfoot').hide();
            this.cancelEdit();
            this.newRow = newRow;
            this.oldRow = oldRow;
            $.validator.unobtrusive.parse(newRow);

            newRow.find('input.form-control, input.picklist').each(function () {
                var idAttr = $(this).attr('id');
                var tmpInput = newRow.find('input.form-control#' + idAttr);
                var tmpSelect = newRow.find('input.picklist#' + idAttr);

                bootstrapInputLabels(tmpInput, tmpSelect);
            });

            var actions = $(newRow).find('.actions');
                actions.append(icon('action-update floppy_disk', 'Save'));
                actions.append(icon('action-cancel undo', 'Cancel'));
            actions.find('.action-cancel')
                .on('click', _.bind(this.cancelEdit, this));
            actions.find('.action-update')
                .on('click', _.bind(this.finishEdit, this,
                                    this, isRowCreation)) // args
            .end().on('keypress', function(e) {
                if (e.keyCode === 13) {
                    return _this.finishEdit(this, isRowCreation);
                }
            });

            return this.trigger('edit', newRow);
        };

        Form.prototype.onNew = function() {
            var _this = this;
            this.confirmEditCancel(function() {
                var $row;
                $row = _this.$el.find('.data tbody').append(_this.templateNew).find('tr.edit:last');
                var isRowCreation = true;
                var editForm = _this.prepareEdit($row, undefined, isRowCreation);
                editForm.newRow.find(".chzn-container")
                               .removeAttr("style")
                               .addClass("picklist"); // style select boxes on the form (bootstrap)
                $('tfoot').hide();
                return $('.pencil').hide();
            });
            return false;
        };

        return Form;
    })();
    return {
        init: function($el) {
            return new MainForm($el, $el.data('label'), $el.data('controller'));
        }
    };
});
