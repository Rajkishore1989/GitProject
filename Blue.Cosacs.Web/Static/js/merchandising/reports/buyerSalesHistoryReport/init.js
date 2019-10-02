define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/reports/buyerSalesHistoryReport/controllers/buyerSalesHistory',
        'merchandising/reports/buyerSalesHistoryReport/controllers/buyerSalesHistoryPrint',
        'merchandising/reports/buyerSalesHistoryReport/services/buyerSalesHistoryResourceProvider',
        'merchandising/shared/services/pageHelper',
        'merchandising/shared/services/reportHelper',
        'notification'
],
    function (angular, $, cosacs, merchandising, buyerSalesHistoryCtrl, buyerSalesHistoryPrintCtrl, buyerSalesHistoryRepo, pageHelper, reportHelper) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();
                angular.module('merchandising')
                    .service('buyerSalesHistoryResourceProvider', ['$q', '$resource', 'apiResourceHelper', buyerSalesHistoryRepo])
                    .controller('buyerSalesHistoryCtrl', ['$scope', '$timeout', '$filter', 'pageHelper', 'buyerSalesHistoryResourceProvider', 'locationResourceProvider', 'reportHelper',  buyerSalesHistoryCtrl])
                    .controller('buyerSalesHistoryPrintCtrl', ['$scope', '$timeout', '$filter', '$location', 'pageHelper', 'reportHelper', buyerSalesHistoryPrintCtrl]);
                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });