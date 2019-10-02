/*global define*/
define(['angular', 'jquery', 'underscore', 'url', 'moment', 'spa', 'confirm', 'angularShared/app', 'notification',
    'facetsearch/controller', 'facetsearch/directive', 'angular.ui', 'angular.bootstrap', 'lib/select2', 'jquery.ui', 'underscore.string'],

function (angular, $, _, url, moment, spa, confirm, app, notification, facetController, facetDirective) {
    'use strict';

    return {
        init: function ($el) {

            var searchController = function ($scope, $timeout, $dialog, xhr) {
                $scope.datePickerSettings = {
                    defaultDate: "-1",
                    minDate: "-10Y",
                    dateFormat: "D, d MM, yy",
                    changeMonth: true,
                    changeYear: true
                };

                $scope.getWarrantyLink = function (warrantyId) {
                    return url.resolve('Warranty/Warranties/' + warrantyId);
                };
            };

            app().controller('FacetController', ['$scope', '$attrs', 'xhr', '$compile', facetController])
            .directive('facetsearch', facetDirective)
            .controller('WarrantySalesController', ['$scope', '$timeout', '$dialog', 'xhr', searchController]);

            return angular.bootstrap($el, ['myApp']);
        }
    };
});