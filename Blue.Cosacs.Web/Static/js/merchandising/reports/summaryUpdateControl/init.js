define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/reports/summaryUpdateControl/controllers/summaryUpdateControlReport',
        'merchandising/reports/summaryUpdateControl/controllers/summaryUpdateControlReportPrint',
        'merchandising/reports/summaryUpdateControl/services/summaryUpdateControlResourceProvider',
        'merchandising/shared/services/reportHelper'
],
    function (angular, $, cosacs, merchandising, reportCtrl, reportPrintCtrl, summaryUpdateControlRepo) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();

                angular.module('merchandising')
                    .service('summaryUpdateControlResourceProvider', ['$q', '$resource', 'apiResourceHelper', 'pageHelper', summaryUpdateControlRepo])
                    .controller('SummaryUpdateControlReportCtrl', ['$scope', '$timeout', '$location', 'pageHelper', 'summaryUpdateControlResourceProvider', 'locationResourceProvider', 'hierarchyResourceProvider', reportCtrl])
                    .controller('SummaryUpdateControlReportPrintCtrl', ['$scope', '$timeout', '$location', 'pageHelper', 'summaryUpdateControlResourceProvider', 'reportHelper', reportPrintCtrl]);

                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });