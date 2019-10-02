define(['angular'],
function () {
    "use strict";

    return function ($q, $resource, apiResourceHelper) {
        var that = this,
            actions = apiResourceHelper.getDefaultActions(),
            resource = apiResourceHelper.createResource('Merchandising/GoodsReceipt/:id', { id: '@id' }, actions),
            cancelResource = apiResourceHelper.createResource('Merchandising/GoodsReceipt/Cancel/:id', { id: '@id' }, actions),
            commentsResource = apiResourceHelper.createResource('Merchandising/GoodsReceipt/Comments/:id', { id: '@id' }, actions),
            approveResource = apiResourceHelper.createResource('Merchandising/GoodsReceipt/Approve/:id', { id: '@id' }, actions);

        apiResourceHelper.createActions(actions);

        that.save = function (model) {
                return apiResourceHelper.create(resource, { model: model });
        };

        that.saveComments = function(model) {
            return apiResourceHelper.update(commentsResource, { id: model.id, comments: model.comments });
        };

        that.cancel = function (id) {
            return apiResourceHelper.update(cancelResource, { id: id });
        };

        that.approve = function (id, comments) {
            return apiResourceHelper.update(approveResource, { id: id, comments: comments });
        };
    };
});