define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/reports/topSku/controllers/topSku',
        'merchandising/reports/topSku/controllers/topSkuPrint',
        'merchandising/reports/topSku/services/topSkuResourceProvider',
        'merchandising/shared/services/reportHelper'
],
    function (angular, $, cosacs, merchandising, topSkuCtrl, topSkuPrintCtrl, topSkuRepo) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();
                angular.module('merchandising')
                    .service('topSkuResourceProvider', ['$q', '$resource', 'apiResourceHelper', 'pageHelper', topSkuRepo])
                    .controller('topSkuCtrl', ['$scope', '$timeout', '$filter', 'pageHelper', 'topSkuResourceProvider', 'locationResourceProvider', 'reportHelper', topSkuCtrl])
                    .controller('topSkuPrintCtrl', ['$scope', '$location', 'pageHelper', 'reportHelper', topSkuPrintCtrl]);
                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });