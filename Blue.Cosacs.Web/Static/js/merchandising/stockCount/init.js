define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/stockCount/controllers/product',
        'merchandising/stockCount/controllers/stockCount',
        'merchandising/stockCount/services/stockCountResourceProvider',
        'merchandising/stockCount/controllers/stockCountSearch'
],
    function (angular, $, cosacs, merchandising, productCtrl, stockCountCtrl, stockCountRepo, searchCtrl) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();

                angular.module('merchandising')
                    .service('stockCountResourceProvider', ['$q', '$resource', 'apiResourceHelper', stockCountRepo])
                    .controller('ProductCtrl', ['$scope', productCtrl])
                    .controller('StockCountCtrl', ['$scope', '$location', 'pageHelper', 'stockCountResourceProvider', 'user', stockCountCtrl])
                    .controller('StockCountSearchCtrl', ['$scope', '$timeout', '$filter', '$location', 'pageHelper', 'stockCountResourceProvider', 'locationResourceProvider', 'helpers', searchCtrl]);

                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });