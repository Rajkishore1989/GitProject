define(['angular'],
function() {
    "use strict";

    return function($q, $resource, apiResourceHelper) {
        var that = this,
            actions = apiResourceHelper.getDefaultActions(),
            resource = apiResourceHelper.createResource('/Merchandising/RepossessedConditions/:id', { id: '@id' }, actions);

        apiResourceHelper.createActions(actions);

        that.create = function(name, skuSuffix) {
            return apiResourceHelper.create(resource,{ name: name, skuSuffix: skuSuffix });
        };

        that.update = function (id, name, skuSuffix) {
            return apiResourceHelper.update(resource,{ id: id, name: name, skuSuffix: skuSuffix });
        };

        that.remove = function (id) {
            return apiResourceHelper.remove(resource, { id: id });
        };
    };
});