define(['angular'],
function (angular) {
    "use strict";

    return function($q, $resource, apiResourceHelper) {
        var that = this,
            actions = apiResourceHelper.getDefaultActions(),
            searchResource = apiResourceHelper.createResource('Merchandising/AllocatedStockReport/Search', {}, actions);
            
        apiResourceHelper.createActions(actions);

        that.search = function (params) {
            return apiResourceHelper.create(searchResource, params);
        };
    };
});