define(['angular'],
function (angular) {
    "use strict";

    return function ($q, $resource, apiResourceHelper, pageHelper) {
        var that = this,
            actions = apiResourceHelper.getDefaultActions(),
            resource = apiResourceHelper.createResource('Merchandising/GoodsOnLoan/:id', { id: '@id' }, actions),
            collect = apiResourceHelper.createResource('Merchandising/GoodsOnLoan/Collect', { id: '@id' }, actions),
            searchResource = apiResourceHelper.createResource('Merchandising/GoodsOnLoan/Search/:id', { id: '@id' }, actions);
            
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

        that.collect = function (id) {
            return apiResourceHelper.update(collect, { id: id });
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