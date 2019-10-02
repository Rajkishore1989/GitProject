define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/shared/services/purchaseResourceProvider',
        'merchandising/goodsreceiptdirect/services/goodsReceiptDirectResourceProvider',
        'merchandising/goodsreceiptdirect/controllers/directReceipt',
        'merchandising/goodsreceiptdirect/controllers/receiptProducts',
        'merchandising/goodsreceiptdirect/directives/createDirectItems',
        'merchandising/goodsreceiptdirect/directives/viewDirectItems',
        'merchandising/shared/directives/createGoodsReceipt',
        'merchandising/goodsreceiptdirect/directives/editDirectReceipt'
    ],
    function (angular, $, cosacs, merchandising, purchaseResource, repo, directCtrl, receiptProductCtrl, createDirectItems, viewDirectItems, createPurchase, editPurchase) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();

                angular.module('merchandising')
                    .service('goodsReceiptResourceProvider', ['$q', '$resource', 'apiResourceHelper', repo])
                    .controller('ReceiptProductCtrl', ['$scope', 'pageHelper', receiptProductCtrl])
                    .controller('DirectCtrl', ['$scope', '$timeout', '$location', 'pageHelper', 'user', 'goodsReceiptResourceProvider', 'purchaseResourceProvider', 'vendorResourceProvider', 'locationResourceProvider', 'userResourceProvider', directCtrl])
                    .directive('createDirectItems', createDirectItems)
                    .directive('viewDirectItems', viewDirectItems)
                    .directive('createGoodsReceipt', createPurchase)
                    .directive('editDirectReceipt', ['user', editPurchase]);

                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });
