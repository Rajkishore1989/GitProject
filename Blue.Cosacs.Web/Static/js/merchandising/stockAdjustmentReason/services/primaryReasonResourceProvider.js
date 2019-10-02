define(['angular'],
function () {
    "use strict";

    return function ($q, $resource, apiResourceHelper) {
        var that = this,
            actions = apiResourceHelper.getDefaultActions(),
            resource = apiResourceHelper.createResource('Merchandising/StockAdjustmentReason/:id', { id: '@id' }, actions);

        apiResourceHelper.createActions(actions);

        that.create = function (model) {
            return apiResourceHelper.create(resource, { model: model });
        };

        that.remove = function (id) {
            return apiResourceHelper.remove(resource, { id: id });
        };
    };
});