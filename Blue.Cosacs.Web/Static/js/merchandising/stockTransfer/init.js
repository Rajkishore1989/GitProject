define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/stockTransfer/controllers/stockTransfer',
        'merchandising/stockTransfer/controllers/stockTransferSearch',
        'merchandising/stockTransfer/services/stockTransferResourceProvider'
],
    function (angular, $, cosacs, merchandising, stockTransferCtrl, searchCtrl, stockTransferRepo) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();
                angular.module('merchandising')
                    .service('stockTransferResourceProvider', ['$q', '$resource', 'apiResourceHelper', 'pageHelper', stockTransferRepo])
                    .controller('StockTransferCtrl', [
                        '$scope', '$location', '$timeout', 'pageHelper', 'user', 'stockTransferResourceProvider', 'locationResourceProvider',
                        'productResourceProvider', stockTransferCtrl
                    ])
                    .controller('StockTransferSearchCtrl', ['$scope', '$timeout', 'pageHelper', 'stockTransferResourceProvider', 'locationResourceProvider', searchCtrl]);
                
                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });