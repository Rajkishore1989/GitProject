define(['angular'],
function (angular) {
    "use strict";

    return function($q, $resource, apiResourceHelper) {
        var that = this,
            actions = apiResourceHelper.getDefaultActions(),
            searchResource = apiResourceHelper.createResource('Merchandising/StockValueReport/Search', {}, actions);
            
        apiResourceHelper.createActions(actions);
       
        that.search = function (params) {
            params.divisionName = params.hierarchy[1] || "";
            params.departmentName = params.hierarchy[2] || "";
            params.className = params.hierarchy[3] || "";
            return apiResourceHelper.create(searchResource, params);
          
        };
    };
});