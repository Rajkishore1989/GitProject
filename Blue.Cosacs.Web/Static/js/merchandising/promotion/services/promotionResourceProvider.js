define(['angular'],
function() {
    "use strict";

    return function ($q, $resource, apiResourceHelper) {
        var that = this,
            actions = apiResourceHelper.getDefaultActions(),
            resource = apiResourceHelper.createResource('Merchandising/Promotion/Save', {}, actions);
           
        apiResourceHelper.createActions(actions);

        that.save = function (model) {
            if (model.id) {
                return apiResourceHelper.update(resource, { promotion: model });
            } else {
                return apiResourceHelper.create(resource, { promotion: model });
            }
        };
    };
});