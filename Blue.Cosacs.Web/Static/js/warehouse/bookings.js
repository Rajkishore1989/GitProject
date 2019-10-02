/* global define*/
define(['angular', 'underscore', 'moment', 'url', 'warehouse/bookingDisplay', 'angularShared/app',
    'facetsearch/controller', 'facetsearch/directive'],
    function (angular, _, moment, url, bookingDisplay, app, facetController, facetDirective) {
        "use strict";
        return {
            init: function ($el) {

                var searchController = function ($scope) {

                    $scope.moment = moment;

                    $scope.linkRequired = function (request) {
                        if (request.BookingStatus === "Booked") {
                            return false;
                        } else if (request.BookingStatus === "Exception") {
                            return true;
                        } else if (request.BookingStatus === "Cancelled" && _.isUndefined(request.PickListNo)) {
                            return false;
                        } else if (request.BookingStatus === "Delivered" && request.PickUp === "true") {
                            return false;
                        } else if (request.BookingStatus === "Closed") {
                            return false;
                        } else if (request.BookingStatus === "Printed" && request.PickUp === "true") {
                            return false;
                        } else if (request.BookingStatus === "Collected" && request.PickUp === "true") {
                            return false;
                        } else if (_.isUndefined(request.ScheduleNo)) {
                            return true;
                        } else {
                            return true;
                        }
                    };

                    $scope.showDetail = function (request) {
                        var status = request.BookingStatus;

                        var linkUrl = '';
                        if (status === "Exception" || status === "Rejected") {
                            linkUrl = '/Warehouse/Bookings/detail/' + request.BookingNo;
                        } else if (_.isUndefined(request.ScheduleNo)) {
                            linkUrl = '/Warehouse/Picking/Confirmation/' + request.PickListNo;
                        } else {
                            linkUrl = '/Warehouse/delivery/Confirmation/' + request.ScheduleNo;
                        }

                        url.open(linkUrl);
                    };

                    $scope.$on('facetsearch:result:click', bookingDisplay.bookingExpand);
                };

                app().controller('FacetController', facetController)
                .directive('facetsearch', facetDirective)
                .controller('SearchController', ['$scope', searchController]);

                return angular.bootstrap($el, ['myApp']);
            }
        };
    });
