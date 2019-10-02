define(['angular'],
function () {
    "use strict";

    return function ($q, $resource, apiResourceHelper) {
        var that = this,
            actions = apiResourceHelper.getDefaultActions(),
            confirmCostResource = apiResourceHelper.createResource('Merchandising/GoodsReceipt/ConfirmCost/:id', { id: '@id' }, actions);

        apiResourceHelper.createActions(actions);

        that.confimCost = function (id) {
            return apiResourceHelper.update(confirmCostResource, { id: id });
        };
    };
});