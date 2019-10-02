define(['angular'],
function (angular) {
    "use strict";

    return function ($q, $resource, apiResourceHelper) {
        var that = this,
            actions = apiResourceHelper.getDefaultActions(),
            vendorReturnResource = apiResourceHelper.createResource('Merchandising/VendorReturn/:id', { id: '@id' }, actions),
            approveResource = apiResourceHelper.createResource('Merchandising/VendorReturn/Approve/:id', { id: '@id' }, actions),
            searchResource = apiResourceHelper.createResource('Merchandising/VendorReturn/Search/:id', {id: '@id' }, actions);

        apiResourceHelper.createActions(actions);

        that.save = function (model) {
            return apiResourceHelper.create(vendorReturnResource, { model: model });
        };

        that.approve = function (id, referenceNumber, comments, dateApprove) {
            return apiResourceHelper.update(approveResource, { id: id, referenceNumber: referenceNumber, comments: comments, dateApprove : dateApprove });
        };

        that.search = function (params, pageSize, pageIndex) {
            params = angular.copy(params);
            params.pageSize = pageSize;
            params.pageIndex = pageIndex;
            return apiResourceHelper.get(searchResource, params);
        };
    };
});