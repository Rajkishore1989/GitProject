/*global define*/
define(['underscore', 'angular', 'moment', 'url'],
    function (_, angular, moment, url) {
        'use strict';

        var calenderSrv = function ($http, $q) {

            var getFreeBookings = function (query) {
                return $http.get(url.resolve('/Service/TechnicianDiaries/GetFreeBookings?query=' + query))
                    .then(function (response) {
                        return _.sortBy(response.data, function (booking) {
                            return booking.RequestId;
                        });

                    });

            };

            var getFreeBooking = function (requestId) {
                return $http.get(url.resolve('/Service/TechnicianDiaries/GetFreeBooking?requestId=' + requestId));

            };

            return {
                getFreeBookings: getFreeBookings,
                getFreeBooking: getFreeBooking
            };

        };

        calenderSrv.$inject = ['$http', '$q'];

        return calenderSrv;

    });
