define(['angular'],
function (angular) {
    "use strict";

    return function ($q, $resource, apiResourceHelper, pageHelper) {
        var that = this,
            actions = apiResourceHelper.getDefaultActions(),
            resource = apiResourceHelper.createResource('Merchandising/StockAllocation/:id', { id: '@id' }, actions),
            searchResource = apiResourceHelper.createResource('Merchandising/StockAllocation/Search/:id', { id: '@id' }, actions);
            
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