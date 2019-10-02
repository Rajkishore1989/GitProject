/* global define*/
define(['angular', 'underscore', 'spa', 'moment', 'url', 'angularShared/app', 'facetsearch/controller', 'facetsearch/directive'],

function (angular, _, spa, moment, url, app, facetController, facetDirective) {
    'use strict';
    return {
        init: function ($el) {

            var searchController = function ($scope) {
                $scope.moment = moment;

                var navigateToUser = function (event, data) {
                    spa.go('Admin/Users/Profile/' + data.resultItem.UserId);
                };

                $scope.$on('facetsearch:result:click', navigateToUser);
            };

            app().filter('stringList', function () {
                return function (input) {
                    return _.isArray(input) ? input.join(',') : 'None';
                };
            })
            .controller('FacetController', facetController)
            .directive('facetsearch', facetDirective)
            .controller('SearchController', ['$scope', searchController]);

            return angular.bootstrap($el, ['myApp']);
        }
    };
});