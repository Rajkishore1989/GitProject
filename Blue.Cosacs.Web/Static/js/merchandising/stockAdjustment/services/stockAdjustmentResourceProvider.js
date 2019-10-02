define(['angular'],
function (angular) {
    "use strict";

    return function ($q, $resource, apiResourceHelper, pageHelper) {
        var that = this,
            actions = apiResourceHelper.getDefaultActions(),
            resource = apiResourceHelper.createResource('Merchandising/StockAdjustment/:id', { id: '@id' }, actions),
            reasonResource = apiResourceHelper.createResource('Merchandising/StockAdjustmentReason/Get', {}, actions),
            approveResource = apiResourceHelper.createResource('Merchandising/StockAdjustment/Approve/:id', { id: '@id' }, actions),
            searchResource = apiResourceHelper.createResource('Merchandising/StockAdjustment/Search/:id', { id: '@id' }, actions);
        apiResourceHelper.createActions(actions);

        that.save = function (model) {
            if (model.id) {
                return apiResourceHelper.update(resource, model);
            }
            return apiResourceHelper.create(resource, model);
        };

        that.approve = function (id, comments) {
            return apiResourceHelper.create(approveResource, { id: id, comments: comments });
        };

        that.remove = function (id) {
            return apiResourceHelper.remove(resource, { id: id });
        };

        that.getReasons = function() {
            return apiResourceHelper.get(reasonResource);
        };

        that.search = function (params, pageSize, pageIndex) {
            params = angular.copy(params);

            //if (params.maxCreatedDate) {
            //    params.maxCreatedDate = pageHelper.localDate(params.maxCreatedDate);
            //}
            //
            //if (params.minCreatedDate) {
            //    params.minCreatedDate = pageHelper.localDate(params.minCreatedDate);
            //}

            params.pageSize = pageSize;
            params.pageIndex = pageIndex;
            return apiResourceHelper.get(searchResource, params);
        };
       
    };
});