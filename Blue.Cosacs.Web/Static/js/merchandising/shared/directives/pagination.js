define(['angular', 'url', 'underscore'],
function (angular, url, _) {
    'use strict';
    return function (pageHelper, helpers) {
        return {
            restrict: 'E',
            scope: {
                get: '=',                   // required: binds to a repo get function 
                params: '=',                // required: the search parameters to pass to the get method
                control: '=',               // required: exposes pagination control functions: { get(), reset(), pageNumber(), pageSize(), loading() }
                noResultsMessage: '@',      // optional: message to display if there are no results
                defaultParams: '=',         // optional: a function that returns a default params object. if not specified the default params object will be {}.  Use this for additional functionality on reset/clear
                preload: '=',               // optional: decides whether to prefetch first page of data on load. Defaults to true.
                pageSize: '=',              // optional: number of results per page
                callback: '='               // optional: a callback that accepts the search results, run after each search completes
            },
            transclude: true,
            templateUrl: url.resolve('/Static/js/merchandising/shared/templates/pagination.html'),
            link: function(scope) {
                var pageSize = scope.pageSize || 10;
                scope.pageNumber = 1;

                function processResult(result) {
                    scope.result = result;
                    if (scope.control) {
                        scope.control.page = result.page;
                    }
                }

                scope.resultCount = function() {
                    return (scope.result && scope.result.count) || 0;
                };

                scope.pageCount = function() {
                    return Math.ceil(scope.resultCount() / pageSize);
                };

                scope.resultCountText = function() {
                    var count = scope.resultCount();
                    return '(' + count + ' item' + (count !== 1 ? 's' : '') + ')';
                };

                scope.getPage = function(pgSize, pageNumber) {
                    if (scope.loading) {
                        return;
                    }

                    scope.loading = true;

                    var params = scope.params ? angular.copy(scope.params) : scope.defaultParams ? scope.defaultParams() : {};
                    params.pageSize = pgSize || pageSize;
                    params.pageNumber = pageNumber || scope.pageNumber;

                    scope.get(helpers.cleanse(params))
                        .then(function (result) {
                            if (scope.callback) {
                                scope.callback(result);
                            }
                            if (scope.loading) {
                                scope.loading = false;
                                processResult(result);
                            }
                        }, function (err) {
                            if (scope.loading) {
                                scope.loading = false;
                                if (err && err.message) {
                                    pageHelper.notification.showPersistent(err.message);
                                }
                            }
                        });
                };

                scope.clear = function () {
                    if (scope.defaultParams) {
                        scope.params = scope.defaultParams();
                    } else {
                        scope.params = {};
                    }

                    scope.pageNumber = 1;
                    scope.result = null;
                };

                scope.noResultsMessage = scope.noResultsMessage || 'No results found.';

                scope.$watch('control', function () {
                    scope.control = scope.control || {};
                    scope.control.get = function() {
                        scope.pageNumber = 1;
                        scope.getPage();
                    };
                    scope.control.reset = scope.clear;
                    scope.control.pageNumber = function() { return scope.pageNumber; };
                    scope.control.pageSize = function() { return pageSize; };
                    scope.control.page = [];
                    scope.control.loading = function() { return scope.loading; };
                });

                scope.clear();
                if (scope.preload) {
                    scope.getPage();
                }
            }
        };
    };
});