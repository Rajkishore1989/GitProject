define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/product/controllers/product',
        'merchandising/product/services/repossessedStockProvider',
        'merchandising/product/services/costsResourceProvider',
        'merchandising/product/directives/incoterm',
        'merchandising/product/directives/stockLevels',
        'merchandising/product/directives/sales',
        'merchandising/product/directives/costControls',
        'merchandising/product/directives/retailPricing',
        'merchandising/product/directives/promotionalPricing',
        'merchandising/shared/services/productResourceProvider',
        'merchandising/product/services/retailPriceProvider',
        'merchandising/shared/services/taxHelper'
    ],
    function (angular, $, cosacs, merchandising, productCtrl, repossessedStockProvider, costsResourceProvider, incoterm, stockLevels, sales, costControls, retailPricing, promotionalPricing, productResourceProvider, retailPriceProvider) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();

                angular.module('merchandising')
                    .service('repossessedStockProvider', ['$q', '$resource', 'apiResourceHelper', repossessedStockProvider])
                    .service('retailPriceProvider', ['$q', '$resource', 'apiResourceHelper', retailPriceProvider])
                    .service('costsResourceProvider', ['$q', '$resource', 'apiResourceHelper', costsResourceProvider])
                    .service('retailPriceProvider', ['$q', '$resource', 'apiResourceHelper', retailPriceProvider])
                    .directive('pbIncoterm', ['user', incoterm])
                    .directive('pbStockLevels', ['user', '$rootScope', stockLevels])
                    .directive('pbSales', ['user', '$rootScope', sales])
                    .directive('pbCostControls', ['user', 'pageHelper', 'costsResourceProvider', 'productResourceProvider', '$rootScope', costControls])
                    .directive('pbRetailPrice', ['user', 'pageHelper', 'taxHelper', '$timeout', 'retailPriceProvider', '$dialog', '$filter', 'productResourceProvider', '$rootScope', retailPricing])
                    .directive('pbPromotionalPrice', ['user', 'pageHelper', 'taxHelper', promotionalPricing])
                    .controller('ProductCtrl', ['$scope', '$http', '$q', '$location', 'user', 'pageHelper', 'taxHelper', 'taggingResourceProvider', 'repossessedStockProvider', 'productResourceProvider', 'vendorResourceProvider','$anchorScroll', productCtrl]);
                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });