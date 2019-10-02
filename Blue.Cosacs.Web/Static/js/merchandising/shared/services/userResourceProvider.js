define(['angular'],
function() {
    "use strict";

    return function ($q, $resource, apiResourceHelper) {
        var that = this,
            actions = apiResourceHelper.getDefaultActions(),
            userResource = apiResourceHelper.createResource('Merchandising/User', {}, actions);

        apiResourceHelper.createActions(actions);

        that.get = function() {
            return apiResourceHelper.get(userResource);
        };
    };
});