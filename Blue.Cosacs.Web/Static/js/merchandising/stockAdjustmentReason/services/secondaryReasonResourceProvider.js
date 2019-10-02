define(['angular'],
function () {
    "use strict";

    return function ($q, $resource, apiResourceHelper) {
        var that = this,
            actions = apiResourceHelper.getDefaultActions(),
            resource = apiResourceHelper.createResource('Merchandising/StockAdjustmentSecondaryReason/:id', { id: '@id' }, actions),
            setDefault = apiResourceHelper.createResource('Merchandising/StockAdjustmentSecondaryReason/SetDefault/:id', { id: '@id' }, actions);

        apiResourceHelper.createActions(actions);

        that.save = function (model) {
            if (model.id) {
                return apiResourceHelper.update(resource, { id: model.id, model: model });
            }
            return apiResourceHelper.create(resource, { model: model });
        };

        that.remove = function (id) {
            return apiResourceHelper.remove(resource, { id: id });
        };

        that.setDefault = function (id) {
            return apiResourceHelper.update(setDefault, { id: id });
        };
    };
});