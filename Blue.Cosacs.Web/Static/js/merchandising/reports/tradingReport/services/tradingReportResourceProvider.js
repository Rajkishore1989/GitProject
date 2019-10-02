define(['angular'],
function (angular) {
    "use strict";

    return function ($q, $resource, apiResourceHelper, pageHelper) {
        var that = this,
            actions = apiResourceHelper.getDefaultActions(),
            resource = apiResourceHelper.createResource('Merchandising/TradingReport/Get', {}, actions);
            
        apiResourceHelper.createActions(actions);

        that.get = function () {
            return apiResourceHelper.get(resource, {});
        };
    };
});