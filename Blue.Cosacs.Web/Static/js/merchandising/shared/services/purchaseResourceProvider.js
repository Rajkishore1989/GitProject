define(['angular'],
function () {
    "use strict";

    return function ($q, $resource, apiResourceHelper) {
        var that = this,
            actions = apiResourceHelper.getDefaultActions(),
            resource = apiResourceHelper.createResource('Merchandising/Purchase/:id', { id: '@id' }, actions),
            notReceivedResource = apiResourceHelper.createResource('Merchandising/Purchase/NotReceived/', {}, actions),
            getForReceiptResource = apiResourceHelper.createResource('Merchandising/Purchase/GetForReceipt/', {}, actions),
            cancelResource = apiResourceHelper.createResource('Merchandising/Purchase/Cancel/:id', { id: '@id' }, actions),
            productResource = apiResourceHelper.createResource('Merchandising/Purchase/CancelProduct/:id', { id: '@id' }, actions),
            emailResource = apiResourceHelper.createResource('Merchandising/Purchase/Email/:id', { id: '@id' }, actions),
            labelResource = apiResourceHelper.createResource('Merchandising/Purchase/Labels/', { }, actions);

        apiResourceHelper.createActions(actions);

        that.get = function (id) {
            return apiResourceHelper.get(resource, { id: id });
        };

        that.getForReceipt = function (id) {
            return apiResourceHelper.get(getForReceiptResource, { id: id });
        };

        that.save = function (model) {
            if (model.id) {
                return apiResourceHelper.update(resource, { id: model.id, model: model });
            } else {
                return apiResourceHelper.create(resource, { model: model });
            }
        };

        that.notReceived = function (vendorId) {
            return apiResourceHelper.get(notReceivedResource, { vendorId: vendorId });
        };

        that.cancel = function (id) {
            return apiResourceHelper.update(cancelResource, { id: id });
        };

        that.email = function (id) {
            return apiResourceHelper.update(emailResource, { id: id });
        };

        that.getLabels = function(products) {
            return apiResourceHelper.create(labelResource, { products: products });
        };

        that.cancelProduct = function (id, poProductId) {
            return apiResourceHelper.create(productResource, { id: id, purchaseOrderProductId: poProductId });
        };
    };
});