define(['angular'],
function() {
    "use strict";

    return function ($q, $resource, apiResourceHelper) {
        var that = this,
            actions = apiResourceHelper.getDefaultActions(),
            costsResource = apiResourceHelper.createResource('Merchandising/CostPrice/:id', { id: '@id' }, actions);
           
        apiResourceHelper.createActions(actions);

        that.save = function (model) {
            if (model.id) {
                return apiResourceHelper.update(costsResource, { id: model.id, model: model });
            } else {
                return apiResourceHelper.create(costsResource, { model: model });
            }
        };
    };
});