// jshint ignore: start
/* global moment */
define([
        'angular',
        'underscore',
        'url',
        'moment'
],
    function (angular, _, url, moment) {
        'use strict';

        return function ($scope, $timeout, pageHelper, reportHelper) {

            $scope.exportDate = null;

            $scope.dateFormat = pageHelper.dateFormat;

            function configureDatePicker() {
                $timeout(function () {
                    $('.date').datepicker('option', 'maxDate', new Date());
                }, 0);
            }

            $scope.exportReportData = function (exportDate) {
                var datePart = null;
                if (!exportDate) {
                    datePart = moment(new Date()).format('YYYY-MM-DD');
                } else {
                    datePart = moment.utc(exportDate).format('YYYY-MM-DD');
                }

                url.open('/Merchandising/WeeklyTradingReport/ExportData?' + $.param({ reportDate: datePart }));
            };

            $scope.getExport = function () {
                
            };

            configureDatePicker();
        };
    });
/* jshint ignore:end */