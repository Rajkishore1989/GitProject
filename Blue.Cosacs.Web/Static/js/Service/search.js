/*global define*/
define(['angular', 'underscore', 'url', 'moment', 'spa', 'confirm', 'angularShared/app', 'notification', 'alert', 'angularShared/loader',
    'angularShared/interceptor', 'facetsearch/controller', 'facetsearch/directive', 'angular.ui', 'underscore.string'],
    function (angular, _, url, moment, spa, confirm, app, notification, alert, loader, interceptor, facetController, facetDirective) {
        'use strict';

        return {
            init: function ($el) {

                var navigateToServiceRequest = function (data) {
                    spa.go('/Service/Requests/' + data.element.data('request-id'));
                };

                var createNewServiceRequest = function (data) {
                    spa.go('/Service/Requests/New?customerId=' + (data.resultItem.CustomerId ? data.resultItem.CustomerId : ''));
                };

                var searchResultClicked = function (event, data) {
                    if (data.domEvent.srcElement.tagName === 'BUTTON') {
                        createNewServiceRequest(data);
                    } else {
                        navigateToServiceRequest(data);
                    }
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

                var searchController = function ($scope) {
                    $scope.datePickerSettings = {
                        maxDate: "+0D",
                        minDate: "-10Y",
                        dateFormat: "D, d MM, yy",
                        changeMonth: true,
                        changeYear: true
                    };

                    var openQueryUrl = function (urlToOpen, searchResults) {
                        if (searchResults.available <= 1000) {
                            return url.open(urlToOpen + '?query=' + JSON.stringify(searchResults.query));
                        } else {
                            alert('Your filters returned more than 1000 Service Requests. Please update your filters to reduce this number to under a 1000.', 'Filters issue');
                            return false;
                        }
                    };

                    var summaryPrint = function (event, searchResults) {
                        var ids = getRequestIds(searchResults.results);

                        if (ids.length === 0) {
                            return notification.show('Please select from the available filters for a Summary print', 'Summary Print');
                        } else {
                            openQueryUrl('/Service/Requests/SummaryPrint', searchResults);
                            return false;
                        }
                    };

                    var exportResults = function (event, searchResults) {
                        var ids = getRequestIds(searchResults.results);
                        if (ids.length === 0) {
                            notification.show('Please select from the available filters to export', 'Export');
                        } else {
                            openQueryUrl('/Service/Requests/Export', searchResults);
                        }

                        return;
                    };

                    $scope.$on('facetsearch:result:click', searchResultClicked);
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
