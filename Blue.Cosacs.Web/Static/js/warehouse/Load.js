define(['spa', 'jquery', 'forms', 'url', 'Models', 'underscore', 'backbone', 'notification', 'alert', 'moment',
        'warehouse/bookingItemReject', 'jquery.pickList', 'chosen.jquery', 'single-click', 'pjax',
        'lib/bootstrap/tooltip', 'sortable', 'lib/select2'],
function (spa, $, forms, url, Models, _, Backbone, notification, alert, moment, reject, pickList, select2,
          singleClick, pjax) {
    'use strict';

    return {
        init: function ($el) {
            var Item = Backbone.Model.extend({
                idAttribute: 'PickingItemId'
            });

            var Items = Backbone.Collection.extend({
                model: Item
            });

            var TrucksView = forms.views.ChosenView.extend({
                initialize: function () {
                    this.render();
                    return this.collection.on('reset', this.render, this);
                }
            });

            var ReassignTrucksView = forms.views.ChosenView.extend({
                initialize: function () {
                    this.render();
                    return this.collection.on('reset', this.render, this);
                }
            });

            var ItemsView = forms.views.TableView.extend({
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
                    return this.empty();
                }
            });

            var defaultBranch = $el.data("defaultBranch"),
                trucks = $el.data("trucks"),
                backboneCodeLogic = function (trucks, defaultBranch) {
                    var LoadView, ReassignTrucks;
                    $('select.pickList').pickList({
                        allow_single_deselect: true
                    });
                    $('#trucks').chosen();
                    LoadView = Backbone.View.extend({
                        initialize: function () {
                            _.bindAll.apply(_, [this].concat(_.functions(this)));
                            this.trucks = new Models.Trucks(trucks);
                            this.trucksView = new TrucksView({
                                el: '#trucks',
                                collection: new Models.Trucks()
                            });
                            this.itemsView = new ItemsView({
                                el: '#items tbody',
                                collection: new Items()
                            });
                            $('#actions, #saveDeliverySchedule, #cancel, #transfer').hide();
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
                            'change #type': 'typeChange',
                            'change #trucks': 'trucksChange',
                            'click #createDeliverySchedule': 'createDeliverySchedule',
                            'click #cancel': 'cancelCreateDeliverySchedule',
                            'click #saveDeliverySchedule': 'saveDeliverySchedule',
                            'click #transferOrders': 'transferOrders',
                            'click #cancelTransfer': 'cancelTransfer',
                            'click #confirmTransfer': 'confirmTransfer',
                            'change select': 'setOrder',
                            'hover #createDeliverySchedule': 'enableDisableButtons',
                            'hover #print': 'enableDisableButtons'
                        },
                        createDeliverySchedule: function () {
                            $('.rejectItem').show();
                            $('#print, #createDeliverySchedule').hide();
                            $('#cancel').removeClass('disabled').attr('disabled', false);
                            $('#saveDeliverySchedule, #cancel, .order').show();
                            $('#items-container').addClass('highlight-table').tooltip('show');
                            $(document).on('pjax:start', function () {
                                $('#items-container').removeClass('highlight-table').tooltip('hide');
                                $(this).off('pjax:start');
                            });
                            this.itemsView.$el.sortable("enable");
                            this.setOrder();
                            this.enableRejectionDropDown();
                            $('#transfer_buttons').hide();
                            return this.hideCancelledBookings();
                        },
                        cancelCreateDeliverySchedule: function () {
                            $('.rejectItem').hide();
                            $('#print, #createDeliverySchedule').show();
                            $('#saveDeliverySchedule, #cancel, .order').hide();
                            $('#items-container').removeClass('highlight-table').tooltip('hide');
                            this.itemsView.$el.sortable("disable");
                            this.showCancelledBookings();
                            singleClick.reset();
                            $('#transfer_buttons').show();
                            return this.removeRejection();
                        },
                        transferOrders: function () {
                            var branch, excludeTruck;
                            $('#transfer').show();
                            //$('#load_delivery_buttons, #transferOrders').hide();
                            $('#load_delivery_buttons').hide();

                            branch = parseInt($('#deliveryBranch').val(), 10);
                            excludeTruck = parseInt($('#trucks').val(), 10);

                            this.ReassignTrucks = _.filter(trucks, function (truck) { return truck.Branch == branch && truck.Id != excludeTruck; });

                            this.reassignTrucksView = new ReassignTrucksView({
                                el: '#reassignTrucks',
                                collection: new Models.Trucks(this.ReassignTrucks)
                            });
                        },
                        cancelTransfer: function () {
                            //$('#load_delivery_buttons, #transferOrders').show();
                            $('#load_delivery_buttons').show();
                            $('#transfer').hide();
                            singleClick.reset();
                        },
                        saveDeliverySchedule: function (e) {
                            if ($(e.currentTarget).hasClass('disabled')) {
                                return;
                            }

                            $('#cancel').addClass('disabled').attr('disabled', true);

                            var $item, ScheduleConfirmation, i, item,
                                _this = this;
                            i = 0;
                            ScheduleConfirmation = {
                                truckId: this.trucksView.selectedId(),
                                ScheduleItems: (function () {
                                    var _i, _len, _ref, _results;
                                    _ref = $('#items tbody tr');
                                    _results = [];
                                    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                                        item = _ref[_i];
                                        $item = $(item);
                                        _results.push({
                                            Id: $item.data('id'),
                                            Comment: $item.find('.itemNotes').val(),
                                            RejectedReason: $item.find('.rejectItemSel').val(),
                                            ScheduleQuantity: $item.find('.delQtySel').val(),
                                            Sequence: $item.find('.order').text()
                                        });
                                    }
                                    return _results;
                                }())
                            };
                            return $.ajax({
                                url: url.resolve("/Warehouse/delivery/CreateDeliverySchedule"),
                                contentType: 'application/json',
                                data: JSON.stringify(ScheduleConfirmation),
                                type: 'POST',
                                success: function (load, textStatus, jqXHR) {
                                    var msg;
                                    if (load !== null) {
                                        msg = _.template('A <a href=\'<%- url %>\' class="external-link" target=\'_blank\'>new delivery schedule</a> has been created and is ready to be printed.');
                                        alert(msg({
                                            url: url.resolve("/Warehouse/Delivery/PrintSchedule/" + load.Id)
                                        }), 'Delivery Schedule Created');
                                        _this.trucks.get(_this.trucksView.selectedId()).zero();
                                        _this.trucksView.render();
                                        _this.search(_this.trucksView.selectedId(), $('#type').val());
                                    } else {
                                        msg = _.template('There are no items to be scheduled.');
                                        alert(msg, 'Delivery Schedule not Created');
                                        _this.trucks.get(_this.trucksView.selectedId()).zero();
                                        _this.trucksView.render();
                                        _this.search(_this.trucksView.selectedId(), $('#type').val());
                                    }
                                }
                            });
                        },
                        branchChange: function () {
                            var branch;
                            branch = parseInt($('#deliveryBranch').val(), 10);
                            this.trucksView.collection.reset(this.trucks.filter(function (truck) {
                                return truck.attributes.Branch === branch;
                            }));
                            this.search(this.trucksView.selectedId(), $('#type').val());
                        },
                        typeChange: function() {
                            this.search(this.trucksView.selectedId(), $('#type').val());
                        },
                        confirmTransfer: function () {
                            var _this = this;
                            $.ajax({
                                type: 'PUT',
                                url: url.resolve('/Warehouse/Delivery/ConfirmTransfer?currentTruckId=' + this.trucksView.selectedId() + '&newTruckId=' + this.reassignTrucksView.selectedId()),
                                success: function () {
                                    alert('Transfer of shipments was successful', 'Transfer Bookings');
                                    $.ajax({
                                        type: 'GET',
                                        url: url.resolve('/Warehouse/Picking/Trucks?deliveryBranch=' + parseInt($('#deliveryBranch').val(), 10)),
                                        success: function (updatedTrucks, textStatus, jqXHR) {
                                            if (updatedTrucks !== undefined || updatedTrucks !== null) {
                                                this.trucksView = new TrucksView({
                                                    el: '#trucks',
                                                    collection: new Models.Trucks(updatedTrucks)
                                                });
                                                //$('#load_delivery_buttons, #transferOrders').show();
                                                $('#load_delivery_buttons').show();
                                                trucks = updatedTrucks;
                                            }
                                        }
                                    });
                                }
                            });
                            this.branchChange();
                        },
                        trucksChange: function () {
                            var branch;

                            $('#transfer').hide();

                            branch = parseInt($('#deliveryBranch').val(), 10);

                            this.search(this.trucksView.selectedId(), $('#type').val());
                        },
                        setOrder: function () {
                            var x;
                            x = 0;
                            return $('#items tbody .order').each(function (i, e) {
                                var parent = $(e).parent();
                                var $x, quant;
                                $x = parent.find('.express');
                                quant = parent.find('.delQtySel').val();
                                if (_.isUndefined(quant)) {
                                    quant = '';
                                }
                                if (parent.find('.rejectItemSel').val() !== undefined && parent.find('.rejectItemSel').val().length !== 0 && quant.length === 0) {
                                    if (parent.hasClass('booking') && parent.hasClass('express')) {
                                        parent.removeClass('express');
                                        parent.addClass('expReject');
                                    }
                                    parent.addClass('rejected');
                                    $(e).text('X');
                                } else if (parent.hasClass('cancelled')) {
                                    $(e).text('X');
                                } else {
                                    x++;
                                    $(e).text(x);
                                    if (parent.hasClass('booking') && parent.hasClass('expReject')) {
                                        parent.removeClass('expReject');
                                        parent.removeClass('rejected');
                                        parent.addClass('express');
                                    } else if (parent.hasClass('booking')) {
                                        parent.removeClass('rejected');
                                        parent.attr('class', 'booking ');
                                    }
                                }
                            });
                        },
                        removeRejection: function () {
                            return $('#items tbody .order').each(function (i, e) {
                                var parent = $(e).parent();
                                parent.removeClass('expReject');
                                parent.removeClass('rejected');
                            });
                        },
                        enableRejectionDropDown: function () {
                            return $('#items tbody .booking .rejectItemSel').each(function (i, e) {
                                return $(e).select2('enable');
                            });
                        },
                        hideCancelledBookings: function () {
                            return $('.cancelled').each(function (i, e) {
                                return $(e).hide();
                            });
                        },
                        showCancelledBookings: function () {
                            return $('.cancelled').each(function (i, e) {
                                return $(e).show();
                            });
                        },
                        enableDisableButtons: function () {
                            if ($('.booking').length === 0) {
                                $('#createDeliverySchedule, #transferOrders, #print').attr('disabled', true);
                                $('#print').removeAttr('href');
                            } else {
                                if ($('.booking').not('.cancelled').length === 0) {
                                    $('#createDeliverySchedule, #transferOrders, #print').attr('disabled', true);
                                    $('#print').removeAttr('href');
                                } else {
                                    $('#createDeliverySchedule, #transferOrders, #print').attr('disabled', false);
                                    singleClick.reset();
                                }
                            }
                        },
                        search: function (truckId, isInternal) {
                            var itemsView;
                            this.cancelCreateDeliverySchedule();
                            if (truckId) {
                                var _this = this;
                                itemsView = this.itemsView;
                                $.get(url.resolve('/Warehouse/Delivery/ByTruck'), {
                                    id: truckId,
                                    isInternal: isInternal
                                }, function (data) {
                                    itemsView.collection.reset(data);
                                    if (data.length) {
                                        $('#actions').show();
                                        $('#print').attr('href', url.resolve("/Warehouse/Delivery/PrintLoad?truckId=" + truckId));
                                        $('.rejectItem').hide();
                                    } else {
                                        $('#actions').hide();
                                    }
                                    return _this.enableDisableButtons();
                                });
                            } else {
                                this.itemsView.collection.reset();
                                $('#actions').hide();
                            }
                        }
                    });
                    return new LoadView({
                        el: $('#load')
                    });
                };

            backboneCodeLogic(trucks, defaultBranch);
        }
    };
});
