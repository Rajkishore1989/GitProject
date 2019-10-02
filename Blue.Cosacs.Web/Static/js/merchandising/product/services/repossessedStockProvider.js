define(['angular'],
function() {
    "use strict";

    return function($q, $resource, apiResourceHelper) {
        var that = this,
            actions = apiResourceHelper.getDefaultActions(),
            resource = apiResourceHelper.createResource('/Merchandising/RepossessedStock/:id', { id: '@id' }, actions);

        apiResourceHelper.createActions(actions);

        that.update = function(id) {
            return apiResourceHelper.update(resource, { id: id });
        };
    };
});
