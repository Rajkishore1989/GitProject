define(['angular', 'underscore'],
function(angular, _) {
    "use strict";

    return function($q, $resource, apiResourceHelper) {
             var that = this,
            actions = apiResourceHelper.getDefaultActions(),
            productResource = apiResourceHelper.createResource('/Merchandising/Products/:id', { id: '@id' }, actions),
            productResource2 = apiResourceHelper.createResource('/Merchandising/Products/CovertProductTypeCodes/:id',{}, actions),
            productSearchResource = apiResourceHelper.createResource('Merchandising/Products/SelectSearch?q=:q', {q: '@q'}, actions),
            productAssociateResource = apiResourceHelper.createResource('/Merchandising/Products/Associate', {}, actions),
            productAssociatedResource = apiResourceHelper.createResource('/Merchandising/Products/Associated', {}, actions),
            productDeleteAssociatedResource = apiResourceHelper.createResource('/Merchandising/Products/DeleteAssociation/:id', { id: '@id' }, actions),
            productStatusUpdateResource = apiResourceHelper.createResource('/Merchandising/Products/StatusUpdate', {}, actions),
            setSkuResource = apiResourceHelper.createResource('/Merchandising/SetSku/Get', {}, actions),
            skuExistsResource = apiResourceHelper.createResource('/Merchandising/SkuExists/Get', {}, actions),
            statusResource = apiResourceHelper.createResource('/Merchandising/ProductStatus/:id', { id: '@id' }, actions),
            availabilityResource = apiResourceHelper.createResource('Merchandising/Products/GetAvailability:id', { id: '@id' }, actions),
            pricingResource = apiResourceHelper.createResource('/Merchandising/Products/PricingInfo?productId=:productId&locationId=:locationId&fascia=:fascia&effectiveDate=:effectiveDate', { productId: '@productId', locationId: '@locationId', fascia: '@fascia', effectiveDate: '@effectiveDate' }, actions);

        apiResourceHelper.createActions(actions);

        that.create = function (product) {
            return apiResourceHelper.create(productResource, { product: product });
        };
        that.CovertProductTypeCodes = function (product) {
            return apiResourceHelper.CovertProductTypeCodes(productResource2, { product: product });
        };

        that.getProduct= function (id) {
            return apiResourceHelper.get(productResource, { id: id });
        };

        that.availability = function (productId, locationId) {
            return apiResourceHelper.get(availabilityResource, { productId: productId, locationId: locationId });
        };

        that.skuExists = function(sku) {
            return apiResourceHelper.get(skuExistsResource, { sku: sku });
        };

        that.lookupSetProduct = function(sku) {
            return apiResourceHelper.get(setSkuResource, { sku: sku });
        };

        that.searchProducts = function (keywords) {
            return apiResourceHelper.query(productSearchResource, { q: keywords });
        };

        that.deleteProductAssociation = function(id) {
            return apiResourceHelper.remove(productDeleteAssociatedResource, { id: id });
        };

        that.associateProduct = function (sku, hierarchy) {
            return apiResourceHelper.create(productAssociateResource, { sku: sku, hierarchy: hierarchy });
        };

        that.getAssociatedProducts = function (hierarchy) {
            return apiResourceHelper.createMultiple(productAssociatedResource, { hierarchy: hierarchy });
        };

        that.saveStatus = function (model) {
            if (model.id) {
                return apiResourceHelper.update(statusResource, { id: model.id, model: model });
            } else {
                return apiResourceHelper.create(statusResource, { model: model });
            }
        };

        that.removeStatus = function (model) {
            return apiResourceHelper.remove(statusResource, { id: model.id });
        };

        that.getProductStatusUpdate = function(id) {
            return apiResourceHelper.get(productStatusUpdateResource, { id: id });
        };

        that.get = function(productId, locationId, fascia, effectiveDate) {
            return apiResourceHelper.get(pricingResource, { productId: productId, locationId: locationId, fascia: fascia, effectiveDate: effectiveDate });
        };
    };
});