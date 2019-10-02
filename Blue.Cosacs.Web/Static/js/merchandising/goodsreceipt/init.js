define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/shared/services/purchaseResourceProvider',
        'merchandising/goodsreceipt/services/goodsReceiptResourceProvider',
        'merchandising/goodsreceipt/controllers/goodsReceipt',
        'merchandising/goodsreceipt/controllers/receiptPurchases',
        'merchandising/goodsreceipt/directives/createItems',
        'merchandising/goodsreceipt/directives/viewItems',
        'merchandising/shared/directives/createGoodsReceipt',
        'merchandising/goodsreceipt/directives/editGoodsReceipt',
        'merchandising/goodsreceipt/controllers/search'
    ],
    function (angular, $, cosacs, merchandising, purchaseResource, repo, ctrl, receiptPurchaseCtrl, createItems, viewItems, createPurchase, editPurchase, searchController) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();

                angular.module('merchandising')
                    .service('goodsReceiptResourceProvider', ['$q', '$resource', 'apiResourceHelper', repo])
                    .controller('ReceiptPurchaseCtrl', ['$scope', 'pageHelper', receiptPurchaseCtrl])
                    .controller('ReceiptCtrl', ['$scope', '$timeout', '$location', 'pageHelper', 'user', 'goodsReceiptResourceProvider', 'purchaseResourceProvider', 'vendorResourceProvider', 'locationResourceProvider', 'userResourceProvider', ctrl])
                    .controller('GoodsReceiptSearchController', ['$scope', searchController])
                    .directive('createItems', createItems)
                    .directive('viewItems', viewItems)
                    .directive('createGoodsReceipt', createPurchase)
                    .directive('editGoodsReceipt', ['user', editPurchase]);

                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });
