define(['angular'],
function () {
    "use strict";

    return function ($q, $resource, apiResourceHelper) {
        var that = this,
            actions = apiResourceHelper.getDefaultActions(),
            vendorReturnResource = apiResourceHelper.createResource('Merchandising/VendorReturnDirect/:id', { id: '@id' }, actions),
            approveResource = apiResourceHelper.createResource('Merchandising/VendorReturnDirect/Approve/:id', { id: '@id' }, actions);

        apiResourceHelper.createActions(actions);

        that.save = function (model) {
            return apiResourceHelper.create(vendorReturnResource, { model: model });
        };

        that.approve = function (id, referenceNumber, comments) {
            return apiResourceHelper.update(approveResource, { id: id, referenceNumber: referenceNumber, comments: comments });
        };
    };
});