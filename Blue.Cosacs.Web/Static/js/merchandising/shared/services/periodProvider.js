define(['angular'],
function (angular) {
    "use strict";

    return function($q, $resource, apiResourceHelper) {
        var that = this,
            actions = apiResourceHelper.getDefaultActions(),
            searchResource = apiResourceHelper.createResource('Merchandising/PeriodData/GetCurrentAndPrevious', {}, actions);
            
        apiResourceHelper.createActions(actions);

        that.getCurrentAndPrevious = function () {
            return apiResourceHelper.get(searchResource);
        };
    };
});