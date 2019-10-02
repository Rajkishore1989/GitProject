define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/stockAdjustment/controllers/stockAdjustment',
        'merchandising/stockAdjustment/services/stockAdjustmentResourceProvider',
        'merchandising/shared/services/locationResourceProvider',
        'merchandising/stockAdjustment/controllers/stockAdjustmentSearch'
],
    function (angular, $, cosacs, merchandising, stockAdjustmentCtrl, stockAdjustmentRepo, locationRepo, searchCtrl) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();

                angular.module('merchandising')
                    .service('stockAdjustmentResourceProvider', ['$q', '$resource', 'apiResourceHelper', 'pageHelper', stockAdjustmentRepo])
                    .controller('StockAdjustmentCtrl', ['$scope', '$location', 'pageHelper', 'user', 'stockAdjustmentResourceProvider', 'locationResourceProvider', '$timeout', stockAdjustmentCtrl])
                    .controller('StockAdjustmentSearchCtrl', ['$scope', '$timeout', '$filter', '$location', 'pageHelper', 'stockAdjustmentResourceProvider', 'locationResourceProvider', searchCtrl]);
                
                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });