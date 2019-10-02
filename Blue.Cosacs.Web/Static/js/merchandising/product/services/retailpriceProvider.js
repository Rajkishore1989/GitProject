define(['angular'],
function() {
    "use strict";

    return function($q, $resource, apiResourceHelper) {
        var that = this,
            actions = apiResourceHelper.getDefaultActions(),
            resource = apiResourceHelper.createResource('/Merchandising/RetailPrice/:id', { id: '@id' }, actions),
            deleteResource = apiResourceHelper.createResource('Merchandising/RetailPrice/Delete/', { }, actions);

        apiResourceHelper.createActions(actions);

        that.create = function (retailPrice) {
            return apiResourceHelper.create(resource, { retailPrice: retailPrice });
        };

        that.remove = function (retailPrice) {
            return apiResourceHelper.update(deleteResource, { retailPrice: retailPrice });
        };
    };
});
