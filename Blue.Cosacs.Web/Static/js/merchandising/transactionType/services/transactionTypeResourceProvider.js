define(['angular', 'underscore'],
function (angular, _) {
    "use strict";

    return function ($q, $resource, apiResourceHelper) {
        var that = this,
            actions = apiResourceHelper.getDefaultActions(),
            saveResource = apiResourceHelper.createResource('Merchandising/TransactionType/Save', { }, actions);

        apiResourceHelper.createActions(actions);

        that.save = function (model) {
            var models = _.isArray(model) ? model : [].concat(model);
            return apiResourceHelper.update(saveResource, { model: models });
        };
    };
});