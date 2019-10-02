/*global define,alert*/
define(['angular', 'underscore', 'url', 'moment', 'spa', 'confirm', 'notification', 'angularShared/app',
    'facetsearch/controller', 'facetsearch/directive', 'lib/select2', 'underscore.string', 'angular.ui', 'angular.bootstrap'],

function (angular, _, url, moment, spa, confirm, notification, app, facetController, facetDirective) {
    'use strict';

    return {
        init: function ($el) {
            var navigateToServiceRequest = function (event, data) {
                spa.go('/Service/Requests/' + data.element.data('request-id'));
            };

            var getRequestIds = function (requests) {
                return _.pluck(requests, 'RequestId');
            };

            var batchPrint = function (event, searchResults) {
                var ids = getRequestIds(searchResults.results);
                if (ids.length === 0) {
                    return notification.show('Please select from the available filters for a Batch print', 'Batch Print');
                } else {
                    var message = '';
                    if (ids.length > 50) {
                        message = 'You are viewing <strong>' + ids.length + '</strong> results but can only print a maximum of <strong>50</strong> at one time.<br/><br/>';
                        ids = ids.splice(0, 50);
                    }

                    message += 'Are you sure you want to print <strong>' + ids.length + '</strong> Service Requests?';
                    return confirm(message, 'Batch Print', function (ok) {
                        if (ok) {
                            return url.open("/Service/Requests/BatchPrintGetData?Ids=" + ids);
                        }
                    });
                }
            };

            var exportResults = function (event, searchResults) {
                var ids = getRequestIds(searchResults.results);
                if (ids.length === 0) {
                    return notification.show('Please select from the available filters to export', 'Export');
                } else {
                    return url.open("/Service/Requests/ExportCurrentUser?query=" + JSON.stringify(searchResults.query));
                }
            };

            var summaryPrint = function (event, searchResults) {
                var ids = getRequestIds(searchResults.results);
                if (ids.length === 0) {
                    return notification.show('Please select from the available filters for a Summary print', 'Summary Print');
                } else {
                    return url.open("/Service/Requests/SummaryPrintCurrentUser?query=" + JSON.stringify(searchResults.query));
                }
            };

            var searchController = function ($scope) {
                $scope.datePickerSettings = {
                    defaultDate: "0",
                    dateFormat: "D, d MM, yy",
                    changeMonth: true,
                    changeYear: true
                };

                $scope.$on('facetsearch:result:click', navigateToServiceRequest);
                $scope.$on('facetsearch:action:summaryprint', summaryPrint);
                $scope.$on('facetsearch:action:batchprint', batchPrint);
                $scope.$on('facetsearch:action:export', exportResults);
            };

            app().controller('FacetController', facetController)
                .directive('facetsearch', facetDirective)
                .controller('SearchController', ['$scope', searchController]);

            return angular.bootstrap($el, ['myApp']);
        }
    };
});