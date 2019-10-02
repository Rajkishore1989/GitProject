define(['angular'],
function() {
    "use strict";

    return function ($q, $resource, apiResourceHelper) {
        var that = this,
            actions = apiResourceHelper.getDefaultActions(),
            locationGetResource = apiResourceHelper.createResource('Merchandising/Locations/Get/:id', { id: '@id' }, actions), //warning: hacks
            locationGetListResource = apiResourceHelper.createResource('Merchandising/Locations/GetList/', actions); //warning: hacks

        apiResourceHelper.createActions(actions);

        that.get = function(id) {
            return apiResourceHelper.get(locationGetResource, id ? { id: id } : {});
        };

        that.getList = function (whOnly) {
            return apiResourceHelper.get(locationGetListResource, { warehouseOnly: whOnly || false });
        };
    };
});