/* jshint ignore:start */
define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/reports/weeklyTradingReport/controllers/weeklyTradingReport',
        'merchandising/shared/services/reportHelper'
],
    function (angular, $, cosacs, merchandising, WeeklyTradingReportCtrl) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();

                angular.module('merchandising')
                    .controller('WeeklyTradingReportCtrl', ['$scope', '$timeout', 'pageHelper', 'reportHelper', WeeklyTradingReportCtrl]);

                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });
/* jshint ignore:end */