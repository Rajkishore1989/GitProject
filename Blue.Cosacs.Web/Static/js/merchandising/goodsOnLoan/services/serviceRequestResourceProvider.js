define(['angular'],
function (angular) {
    "use strict";

    return function ($q, $resource, apiResourceHelper) {
        var that = this,
            actions = apiResourceHelper.getDefaultActions(),
            resource = apiResourceHelper.createResource('Service/Requests/GetCustomerDetails/:id', { id: '@id' }, actions);

        apiResourceHelper.createActions(actions);

        that.getCustomerDetails = function (id) {
            return apiResourceHelper.get(resource, { id: id });
        };
    };
});