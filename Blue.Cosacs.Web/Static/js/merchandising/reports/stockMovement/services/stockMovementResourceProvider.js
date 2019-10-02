define(['angular'],
function (angular) {
    "use strict";

    return function ($q, $resource, apiResourceHelper, pageHelper) {
        var that = this,
            actions = apiResourceHelper.getDefaultActions(),
            searchResource = apiResourceHelper.createResource('Merchandising/StockMovementReport/Search/', { }, actions);
            
        apiResourceHelper.createActions(actions);

        that.search = function (params) {
            var query = angular.copy(params);

            //if (query.createdFrom) {
            //    query.createdFrom = pageHelper.localDate(query.createdFrom);
            //}
            //
            //if (query.createdTo) {
            //    query.createdTo = pageHelper.localDate(query.createdTo);
            //}

            return apiResourceHelper.get(searchResource, query);
        };
    };
});