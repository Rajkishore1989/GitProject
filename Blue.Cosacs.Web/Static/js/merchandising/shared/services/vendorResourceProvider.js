define(['angular'],
function() {
    "use strict";

    return function ($q, $resource, apiResourceHelper) {
        var that = this,
            actions = apiResourceHelper.getDefaultActions(),
            vendorResource = apiResourceHelper.createResource('Merchandising/Vendors/:id', { id: '@id' }, actions),
            vendorTagResource = apiResourceHelper.createResource('/Merchandising/Vendors/Tags', {}, actions),
            vendorGetResource = apiResourceHelper.createResource('Merchandising/Vendors/Get/:id', { id: '@id' }, actions),
            vendorGetListResource = apiResourceHelper.createResource('Merchandising/Vendors/GetList/', actions);

        apiResourceHelper.createActions(actions);

        that.get = function(id) {
            return apiResourceHelper.get(vendorGetResource, id ? { id: id } : {});
        };

        that.getList = function (options) {
            return apiResourceHelper.get(vendorGetListResource, options || {});
        };

        that.save = function (model) {
            if (model.id) {
                return apiResourceHelper.update(vendorResource, { id: model.id, model: model });
            } else {
                return apiResourceHelper.create(vendorResource, { model: model });
            }
        };

        that.saveVendorTags = function (vendorId, tags) {
            return apiResourceHelper.create(vendorTagResource, { id: vendorId, vendorTags: tags });
        };
    };
});