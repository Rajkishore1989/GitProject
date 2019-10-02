define(['spa', 'jquery', 'forms', 'url', 'underscore', 'backbone', 'notification', 'moment', 'hilo', 'alert', 'Models', 'confirm', 'jquery.pickList'],

function (spa, $, forms, url, _, Backbone, notification, moment, hilo, alert, Models, confirm, pickList) {
    'use strict';

    return {
        init: function ($el) {

    var BookingsView, PickingItemsView, PickingSearchView, TrucksView;
    TrucksView = forms.views.ChosenView.extend({
        initialize: function () {
            this.render();
            this.collection.on('change:Count', this.updateCount, this);
            return this.collection.on('all', this.render, this);
        },
        updateCount: function (truck) {
            this.$el.find('option[value=' + truck.id + ']').text(truck.toString());
            return this.update();
        }
    });
    BookingsView = forms.views.TableView.extend({
        initialize: function () {
            this.template = _.template($('#bookingTemplate').html());
            this.templateEmpty = _.template($('#bookingTemplateEmpty').html());
            this.collection.on('all', this.render, this);
            return this.render();
        },
        render: function () {
            this.$el.html('');
            this.collection.forEach(function (b) {
                return this.$el.append(this.template(b.toJSON()));
            }, this);
            return this.empty();
        },
        events: {
            'click .action-pick': 'pick'
        },
        pick: function (e) {
            var $row, booking;
            if ($('#trucks option').length > 0) {
                $row = $(e.target).parents('.booking');
                booking = this.collection.get($row.data('id'));
                booking.auto = false;
                this.collection.remove(booking);
                return this.empty();
            }
        },
        autoPick: function (ids) {
            var col;
            col = this.collection;
            _.each(ids, function (id) {
                var booking;
                booking = col.get(id);
                booking.auto = true;
                return col.remove(booking);
            });
            return this.empty();
        }
    });
    PickingSearchView = forms.views.SearchView.extend({
        initialize: function () {
            var self = this;
            setTimeout(function () {
                self.$el.find("#deliveryBranch").find("option[value=" + self.options.defaultBranch + "]").attr('selected', 'selected');
                var currValue = self.$el.find('#deliveryBranch').val();
                if (currValue) {
                    self.$el.find("button.search").removeAttr("disabled");
                } else {
                    self.$el.find("button.search").attr("disabled", true);
                    $("tr.empty td").empty().append("You have to select a Delivery Location.");
                }

                self.$el.find('#deliveryBranch').on('change', function () {
                    var currValue = $('#deliveryBranch').val();
                    if (currValue) {
                        $("#search .actions .search.btn").removeAttr("disabled");
                    } else {
                        $("#search .actions .search.btn").attr("disabled", true);
                        $("tr.empty td").empty().append("You have to select a Delivery Location.");
                    }
                });

                $('#type').on('change', function () {
                    var currValue = $('#type').val();
                    $('#receivingLocation').val('');
                    if (currValue === 'true') {
                        $('#receivingLocationContainer').fadeIn();
                    } else {
                        $('#receivingLocationContainer').fadeOut();
                    }
                });

                return self.$el.find("#deliveryBranch").trigger("liszt:updated");
            }, 200);
        },
        search: function (e) {
            var searchParams, self;
            self = this;
            searchParams = {
                DeliveryZone: self.$el.find('[name=deliveryZone]').val(),
                ProductCategory: self.$el.find('[name=productCategory]').val(),
                DeliveryBranch: parseInt(self.$el.find('#deliveryBranch').val(), 10),
                Fascia: self.$el.find('[name=fascia]').val(),
                Internal: $('#type').val(),
                ReceivingLocation: parseInt($('#receivingLocation').val(), 10)
        };

            if (searchParams.DeliveryBranch) {
                $("#search .actions .search.btn").removeAttr("disabled");
                if (searchParams.DeliveryZone) {
                    searchParams.DeliveryZone = searchParams.DeliveryZone.join(', ');
                }
                if (searchParams.ProductCategory) {
                    searchParams.ProductCategory = searchParams.ProductCategory.join(', ');
                }
                if (searchParams.DeliveryZone === null) {
                    searchParams.DeliveryZone = "";
                }
                if (searchParams.ProductCategory === null) {
                    searchParams.ProductCategory = "";
                }
                if (searchParams.Fascia === null) {
                    searchParams.Fascia = "";
                }
                $.ajax({
                    type: 'GET',
                    url: url.resolve('/Warehouse/Picking/Bookings'),
                    data: searchParams,
                    success: function (data) {
                        return self.trigger("results", data, searchParams);
                    }
                });
            } else {
                $("#search .actions .search.btn").attr("disabled", true);
                $("tr.empty td").empty().append("You have to select a Delivery Location.");
            }

            return false;
        }
    });
    PickingItemsView = forms.views.TableView.extend({
        initialize: function () {
            this.template = _.template($('#pickingItemTemplate').html());
            this.templateEmpty = _.template($('#pickingItemTemplateEmpty').html());
            this.collection.on("add", this.pick, this);
            this.collection.on("change", this.render, this);
            this.collection.on("reset", this.render, this);
            return this.render();
        },
        events: {
            'click .action-unpick': 'unpick'
        },
        pick: function (item) {
            if (!item) {
                return;
            }
            $('#printByTruck').attr('disabled', false);
            //this insidePick is to avoid the render
            this.insidePick = true;
            item.set("PickingId", _.isUndefined(item.get("PickingId")) ? null : item.get("PickingId"));
            this.insidePick = false;
            var thisTemp = $(this.template(_.extend(item.toJSON(), {
                cid: item.cid
            })));
            this.$el.prepend(thisTemp);
            $(".branchNo", thisTemp).each(function () {
                var _this = $(this);
                var key = _this.text().trim();
                if (key) {
                    pickList.k2v('BRANCH', key, function (rows) {
                        _this.text(rows[key]);
                    });
                }
            });
            return this.empty();
        },
        unpick: function (e) {
            var cid, item;
            cid = $(e.target).parents('.pickingItem').data('cid');
            item = this.collection.getByCid(cid);
            this.collection.remove(item);
            return this.render();
        },
        render: function () {
            if (this.insidePick) {
                return;
            }
            this.$el.html('');
            _.forEach(this.collection.currentTruck(), this.pick, this);

            $(".branchNo").each(function () {
                var _this = $(this);
                var key = _this.text().trim();
                if (key) {
                    pickList.k2v('BRANCH', key, function (rows) {
                        _this.text(rows[key]);
                    });
                }
            });

            return this.empty();
        }
    });

    var defaultBranch = $el.data("defaultBranch"),
        bookingSearch = $el.data("bookingSearch"),
        pickingItems = $el.data("pickingItems"),
        pickingViewCodeLogic = function (trucks, bookings, pickingItems, defaultBranch) {
        var PickingView,
        _this = this;
        $('select:not(.picklist)').chosen();
        PickingView = Backbone.View.extend({
            initialize: function () {
                var bv,
                _this = this;
                $('select.picklist').pickList();
                trucks = new Models.Trucks(trucks);
                bookings = new Models.Bookings(bookings);
                pickingItems = new Models.PickingItems(pickingItems);
                if (trucks.length > 0) {
                    pickingItems.currentTruckId = trucks.at(0).id;
                }
                this.trucksView = new TrucksView({
                    el: '#trucks',
                    collection: trucks
                });
                bv = this.bookingsView = new BookingsView({
                    el: '#bookings > tbody',
                    collection: bookings
                });
                this.searchView = new PickingSearchView({
                    el: '#search',
                    defaultBranch: defaultBranch
                });
                this.pickingView = new PickingItemsView({
                    el: '#pickingItems tbody',
                    collection: pickingItems
                });
                bookings.on('remove', function (booking) {
                    var bookingsData, truckId;
                    truckId = parseInt(_this.trucksView.selectedId(), 10);
                    if (!booking.auto) {
                        bookingsData = {
                            bookingID: booking.id,
                            truckID: truckId
                        };
                        $.ajax({
                            type: 'PUT',
                            url: url.resolve('/Warehouse/Picking/BookingPicked'),
                            data: bookingsData,
                            success: function (data) {
                                var truckName = _.find(trucks.models, function(singleTruck){ return singleTruck.id == truckId; });
                                truckName = truckName ? truckName.attributes.Name : " selected";
                                if (data > 0) {
                                    confirm("There is " + data + " other item(s) for this address on the same day. Do you wish to add all items?", 'Add Related Stock', function (ok) {
                                        if (ok) {
                                            return $.ajax({
                                                type: 'PUT',
                                                url: url.resolve('/Warehouse/Picking/BookRelated'),
                                                data: bookingsData,
                                                success: function (data) {
                                                    bv.autoPick(data);
                                                    return notification.show("Shipment #" + booking.id + " and related booking added successfully to the truck " + truckName + ".");
                                                },
                                                error: function(jqXHR, textStatus, errorThrown) {
                                                    return notification.show("Only Shipment #" + booking.id + " added successfully to the truck " + ".");
                                                }
                                            });
                                        } else {
                                            return notification.show("Only Shipment #" + booking.id + " added successfully to the truck " + ".");
                                        }
                                    }, false, "Add");
                                } else {
                                    return notification.show("Shipment #" + booking.id + " added successfully to the truck " + truckName + ".");
                                }
                            }
                        });
                    }
                    return hilo.nextId('Warehouse.PickingItem', function (id) {
                        var item;
                        item = new Models.PickingItem({
                            Id: id,
                            BookingId: booking.id,
                            Booking: booking.toJSON(),
                            TruckId: truckId
                        });
                        pickingItems.add(item);
                        return trucks.get(truckId).inc();
                    });
                });
                pickingItems.on('remove', function (pickingItem) {
                    var booking, truckId;
                    truckId = parseInt(_this.trucksView.selectedId(), 10);
                    booking = pickingItem.get('Booking');
                    bookings.add(booking);
                    trucks.get(truckId).dec();
                    return $.ajax({
                        type: 'PUT',
                        url: url.resolve('/Warehouse/Picking/BookingUnPicked'),
                        data: {
                            bookingID: booking.Id
                        },
                        success: function (data) { 
                            var truckName = _.find(trucks.models, function(singleTruck){ return singleTruck.id == truckId; });
                            truckName = truckName ? truckName.attributes.Name : " selected";

                            return notification.show("Shipment #" + booking.Id + " removed successfully from the truck " + truckName + ".");
                        }
                    });
                });
                this.trucksView.on('change', function (v) {
                    pickingItems.currentTruckId = v.selectedId();
                    return _this.pickingView.render();
                });
                return this.searchView.on('results', function (searchResults, searchParams) {
                    bookings.reset(searchResults.Bookings);
                    if (searchResults.TotalBookings > 250) {
                        $('#bookingCount').text("Shipments (showing 250 of " + searchResults.TotalBookings + ")");
                    } else {
                        $('#bookingCount').text("Shipments (showing " + searchResults.TotalBookings + " of " + searchResults.TotalBookings + ")");
                    }
                    trucks.reset(searchResults.Trucks);
                    return _this.trucksView.trigger('change', _this.trucksView);
                });
            },
            onlyWithBranch: function (f) {
                var branchId;
                branchId = $('#deliveryBranch').val();
                if (branchId) {
                    return f(branchId);
                } else {
                    return alert('You need to select a Delivery Location.', 'Delivery Location Required');
                }
            },
            disablePrintByTruck: function () {
                if ($('#pickingItems tbody tr').not('.empty').length === 0) {
                    return $('#printByTruck').attr('disabled', true);
                }
            },
            printByTruck: function () {
                var _this = this;
                return this.onlyWithBranch(function (branchId) {
                    var req;
                    req = {
                        truckId: _this.trucksView.selectedId(),
                        branchId: branchId
                    };
                    return $.post(url.resolve('/Warehouse/Picking/CreateByTruck'), req, function (picking, textStatus, jqXHR) {
                        var msg, truck;
                        if (!_.isNull(picking)) {
                            truck = _this.trucksView.collection.get(req.truckId);
                            _this.pickingView.collection.fetch();
                            msg = _.template('A <a href=\'<%- url %>/<%- picking.Id %>\' class="external-link" target=\'_blank\'>new pick list</a> has been created with <br/>the pending items assigned to truck \'<%- truck.get(\'Name\') %>\'.');
                            alert(msg({
                                url: url.resolve('/Warehouse/Picking/Print'),
                                picking: picking,
                                truck: truck
                            }), 'Pick List Created');
                        } else {
                            return alert("No pick lists were printed as there are currently no pending items for branch " + ($('#deliveryBranch option:selected').text()), "No Pick Lists Created");
                        }
                    });
                });
            },
            printAll: function () {
                var _this = this;
                return this.onlyWithBranch(function (branchId) {
                    var data, urlMap, urlPost;
                    urlPost = "";
                    urlMap = {
                        category: '/Warehouse/Picking/CreateByProductCategory',
                        truck: '/Warehouse/Picking/CreateByTruckLoad',
                        wzone: '/Warehouse/Picking/CreateByWarehouseZone',
                        all: '/Warehouse/Picking/CreateByNothing'
                    };
                    if ($('#printAllType').val() !== "") {
                        urlPost = url.resolve(urlMap[$('#printAllType').val()]);
                    } else {
                        urlPost = "";
                    }
                    if (urlPost !== "" && branchId) {
                        data = {
                            branchId: branchId
                        };
                        return $.post(urlPost, data, function (pickings, textStatus, jqXHR) {
                            var msg, picking;
                            if (!_.isNull(pickings) && pickings.length > 0) {
                                _this.pickingView.collection.fetch();
                                msg = _.template('A <a href=\'<%- url %>?ids=<%- pickingIds %>\' target=\'_blank\'>new set of pick lists <i class="ui-icon ui-icon-extlink icon12pxHeight"></i></a> has been created with the pending items assigned to trucks.');
//                                return notification.showPersistent(msg({
                                alert(msg({
                                    url: url.resolve('/Warehouse/Picking/PrintMany'),
                                    pickingIds: (function () {
                                        var _i, _len, _results;
                                        _results = [];
                                        for (_i = 0, _len = pickings.length; _i < _len; _i++) {
                                            picking = pickings[_i];
                                            _results.push(picking.Id);
                                        }
                                        return _results;
                                    })()
                                }), 'Pick Lists Created');
                            } else {
                                return alert("No pick lists were printed as there are currently no pending items for branch " + ($('#deliveryBranch option:selected').text()), "No Pick Lists Created");
                            }
                        });
                    }
                });
            },
            events: {
                'click #printByTruck': 'printByTruck',
                'click #printAll': 'printAll',
                'hover #printByTruck': 'disablePrintByTruck'
            }
        });
        return new PickingView({
            el: $('#picking')
        });
    };

            pickingViewCodeLogic(
                bookingSearch.trucks,
                bookingSearch.bookings,
                pickingItems,
                defaultBranch);
        }
    };
});