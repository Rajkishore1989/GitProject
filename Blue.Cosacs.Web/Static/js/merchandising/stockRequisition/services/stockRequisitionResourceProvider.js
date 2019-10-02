define(['angular'],
function (angular) {
    "use strict";

    return function ($q, $resource, apiResourceHelper, pageHelper) {
        var that = this,
            actions = apiResourceHelper.getDefaultActions(),
            resource = apiResourceHelper.createResource('Merchandising/StockRequisition/:id', { id: '@id' }, actions),
            stockInfoResource = apiResourceHelper.createResource('Merchandising/StockRequisition/StockInfo/:id', { id: '@id' }, actions),
            searchResource = apiResourceHelper.createResource('Merchandising/StockRequisition/Search/:id', { id: '@id' }, actions);
            
        apiResourceHelper.createActions(actions);

        that.save = function (model) {
            if (model.id) {
                return apiResourceHelper.update(resource, model);
            }
            return apiResourceHelper.create(resource, model);
        };

        that.remove = function (id) {
            return apiResourceHelper.remove(resource, { id: id });
        };

        that.getStockInfo = function (params) {
            return apiResourceHelper.get(stockInfoResource, params);
        };

        that.search = function (params) {
            //if (params.createdFrom) {
            //    params.createdFrom = pageHelper.localDate(params.createdFrom);
            //}
            //
            //if (params.createdTo) {
            //    params.createdTo = pageHelper.localDate(params.createdTo);
            //}

            return apiResourceHelper.get(searchResource, params);
        };
    };
});