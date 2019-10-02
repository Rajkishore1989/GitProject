(function () {

    define(['jquery', 'url', 'underscore', 'backbone'], function ($, url, _, Backbone) {
        var Booking, Bookings, PickingItem, PickingItems, Truck, Trucks;
        Truck = Backbone.Model.extend({
            toString: function () {
                return this.get('Name') + ' (' + this.get('Count') + ')';
            },
            inc: function () {
                return this.set('Count', this.get('Count') + 1);
            },
            dec: function () {
                return this.set('Count', this.get('Count') - 1);
            },
            zero: function () {
                return this.set('Count', 0);
            }
        });
        Trucks = Backbone.Collection.extend({
            model: Truck,
            url: url.resolve('/Warehouse/Picking/Trucks')
        });
        Booking = Backbone.Model.extend();
        Bookings = Backbone.Collection.extend({
            model: Booking
        });
        PickingItem = Backbone.Model.extend({
            initialize: function () {
            }
        });
        PickingItems = Backbone.Collection.extend({
            model: PickingItem,
            url: url.resolve('/Warehouse/PickingItems/ByTruck'),
//            fetchSuccess: function (collection, response) {
//                console.log('Collection models: ', collection.models);
//            },
            currentTruck: function () {
                if (!this.currentTruckId) {
                    return this;
                }
                var truckId = parseInt(this.currentTruckId, 10);
                if (truckId != this.loadedTruckId) {
                    this.fetch({
                        data: { truckId: truckId },
                        processData: true
                    });
                    this.loadedTruckId = truckId;
                }
                return this.filter(function(i) {
                    return i.get('TruckId') === truckId;
                });
            }
        });
        return {
            Truck: Truck,
            Trucks: Trucks,
            Booking: Booking,
            Bookings: Bookings,
            PickingItem: PickingItem,
            PickingItems: PickingItems
        };
    });

}).call(this);
