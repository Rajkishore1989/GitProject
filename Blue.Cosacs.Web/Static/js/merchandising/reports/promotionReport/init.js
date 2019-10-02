define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/reports/promotionReport/controllers/promotionReport',
        'merchandising/reports/promotionReport/services/promotionResourceProvider',
        'merchandising/reports/promotionReport/controllers/promotionPrint',
        'merchandising/shared/services/reportHelper'
],
    function (angular, $, cosacs, merchandising, reportCtrl, promotionRepo, reportPrintCtrl) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();

                angular.module('merchandising')
                    .service('promotionResourceProvider', ['$q', '$resource', 'apiResourceHelper', 'pageHelper', promotionRepo])
                    .controller('PromotionReportCtrl', ['$scope', '$timeout', 'pageHelper', 'promotionResourceProvider', 'locationResourceProvider', 'reportHelper', reportCtrl])
                    .controller('PromotionReportPrintCtrl', ['$scope', '$location', 'pageHelper', 'reportHelper', reportPrintCtrl]);

                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });