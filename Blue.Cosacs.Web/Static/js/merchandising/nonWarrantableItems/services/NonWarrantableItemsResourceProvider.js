/* jshint ignore:start */
/*global define*/
define(['angular'],
    function (angular) {
        'use strict';

        return function (apiResourceHelper) {
            var that    = this,
                actions = apiResourceHelper.getDefaultActions(),
                resource = apiResourceHelper.createResource('Merchandising/NonWarrantableItems/:productId', { productId: '@productId' }, actions),
                searchResource = apiResourceHelper.createResource('Merchandising/NonWarrantableItems/Search/:productId', { productId: '@productId' }, actions);

            apiResourceHelper.createActions(actions);

            that.update = function (model) {
                return apiResourceHelper.update(resource, model);
            };

            that.search = function (pageSize, pageIndex) {
                var params = {
                    pageSize: pageSize,
                    pageIndex: pageIndex
                };
                return apiResourceHelper.get(searchResource, params);
            };
        };
    });
/* jshint ignore:end */