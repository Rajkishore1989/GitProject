/*global define*/
define(['angular', 'underscore', 'url', 'spa', 'moment', 'angularShared/app',
    'facetsearch/controller', 'facetsearch/directive'],

function (angular, _, url, spa, moment, app, facetController, facetDirective) {
    'use strict';
    return {
        init: function ($el) {

            var searchController = function ($scope) {
                $scope.moment = moment;

                var resultSelected = function (event, data) {

                    return spa.go('/Warehouse/Picking/Confirmation/' + data.resultItem.PickListNo);
                };

                $scope.$on('facetsearch:result:click', resultSelected);
            };


            app().controller('FacetController', facetController)
                .directive('facetsearch', facetDirective)
                .controller('SearchController', ['$scope', searchController]);

            return angular.bootstrap($el, ['myApp']);
        }
    };
});