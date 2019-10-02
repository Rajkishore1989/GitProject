define(['spa', 'jquery', 'forms', 'url', 'Models', 'underscore', 'backbone', 'notification', 'alert', 'confirm',
    'moment', 'warehouse/bookingItemReject', 'jquery.pickList', 'chosen.jquery', 'single-click', 'lib/bootstrap/tooltip',
    'sortable', 'lib/select2', 'lib/jquery.containsCaseInsensitive'],
    function (spa, $, forms, url, Models, _, Backbone, notification, alert, confirm, moment, reject, pickList, select2,
              singleClick) {
        'use strict';
        return {
            init: function ($el) {
                var Item, Items, ItemsView, searchNotes;
                Item = Backbone.Model.extend({
                    idAttribute: 'PickingItemId',
                    initialize: function () {
                        this.set('ItemComment', this.get('Comment'));
                    }
                });
                Items = Backbone.Collection.extend({
                    model: Item
                });
                ItemsView = forms.views.TableView.extend({
                    initialize: function () {
                        this.template = _.template($('#itemTemplate').html());
                        this.templateEmpty = _.template($('#itemTemplateEmpty').html());
                        this.collection.on('reset', this.render, this);
                        return this.render();
                    },
                    render: function () {
                        this.$el.html('');
                        this.collection.models.forEach(function (b, i) {
                            b.attributes.OrderPosition = i + 1;
                            return this.$el.append(this.template(b.toJSON()));
                        }, this);
                        reject.init();
                        singleClick.bind();
                        return this.empty();
                    }
                });
                searchNotes = function () {
                    var s;
                    s = $('#searchBox').val();
                    return $('#items .panel').each(function (i, e) {
                        if (s.length === undefined || s.length === null || s.length === 0) {
                            return $(e).show();
                        } else {
                            $(e).hide();
                            return $(e).find(".booking:containsNC('" + s + "')").parent('.panel').show();
                        }
                    });
                };
                $('#searchBox').on('keyup', searchNotes);
                var defaultBranch = $el.data("defaultBranch"),
                    backboneCodeLogic = function (defaultBranch) {
                        var LoadView;
                        $('select.pickList').pickList({
                            allow_single_deselect: true
                        });
                        LoadView = Backbone.View.extend({
                            initialize: function () {
                                _.bindAll.apply(_, [this].concat(_.functions(this)));
                                this.itemsView = new ItemsView({
                                    el: '#items',
                                    collection: new Items()
                                });
                                $('#items-container').tooltip({
                                    trigger: 'manual'
                                });
                                this.itemsView.$el.sortable({
                                    stop: this.setOrder
                                }).sortable("disable");
                                $('#deliveryBranch').val(defaultBranch).trigger('liszt:updated');
                                return this.branchChange();
                            },
                            events: {
                                'change #deliveryBranch': 'branchChange',
                                'click .printPickUp': 'print',
                                'click .reprintButton': 'reprint',
                                'click .confirmPickUp': 'confirmDelivery',
                                'change .rejectItemSel': 'setRejection'
                            },
                            print: function (e) {
                                var _this = this;
                                _this.targetBookingId = $(e.currentTarget).parents('.panel').data('id');
                                return $.ajax({
                                    url: url.resolve("/Warehouse/CustomerPickUps/UpdateScheduledQuantity/" + _this.targetBookingId),
                                    contentType: 'application/json',
                                    data: JSON.stringify(_this.targetBookingId),
                                    type: 'POST',
                                    success: function (updated/*, textStatus, jqXHR*/) {
                                        var msg;
                                        var errorHandling = function (modelObj) {
                                                if (modelObj.length > 0 &&
                                                    modelObj[0].attributes.DeliveryOrCollectionDescription !== null) {
                                                    notification.showPersistent(
                                                        "Shipment has a wrong delivery or collection type, please contact help desk.",
                                                        "Application data error");
                                                } else {
                                                    notification.showPersistent("Data error on customer pick up screen.",
                                                        "Application error");
                                                }
                                            },
                                            collectionModel = _.filter(_this.itemsView.options.collection.models, function (item) {
                                                return item.attributes.BookingId === _this.targetBookingId;
                                            });

                                        if (updated === true) {
                                            var delcol = $(e.currentTarget).parents('tr').find('.del-col div').text();
                                            //if (delcol === "Delivery" || delcol === "Redelivery") {
                                            if (collectionModel.length > 0 &&
                                                collectionModel[0].attributes.DeliveryOrCollectionDescription === "Delivery" || collectionModel[0].attributes.DeliveryOrCollectionDescription === "Redelivery") {
                                                msg = _.template('A <a href=\'<%- url %>\' target=\'_blank\' class=\'external-link\'>' +
                                                    'new pick up note</a> has been created and is ready to be printed.');
                                                alert(msg({
                                                    url: url.resolve("/Warehouse/CustomerPickUps/PrintPickUpNote/" +
                                                        ($(e.currentTarget).parents('.panel').data('id')))
                                                }), 'Pick Up Note created');
                                            } else if (collectionModel.length > 0 &&
                                                collectionModel[0].attributes.DeliveryOrCollectionDescription === "Collection") {
                                                msg = _.template('A <a href=\'<%- url %>\' target=\'_blank\' class=\'external-link\'>' +
                                                    'new return note</a> has been created and is ready to be printed.');
                                                alert(msg({
                                                    url: url.resolve("/Warehouse/CustomerPickUps/PrintPickUpNote/" +
                                                        ($(e.currentTarget).parents('.panel').data('id')))
                                                }), 'Return note created');
                                            } else {
                                                errorHandling(collectionModel);
                                            }
                                            return _this.search($('#deliveryBranch').val());
                                        } else {
                                            if (collectionModel.length > 0 &&
                                                collectionModel[0].attributes.DeliveryOrCollectionDescription === "Delivery" || collectionModel[0].attributes.DeliveryOrCollectionDescription === "Redelivery") {
                                                msg = _.template('There are no items to be printed.');
                                                alert(msg, 'Pick Up Note not Created');
                                            } else if (collectionModel.length > 0 &&
                                                collectionModel[0].attributes.DeliveryOrCollectionDescription === "Collection") {
                                                msg = _.template('There are no items to be printed.');
                                                alert(msg, 'Return Note not Created');
                                            } else {
                                                errorHandling(collectionModel);
                                            }
                                            return _this.search($('#deliveryBranch').val());
                                        }
                                    }
                                });
                            },
                            reprint: function (e) {
                                var _this = this;

                                _this.targetBookingId = $(e.currentTarget).parents('.panel').data('id');
                                _this.DelOrCol = $(e.currentTarget).parents('.panel').find('.DelColDesc').text();
                                _this.DelOrCol = (_this.DelOrCol === "Delivery") ? 'Pick Up Note' : 'Return Note';

                                confirm('You have chosen to reprint the ' + _this.DelOrCol + '. If you continue, this will be audited. Would you like to reprint the ' + _this.DelOrCol + '?',
                                    'Reprint ' + _this.DelOrCol,
                                    function (agree) {
                                        if (agree) {
                                            url.open('/Warehouse/CustomerPickUps/PrintPickUpNote/' + _this.targetBookingId);
                                        }
                                    });
                            },
                            confirmDelivery: function (e) {
                                $(e.currentTarget).attr('disabled', true); //explicitly disabled
                                e.currentTarget.disabled = true;
                                $(e.currentTarget).addClass('disabled');
                                var _this = this;

                                var DelColType = $(e.currentTarget).parents('.panel').find('.DelColDesc').html();

                                var PickUpConfirmation = {
                                    id: $(e.currentTarget).parents('.panel').data('id'),
                                    Comment: $(e.currentTarget).parents('.panel').find('.itemNotes').val(),
                                    RejectedReason: $(e.currentTarget).parents('.panel').find('.rejectItemSel').val(),
                                    ScheduleQuantity: $(e.currentTarget).parents('.panel').find('.delQtySel').val()
                                };

                                return $.ajax({
                                    url: url.resolve("/Warehouse/CustomerPickUps/ConfirmDelivery"),
                                    contentType: 'application/json',
                                    data: JSON.stringify(PickUpConfirmation),
                                    type: 'POST',
                                    success: function (result, textStatus, jqXHR) {
                                        singleClick.reset();
                                        $(e.currentTarget).attr('disabled', false); //explicitly re-enabled

                                        var message = "";

                                        if (DelColType === "Delivery" || DelColType === "Redelivery") {
                                            message = 'Customer pick up for shipment #';
                                        } else {
                                            message = 'Customer return for shipment #';
                                        }

                                        if (result.Success === true) {
                                            if (result.IsRejection) {
                                                notification.show(message + result.BookingNo +
                                                    ' rejected successfully');
                                            } else {
                                                notification.show(message + result.BookingNo +
                                                    ' confirmed successfully');
                                            }
                                            return _this.search($('#deliveryBranch').val());
                                        } else {
                                            return alert("There are outstanding collections for this account. " +
                                                "Please process collections first", 'Outstanding Collections');
                                        }
                                    }
                                });
                            },
                            branchChange: function () {
                                return this.search($('#deliveryBranch').val());
                            },
                            removeRejection: function () {
                                return $('#items .panel').each(function (i, e) {
                                    if ($(e).hasClass('expReject') && $(e).hasClass('panel-danger')) {
                                        $(e).removeClass('expReject');
                                        $(e).removeClass('panel-danger');
                                        $(e).find('.confirmPickUp').removeClass('btn-danger').addClass('btn-primary');
                                        return $(e).addClass('express');
                                    } else if (!$(e).hasClass('expReject') && $(e).hasClass('panel-danger')) {
                                        $(e).find('.confirmPickUp').removeClass('btn-danger').addClass('btn-primary');
                                        return $(e).removeClass('panel-danger');
                                    }
                                });
                            },
                            enableRejectionDropDown: function () {
                                return $('#items .booking .rejectItemSel').each(function (i, e) {
                                    return $(e).select2('enable');
                                });
                            },
                            setRejection: function () {
                                var x;
                                x = 0;
                                return $('#items .panel').each(function (i, e) {
                                    var quant = $(e).find('.delQtySel').val();
                                    if (_.isUndefined(quant)) {
                                        quant = '';
                                    }
                                    if ($(e).find('.rejectItemSel').val() !== void 0 &&
                                        $(e).find('.rejectItemSel').val().length !== 0 && quant.length === 0) {
                                        $(e).find('.confirmPickUp').removeClass('btn-primary').addClass('btn-danger');
                                        return $(e).addClass('rejected');
                                    } else {
                                        x++;
                                        if ($(e).hasClass('rejected')) {
                                            $(e).find('.confirmPickUp').removeClass('btn-danger').addClass('btn-primary');
                                            return $(e).removeClass('rejected');
                                        }
                                    }
                                });
                            },
                            search: function (branch) {
                                var itemsView;
                                if (branch) {
                                    itemsView = this.itemsView;
                                    return $.get(url.resolve('/Warehouse/CustomerPickUps/ByBranch'), {
                                        branch: branch
                                    }, function (data) {
                                        return itemsView.collection.reset(data);
                                    });
                                } else {
                                    return this.itemsView.collection.reset();
                                }
                            }
                        });
                        return new LoadView({
                            el: $('#load')
                        });
                    };

                backboneCodeLogic(defaultBranch);
            }
        };
    });
