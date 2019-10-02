define(['angular'],
function () {
    "use strict";

    return function ($q, $resource, apiResourceHelper) {
        var that = this,
            actions = apiResourceHelper.getDefaultActions(),
            resource = apiResourceHelper.createResource('Merchandising/StockCountStart/:id', { id: '@id' }, actions);

        apiResourceHelper.createActions(actions);

        that.start = function (id) {
            return apiResourceHelper.create(resource, { model: id });
        };
    };
});