define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/reports/warehouseOversupplyReport/controllers/warehouseOversupply',
        'merchandising/reports/warehouseOversupplyReport/controllers/warehouseOversupplyPrint',
        'merchandising/reports/warehouseOversupplyReport/services/warehouseOversupplyResourceProvider',
        'merchandising/shared/services/reportHelper'
],
    function (angular, $, cosacs, merchandising, warehouseOversupplyCtrl, warehouseOversupplyPrintCtrl, warehouseOversupplyRepo) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();
                angular.module('merchandising')
                    .service('warehouseOversupplyResourceProvider', ['$q', '$resource', 'apiResourceHelper', warehouseOversupplyRepo])
                    .controller('warehouseOversupplyCtrl', ['$scope', '$timeout', '$filter', 'pageHelper', 'warehouseOversupplyResourceProvider', 'locationResourceProvider', 'reportHelper', warehouseOversupplyCtrl])
                    .controller('warehouseOversupplyPrintCtrl', ['$scope', '$timeout', '$filter', '$location', 'pageHelper', 'reportHelper', warehouseOversupplyPrintCtrl]);                
                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });