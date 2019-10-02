define(['angular'],
function (angular) {
    "use strict";

    return function($q, $resource, apiResourceHelper) {
        var that = this,
            actions = apiResourceHelper.getDefaultActions(),
            searchResource = apiResourceHelper.createResource('Merchandising/Brand/', {}, actions);
            
        apiResourceHelper.createActions(actions);

        that.get = function () {
            return apiResourceHelper.get(searchResource);
        };
    };
});