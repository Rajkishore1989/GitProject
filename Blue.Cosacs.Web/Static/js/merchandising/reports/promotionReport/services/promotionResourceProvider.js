define(['angular', 'underscore'],
function (angular, _) {
    "use strict";

    return function ($q, $resource, apiResourceHelper) {
        var that = this,
            actions = apiResourceHelper.getDefaultActions(),
            searchResource = apiResourceHelper.createResource('Merchandising/PromotionReport/Search/', {}, actions),
            nameResource = apiResourceHelper.createResource('Merchandising/PromotionReport/GetNames/', {}, actions);

            
        apiResourceHelper.createActions(actions);

        that.search = function (params) {
            return apiResourceHelper.create(searchResource, params);
        };

        that.getNames = function (params) {
            return apiResourceHelper.get(nameResource, params);
        };
    };
});