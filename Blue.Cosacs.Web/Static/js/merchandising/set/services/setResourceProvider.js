define(['angular'],
function() {
    "use strict";

    return function ($q, $resource, apiResourceHelper) {
        var that = this,
            actions = apiResourceHelper.getDefaultActions(),
            setResource = apiResourceHelper.createResource('/Merchandising/Set/:id', { id: '@id' }, actions),
            componentsResource = apiResourceHelper.createResource('/Merchandising/Set/Component/:id', { id: '@id' }, actions),
            locationsResource = apiResourceHelper.createResource('/Merchandising/Set/Location/:id', { id: '@id' }, actions);

        apiResourceHelper.createActions(actions);

        that.save = function (model) {
            if (model.id) {
                return apiResourceHelper.update(setResource, { id: model.id, model: model });
            } else {
                return apiResourceHelper.create(setResource, { model: model });
            }
        };

        that.addComponent = function (setId, id, sku, quantity) {
            return apiResourceHelper.create(componentsResource, {
                setId: setId,
                id: id,
                sku: sku,
                quantity: quantity
            });
        };

        that.removeComponent = function (id, sku) {
            return apiResourceHelper.remove(componentsResource, { id: id, sku: sku });
        };

        that.saveLocation = function (id, effectiveDate, fascia, locationId, regularPrice, dutyFreePrice, cashPrice) {
            return apiResourceHelper.create(locationsResource, {
                id: id,
                effectiveDate: effectiveDate,
                fascia: fascia,
                locationId: locationId,
                regularPrice: regularPrice || 0, 
                dutyFreePrice: dutyFreePrice || 0,
                cashPrice: cashPrice || 0
            });
        };

        that.removeLocation = function (id, effectiveDate, fascia, locationId) {
            var payload = { id: id, effectiveDate: effectiveDate, locationId: locationId };

            if (fascia !== null) {
                payload.fascia = fascia;
            }

            return apiResourceHelper.remove(locationsResource, payload);
        };
    };
});