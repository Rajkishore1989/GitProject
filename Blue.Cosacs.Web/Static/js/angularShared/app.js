/*global define*/
define(['angular', 'angularShared/interceptor', 'angularShared/loader', 'localisation', 'angular.ui',
    'angular-resource', 'angular-sanitize', 'angular.bootstrap', 'angularShared/services', 'angularShared/filters', 'angularShared/enums',
        'angularShared/directives'],
    function (angular, interceptor, loader) {
        'use strict';
        return function () {
            return angular.module('myApp', ['ui', 'ui.bootstrap', 'cosacs.directives', 'cosacs.services', 'cosacs.filters', 'cosacs.enums', 'ngResource', 'ngSanitize'])
                .config(['$locationProvider', function ($locationProvider) {
                    $locationProvider.html5Mode(true).hashPrefix('!');
                }
                ])
                .factory('xhr', ['$http', '$rootScope', loader])
                .config(['$httpProvider', function ($httpProvider) {
                    $httpProvider.responseInterceptors.push(interceptor);
                }
                ])
                .filter('lookupValue', function (lookup) {  //usage <div> $scope.data | lookupValue:'pickListId' </div>
                    return function (key, pickListId) {
                        return lookup.getValue(key, pickListId);
                    };
                })
                .service('controllerRouting', function () {
                    return {
                        exportUrl: 'Report/DynamicReport/GenericReportExport',
                        reportUrl: 'Report/DynamicReport/GenericReport'
                    };
                });
        };
    });
