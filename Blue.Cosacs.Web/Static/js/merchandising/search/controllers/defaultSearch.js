define([
        'angular',
        'underscore',
        'url',
        'moment'
    ],
    function (angular, _, url, moment) {
        'use strict';

        return function ($scope, taxHelper) {

            $scope.tax = {};

            $scope.datePickerSettings = {
                maxDate: "+10Y",
                minDate: "-10Y",
                dateFormat: "D, d MM, yy",
                changeMonth: true,
                changeYear: true
            };

            taxHelper.getCurrentTaxRate().then(function (tax) {
                $scope.tax = tax;
            });

            $scope.addTax = function (price, rate) {
                var inclusive = $scope.tax.taxSetting;
                return inclusive ? price * (1 + rate) : price;
            };

            $scope.margin = function (awc, price) {
                return 1 - (awc / price);
            };

            $scope.url = function (link) {
                return url.resolve(link);
            };

            $scope.isActiveDate = function (promo) {
                var date = moment().startOf('day');
                if (moment(promo.StartDate).diff(date) > 0) {
                    return "Active on " + moment(promo.StartDate).format("DD MMM YYYY");
                }
                if (moment(promo.EndDate).diff(date) < 0) {
                    return "Ended on " + moment(promo.EndDate).format("DD MMM YYYY");
                }
                return "Active";
            };

            $scope.isActive = function (promo) {
                var date = moment().startOf('day');
                return moment(promo.StartDate).diff(date) <= 0 && moment(promo.EndDate).diff(date) >= 0;
            };
        };
    });

