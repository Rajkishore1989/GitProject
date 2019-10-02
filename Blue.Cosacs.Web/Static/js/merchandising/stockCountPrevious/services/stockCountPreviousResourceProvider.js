define(['angular', 'underscore'],
function (angular, _) {
    "use strict";

    return function ($q, $resource, apiResourceHelper) {
        var that = this,
            actions = apiResourceHelper.getDefaultActions(),
            searchResource = apiResourceHelper.createResource('Merchandising/StockCountPrevious/Search', {}, actions);
            
        apiResourceHelper.createActions(actions);

        that.search = function (params) {
            return apiResourceHelper.get(searchResource, params);
        };

    };
});