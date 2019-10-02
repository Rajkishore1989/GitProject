define(['angular'],
function () {
    "use strict";

    return function ($q, $resource, apiResourceHelper) {
        var that = this,
            actions = apiResourceHelper.getDefaultActions(),
            resource = apiResourceHelper.createResource('Merchandising/GoodsReceiptDirect/:id', { id: '@id' }, actions),
            cancelResource = apiResourceHelper.createResource('Merchandising/GoodsReceiptDirect/Cancel/:id', { id: '@id' }, actions),
            approveResource = apiResourceHelper.createResource('Merchandising/GoodsReceiptDirect/Approve/:id', { id: '@id' }, actions);

        apiResourceHelper.createActions(actions);

        that.save = function (model) {
                return apiResourceHelper.create(resource, { model: model });
        };

        that.saveComments = function(model) {
            return apiResourceHelper.update(resource, { id: model.id, referenceNumbers: model.referenceNumbers, comments: model.comments });
        };

        that.cancel = function (id) {
            return apiResourceHelper.update(cancelResource, { id: id });
        };

        that.approve = function (id, comments) {
            return apiResourceHelper.update(approveResource, { id: id, comments: comments });
        };
    };
});