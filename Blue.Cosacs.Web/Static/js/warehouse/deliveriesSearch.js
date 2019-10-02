/*global define*/
define(['angular', 'jquery', 'url', 'spa', 'moment', 'angularShared/app', 'facetsearch/controller', 'facetsearch/directive'],
function (angular, $, url, spa, moment, app, facetController, facetDirective) {
    'use strict';
    return {
        init: function ($el) {
            var searchController = function ($scope) {
                $scope.moment = moment;

                $scope.showSchedule = function (event) {
                    spa.go('/Warehouse/Delivery/Confirmation/' + $(event.currentTarget).data('id'));
                };

                var resultClicked = function (event, data) {
                    if (data.domEvent.target.tagName !== 'A') {
                        return spa.go('/Warehouse/Delivery/Confirmation/' + data.resultItem.LoadId);
                    }
                };

                $scope.$on('facetsearch:result:click', resultClicked);
            };

            app().controller('FacetController', facetController)
                .directive('facetsearch', facetDirective)
                .controller('SearchController', ['$scope', searchController]);

            return angular.bootstrap($el, ['myApp']);
        }
    };
});