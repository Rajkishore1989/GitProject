define(['angular', 'underscore', 'url'],
function(angular, _, url) {
    'use strict';
    return function($q, pageHelper,$resource, helpers) {
        var that = this;

        function getDefaultActions() {
            return {
                query: { method: 'GET', isArray: true },
                get: { method: 'GET' },
                create: { method: 'POST' },
                CovertProductTypeCodes: { method: 'POST' },
                createMultiple: { method: 'POST', isArray: true },
                update: { method: 'PUT' },
                remove: { method: 'DELETE' }
            };
        }

        function createAction(action) {
            return function(repo, data) {
                var defer = $q.defer();
                pageHelper.loading(true);
              
                repo[action](helpers.cleanse(data),
                    function (result) {
                        pageHelper.loading(false);
                        defer.resolve(result.data);
                    },
                    function (error) {
                        var err = error.data || {
                            status: 'error',
                            message: 'Unable to complete action. An error occurred on the server.'
                        };
                        pageHelper.loading(false);
                        defer.reject(err);
                    });
                return defer.promise;
            };
        }

        function createResource(link, param, actions) {
            var resovledUrl = url.resolve(link);

            return $resource(resovledUrl, param, actions);
        }

        function createActions(actions) {
            _.each(actions, function(v, k) {
                that[k] = createAction(k);
            });
        }

        that.createResource = createResource;
        that.getDefaultActions = getDefaultActions;
        that.createActions = createActions;
    };
});