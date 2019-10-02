define(['angular'],
function() {
    "use strict";

    return function ($q, $resource, apiResourceHelper) {
        var that = this,
            actions = apiResourceHelper.getDefaultActions(),
            resource = apiResourceHelper.createResource('/Merchandising/Combo/:id', { id: '@id' }, actions),
            componentsResource = apiResourceHelper.createResource('/Merchandising/Combo/Component/:id', { id: '@id' }, actions),
            locationsResource = apiResourceHelper.createResource('/Merchandising/Combo/Location/:id', { id: '@id' }, actions);

        apiResourceHelper.createActions(actions);

        that.get = function (model, startDate, endDate) {
            if (model.id) {
                return apiResourceHelper.get(resource, { id: model.id, startDate: startDate, endDate: endDate });
            } 
        };

        that.save = function (model) {
            if (model.id) {
                return apiResourceHelper.update(resource, { id: model.id, model: model });
            } else {
                return apiResourceHelper.create(resource, { model: model });
            }
        };

        that.addComponent = function (id, setProductId, sku, quantity) {
            return apiResourceHelper.create(componentsResource, {
                id: id,
                setProductId: setProductId || 0,
                sku: sku,
                quantity: quantity
            });
        };

        that.removeComponent = function (id, sku) {
            return apiResourceHelper.remove(componentsResource, { id: id, sku: sku });
        };

        that.saveLocation = function (id, fascia, locationId, locationPrices) {
            return apiResourceHelper.create(locationsResource, {
                id: id,
                fascia: fascia,
                locationId: locationId,
                locationPrices: locationPrices
            });
        };

        that.removeLocation = function (id, fascia, locationId) {
            var model = { id: id, locationId: locationId };
            if (fascia) {
                model.fascia = fascia;
            }
            return apiResourceHelper.remove(locationsResource, model);
        };
    };
});