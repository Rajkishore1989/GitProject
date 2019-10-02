define(['angular'],
function() {
    "use strict";

    return function ($q, $resource, apiResourceHelper) {
        var that = this,
            actions = apiResourceHelper.getDefaultActions(),
            taxResource = apiResourceHelper.createResource('Merchandising/Tax/:id', { id: '@id' }, actions),
            allResource = apiResourceHelper.createResource('Merchandising/Tax/GetAllSystem', {}, actions),
            taxSettingsResource = apiResourceHelper.createResource('Merchandising/Tax/GetTaxSettings',{}, actions);
           
        apiResourceHelper.createActions(actions);
        
        that.save = function (model) {
            if (model.id) {
                return apiResourceHelper.update(taxResource, { id: model.id, model: model });
            } else {
                return apiResourceHelper.create(taxResource, { model: model });
            }
        };

        that.remove = function (model) {
            return apiResourceHelper.remove(taxResource, { id: model.id });
        };

        that.getTaxSettings = function () {
            return apiResourceHelper.get(taxSettingsResource);
        };

        that.getAll = function () {
            return apiResourceHelper.get(allResource);
        };
    };
});