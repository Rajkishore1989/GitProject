define(['angular'],
function() {
    "use strict";

    return function($q, $resource, apiResourceHelper) {

        var that = this,
            actions = apiResourceHelper.getDefaultActions(),
            productTagResource = apiResourceHelper.createResource('/Merchandising/Products/Tags', {}, actions),
            supplierTagResource = apiResourceHelper.createResource('/Merchandising/Products/Vendors', {}, actions),
            storeTagResource = apiResourceHelper.createResource('/Merchandising/Products/StoreTypes', {}, actions),
            hierarchySettingResource = apiResourceHelper.createResource('/Merchandising/Products/HierarchySettings', {}, actions);

        apiResourceHelper.createActions(actions);

        that.saveProductTags = function(productId, tags) {
            return apiResourceHelper.create(productTagResource, { id: productId, productTags: tags });
        };

        that.saveStoreTags = function(productId, tags) {
            return apiResourceHelper.create(storeTagResource, { id: productId, storeTypes: tags });
        };

        that.saveHierarchySettings = function(productId, level, tag) {
            return apiResourceHelper.create(hierarchySettingResource, { id: productId, level: level, tag: tag });
        };

        that.addSupplierTag = function(productId, supplierId) {
            return apiResourceHelper.create(supplierTagResource, { id: productId, supplierId: supplierId });
        };

        that.removeSupplierTag = function(productId, supplierId) {
            return apiResourceHelper.remove(supplierTagResource, { id: productId, supplierId: supplierId });
        };

        that.getSupplierTags = function() {
            return apiResourceHelper.get(supplierTagResource, {});
        };
    };
});