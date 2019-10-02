define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/reports/tradingReport/controllers/tradingReport',
        'merchandising/reports/tradingReport/services/tradingReportResourceProvider'
],
    function (angular, $, cosacs, merchandising, ctrl, repo) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();
                angular.module('merchandising')
                    .service('tradingReportResourceProvider', ['$q', '$resource', 'apiResourceHelper', 'pageHelper', repo])
                    .controller('TradingReportCtrl', ['$scope', '$timeout', 'pageHelper', 'tradingReportResourceProvider', ctrl]);
                
                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });