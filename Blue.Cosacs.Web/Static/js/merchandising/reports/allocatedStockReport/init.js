define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/reports/allocatedStockReport/controllers/allocatedStockReport',
        'merchandising/reports/allocatedStockReport/services/allocatedStockReportProvider',
        'merchandising/reports/allocatedStockReport/controllers/allocatedStockReportPrint',
        'merchandising/shared/services/reportHelper'
],
    function (angular, $, cosacs, merchandising, ctrl, allocatedStockReportProvider, printCtrl) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();

                angular.module('merchandising')
                     .service('allocatedStockReportProvider', ['$q', '$resource', 'apiResourceHelper', allocatedStockReportProvider])
                    .controller('allocatedStockReportCtrl', ['$scope', '$timeout', 'pageHelper', 'locationResourceProvider', 'allocatedStockReportProvider', 'reportHelper', ctrl])
                    .controller('allocatedStockReportPrintCtrl', ['$scope', '$location', 'pageHelper', 'reportHelper', printCtrl]);
                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });