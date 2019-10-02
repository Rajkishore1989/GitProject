define(['angular'],
function (angular) {
    "use strict";

    return function ($q, $resource, apiResourceHelper, pageHelper) {
        var that = this,
            actions = apiResourceHelper.getDefaultActions(),
            searchResource = apiResourceHelper.createResource('Merchandising/TopSkuReport/Search', {}, actions);
            
        apiResourceHelper.createActions(actions);
       
        that.search = function (params) {
            //if (params.dateFrom) {
            //    params.dateFrom = pageHelper.localDate(params.dateFrom);
            //}
            //
            //if (params.dateTo) {
            //    params.dateTo = pageHelper.localDate(params.dateTo);
            //}

            return apiResourceHelper.create(searchResource, params);
        };
    };
});