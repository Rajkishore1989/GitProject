define(['angular'],
function (angular) {
    "use strict";

    return function ($q, $resource, apiResourceHelper, pageHelper) {
        var that = this,
            actions = apiResourceHelper.getDefaultActions(),
            searchResource = apiResourceHelper.createResource('Merchandising/SummaryUpdateControlReport/Search/', { }, actions);
            
        apiResourceHelper.createActions(actions);

        that.search = function (params) {
            var query = angular.copy(params);

            //if (query.fromDate) {
            //    query.fromDate = pageHelper.localDate(query.fromDate);
            //}
            //
            //if (query.toDate) {
            //    query.toDate = pageHelper.localDate(query.toDate);
            //}

            return apiResourceHelper.update(searchResource, query);
        };
    };
});