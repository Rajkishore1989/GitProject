define(['jquery', 'url', 'underscore', 'backbone'], ($, url, _, Backbone) -> 
    
    # Trucks
    Truck = Backbone.Model.extend
        toString: () -> @get('Name') + ' (' + @get('Count') + ')'
        inc: () -> @set('Count', @get('Count') + 1)
        dec: () -> @set('Count', @get('Count') - 1)
        zero: () -> @set('Count', 0)

    Trucks = Backbone.Collection.extend
        model: Truck
        url: url.resolve('/Warehouse/Picking/Trucks')

    # Bookings
    Booking = Backbone.Model.extend()

    Bookings = Backbone.Collection.extend
        model: Booking
        # url: url.resolve('/Warehouse/Picking/Bookings')

    # PickingItems
    PickingItem = Backbone.Model.extend
        initialize: () -> 
        
    PickingItems = Backbone.Collection.extend
        model: PickingItem 
        url: url.resolve('/Warehouse/PickingItems')
        currentTruck: () ->
            truckId = parseInt(@currentTruckId, 10)
            @filter((i) -> i.get('TruckId') == truckId)

    return {
        Truck: Truck,
        Trucks: Trucks,
        Booking: Booking,
        Bookings: Bookings
        PickingItem: PickingItem,
        PickingItems: PickingItems
    }
)