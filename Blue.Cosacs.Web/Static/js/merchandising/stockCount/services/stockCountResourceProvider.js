define(['angular', 'underscore'],
function (angular, _) {
    "use strict";

    return function ($q, $resource, apiResourceHelper) {
        var that = this,
            actions = apiResourceHelper.getDefaultActions(),
            resource = apiResourceHelper.createResource('Merchandising/StockCount/:id', { id: '@id' }, actions),
            cancelResource = apiResourceHelper.createResource('Merchandising/StockCount/Cancel', {}, actions),
            closeResource = apiResourceHelper.createResource('Merchandising/StockCount/Close', {}, actions),
            searchResource = apiResourceHelper.createResource('Merchandising/StockCount/Search', {}, actions),
            productSearchResource = apiResourceHelper.createResource('Merchandising/StockCount/ProductSearch', {}, actions),
            productSave = apiResourceHelper.createResource('Merchandising/StockCount/SaveAll', {}, actions);

        apiResourceHelper.createActions(actions);

        // accepts an individual model or an array of models
        that.save = function (model) {
            var models = _.isArray(model) ? model : [].concat(model);
            return apiResourceHelper.update(productSave, { model: models });
        };

        that.cancel = function (id) {
            return apiResourceHelper.update(cancelResource, { id: id });
        };

        that.close = function (id) {
            return apiResourceHelper.update(closeResource, { id: id});
        };

        that.search = function (params, pageSize, pageNumber) {
            params = angular.copy(params);
            params.pageSize = pageSize;
            params.pageNumber = pageNumber;
            return apiResourceHelper.get(searchResource, params);
        };

        that.productSearch = function (params) {
            return apiResourceHelper.get(productSearchResource, params);
        };
    };
});