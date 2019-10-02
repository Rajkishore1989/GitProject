/*global define*/
define(['jquery', 'forms', 'url', 'spa', 'Models', 'underscore', 'backbone', 'alert', 'confirm', 'moment', 'jquery.pickList', 'lib/select2', 'warehouse/bookingItemReject', 'single-click', 'chosen.jquery', 'datepicker'],

function ($, forms, url, spa, Models, _, Backbone, alert, confirm, moment, pickList, select2, reject, singleClick) {
    'use strict';

    return {
        init: function ($el) {
            var PickingItem, PickingItems, PickingItemsView, PickingView;
            PickingItem = Backbone.Model.extend({
                initialize: function () {
                    this.set('ItemComment', this.get('Comment'));
                }
            });
            PickingItems = Backbone.Collection.extend({
                model: PickingItem
            });
            PickingItemsView = forms.views.TableView.extend({
                initialize: function () {
                    this.template = _.template($('#pickingItemTemplate').html());
                    this.templateEmpty = _.template($('#pickingItemTemplateEmpty').html());
                    return this.render();
                },
                render: function () {
                    this.$el.html('');
                    this.collection.forEach(function (b) {
                        return this.$el.append(this.template(b.toJSON()));
                    }, this);
                    return this.empty();
                },
                setRejection: function (e) {
                    $(e.currentTarget).parents('tr').toggleClass('rejected');
                },
                events: {
                    'change .rejectItemSel': 'setRejection'
                }
            });
            PickingView = Backbone.View.extend({
                initialize: function () {
                    var date, keys, minDate, pickingItems;

                    _.bindAll.apply(_, [this].concat(_.functions(this)));
                    _.extend(this.$el, {
                        pickedBy: {
                            select: $('select[name=pickedBy]'),
                            view: $('.view.pickedBy')
                        },
                        checkedBy: {
                            select: $('select[name=checkedBy]'),
                            view: $('.view.checkedBy')
                        },
                        comment: $('[name=picking-comment]'),
                        save: $('#save'),
                        cancel: $('#cancel'),
                        edit: $('#edit'),
                        reprint: $('#reprint'),
                        pickedOn: {
                            date: $('#pickedOn'),
                            view: $('.view.pickedOn')
                        }
                    });
                    pickingItems = new PickingItems(this.model.Bookings);
                    $('.warning').hide();
                    $('.warning-date').hide();
                    $.ajax({
                        type: 'GET',
                        contentType: 'application/json',
                        url: url.resolve('/Admin/Users/UsersWithPermission/1404'),
                        success: function (data) {
                            $('#pickedBy').select2({
                                placeholder: 'Select an Employee',
                                allowClear: true,
                                data: data
                            });
                            return $('#checkedBy').select2({
                                placeholder: 'Select an Employee',
                                allowClear: true,
                                data: data
                            });
                        }
                    });
                    this.pickingView = new PickingItemsView({
                        el: '#pickingItems tbody',
                        collection: pickingItems
                    });
                    date = moment($('#createdOn').text(), 'DD/MM/YYYY');
                    minDate = date.format('YYYY/MM/DD');
                    this.$el.pickedOn.date.datepicker({
                        defaultDate: "0",
                        maxDate: "+0",
                        minDate: new Date(minDate),
                        dateFormat: "D, d MM, yy"
                    });
                    this.$el.save.on('click', this.save);
                    this.$el.reprint.on('click', this.reprint);
                    this.setDisplayValues();
                    if (this.options.startWithViewMode) {
                        this.enableViewMode();
                    } else {
                        this.enableEditMode();
                    }
                    reject.init();
                    $('select.pickList').pickList({
                        allow_single_deselect: true
                    });
                    keys = _.map($('.reasonDisplay strong'), function (i) {
                        return $(i).text();
                    });
                    pickList.k2v('Blue.Cosacs.Warehouse.PICKREJECT', keys, function (rows) {
                        $('.reasonDisplay strong').each(function () {
                            var v = rows[$(this).text()];
                            if (v) {
                                $(this).text(v);
                            }
                        });
                    });
                },
                isRejectedClick: function (e) {
                    var $e, $status;
                    $e = $(e.target);
                    $status = $e.parents('td:first').find('.edit.status');
                    if ($e.val() === "true") {
                        return $status.show();
                    } else {
                        return $status.hide();
                    }
                },
                save: function (e) {
                    var $item, check, isRejected, item, pickListConfirmation;
                    check = function () {
                        return $(this).val().length > 0;
                    };

                    var todaydate = new Date();
                    todaydate.setSeconds(59);
                    todaydate.setMinutes(59);
                    todaydate.setHours(23);
                    var creationdate = moment($('#createdOn').text(), 'DD/MM/YYYY');

                    if ($('.checkConfirm span').text() === 'Select an Employee' || $('.checkPick span').text() === 'Select an Employee') {
                        $('.warning-date').hide();
                        $('.warning').show();
                        return singleClick.reset();
                    } else if (this.$el.pickedOn.date.datepicker("getDate") > todaydate) {
                        $('.warning').hide();
                        $('.warning-date').empty().append("*Pick list confirmation date cannot be in the future. Please select a date between the Picklist creation date and today's date.").show();
                        return singleClick.reset();
                    } else if (this.$el.pickedOn.date.datepicker("getDate") < creationdate) {
                        $('.warning').hide();
                        $('.warning-date').empty()
                            .append("*Pick list confirmation date cannot be before the Picklist creation date. Please select a date between the Picklist creation date and today's date.").show();
                        return singleClick.reset();
                    } else {
                        isRejected = function ($item) {
                            var value = {
                                "true": $item.find('.edit.status select').val(),
                                "false": null
                            };
                            return value[$item.find('input[type=radio]:checked').val()];
                        };
                        pickListConfirmation = {
                            Id: this.model.Picking.Id,
                            PickedBy: $('#pickedBy').val(),
                            CheckedBy: $('#checkedBy').val(),
                            PickedOn: this.$el.pickedOn.date.datepicker("getDate"),
                            Comment: this.$el.comment.val(),
                            PickingItems: (function () {
                                var _i, _len, _ref, _results;
                                _ref = $('#pickingItems tbody tr');
                                _results = [];
                                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                                    item = _ref[_i];
                                    $item = $(item);
                                    _results.push({
                                        Id: $item.data('id'),
                                        Comment: $item.find('.itemNotes').val(),
                                        RejectedReason: $item.find('.rejectItemSel').val(),
                                        PickedQuantity: $item.find('.delQtySel').val()
                                    });
                                }
                                return _results;
                            })()
                        };
                        $.ajax({
                            type: 'PUT',
                            contentType: 'application/json',
                            url: url.resolve('/Warehouse/Picking/Confirmation'),
                            data: JSON.stringify(pickListConfirmation),
                            success: function (data) {
                                return spa.go("/Warehouse/Picking/Confirmation/" + pickListConfirmation.Id);
                            }
                        });
                        return false;
                    }
                },
                setDisplayValues: function () {
                    var pickedOnDatePickerDate;
                    this.$el.checkedBy.select.val(this.model.Picking.checkedBy);
                    this.$el.pickedBy.select.val(this.model.Picking.pickedBy);
                    pickedOnDatePickerDate = this.model.Picking.PickedOn ? new Date(moment(this.model.Picking.PickedOn).valueOf()) : new Date();
                    this.$el.pickedOn.date.datepicker("setDate", pickedOnDatePickerDate);
                    _.each(this.model.Bookings, function (item, index, list) {
                        if (item.PickingRejectedReason) {
                            return $("[data-id=" + item.Id + "] .edit.status select").val(item.PickingRejectedReason);
                        }
                    });
                    return $('select').trigger('liszt:updated');
                },
                enableViewMode: function () {
                    this.$el.checkedBy.view.text(this.$el.checkedBy.select.find("option:selected").text());
                    this.$el.pickedBy.view.text(this.$el.pickedBy.select.find("option:selected").text());
                    this.$el.pickedOn.view.text(this.$el.pickedOn.date.datepicker("getDate"));
                    _.each(this.model.Bookings, function (item, index, list) {
                        var pickingItemRow;
                        pickingItemRow = $("[data-id=" + item.Id + "]");
                        if (item.PickingRejectedReason) {
                            return pickingItemRow.find(".view.status").text(pickingItemRow.find(".edit.status option:selected").text());
                        }
                    });
                    $('.edit.status,.rejected,.success').hide();
                    this.$el.pickedOn.date.datepicker("disable");
                    this.$el.pickedOn.date.addClass("removebackground");
                    this.$el.cancel.hide();
                    this.$el.save.hide();
                    $('textarea').each(function (i, e) {
                        var txtarea;
                        txtarea = $(e);
                        return txtarea.replaceWith($("<div/>").text(txtarea.val()));
                    });
                    $('.chzn-container').hide();
                    this.$el.edit.show();
                    return $('.view.status').show();
                },
                enableEditMode: function (e) {
                    $('.view.status').hide();
                    this.$el.edit.hide();
                    $('.chzn-container').show();
                    this.$el.pickedOn.date.datepicker("show");
                    this.$el.cancel.show();
                    this.$el.save.show();
                    $('textarea').removeAttr('readonly');
                    $('.edit.status').hide();
                    return $('[name=IsRejected]').parent().show();
                },
                reprint: function (e) {
                    var listId = $(e.currentTarget).data('id');
                    confirm('You have chosen to reprint the pick list. If you continue, this will be audited. Would you like to reprint the pick list?',
                        'Audit confirmation', function (agree) {
                            if (agree) {
                                url.open('/Warehouse/Picking/Print/' + listId);
                            }
                        });

                    e.preventDefault();
                }
            });

            var pickingModel = $el.data("pickingModel"),
                viewMode = $el.data("viewMode"),
                pickingViewVal = new PickingView({
                    model: pickingModel,
                    startWithViewMode: viewMode
                });
        }
    };
});