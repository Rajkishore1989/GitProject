define(['angular'],
function (angular) {
    "use strict";

    return function ($q, $resource, apiResourceHelper) {
        var that = this,
            actions = apiResourceHelper.getDefaultActions(),
            resource = apiResourceHelper.createResource('Merchandising/StockCountSchedule/:id', { id: '@id' }, actions),
            previewResource = apiResourceHelper.createResource('Merchandising/StockCountSchedule/Preview/', {}, actions),
            checkResource = apiResourceHelper.createResource('Merchandising/StockCountSchedule/Exists/', {}, actions);

        apiResourceHelper.createActions(actions);

        that.create = function (model) {
            return apiResourceHelper.create(resource, { model: model });
        };

        that.cancel = function (id) {
            return apiResourceHelper.remove(resource, { id: id });
        };

        that.preview = function (params) {
            return apiResourceHelper.update(previewResource, params);
        };

        that.exists = function (locationId, countDate) {
            return apiResourceHelper.update(checkResource, { locationId: locationId, countDate: countDate });
        };
    };
});