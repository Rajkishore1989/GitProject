define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/shared/services/purchaseResourceProvider',
        'merchandising/purchase/controllers/purchase',
        'merchandising/purchase/controllers/product',
        'merchandising/purchase/directives/createItems',
        'merchandising/purchase/directives/editItems',
        'merchandising/purchase/directives/viewItems',
        'merchandising/purchase/directives/createPurchaseOrder',
        'merchandising/purchase/directives/editPurchaseOrder',
        'merchandising/purchase/directives/viewPurchaseOrder',
        'merchandising/purchase/directives/viewLabels'
    ],
    function (angular, $, cosacs, merchandising, repo, ctrl, productCtrl, createItems, editItems, viewItems, createPurchase, editPurchase, viewPurchase, viewLabels) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();

                angular.module('merchandising')
                    .controller('ProductCtrl', ['$scope','$timeout','pageHelper', productCtrl])
                    .controller('PurchaseCtrl', ['$scope', '$timeout', '$location', 'pageHelper', 'user', 'purchaseResourceProvider', 'vendorResourceProvider', 'locationResourceProvider', ctrl])
                    .directive('createItems', createItems)
                    .directive('editItems', editItems)
                    .directive('viewItems', viewItems)
                    .directive('createPurchaseOrder', createPurchase)
                    .directive('editPurchaseOrder', editPurchase)
                    .directive('viewPurchaseOrder', viewPurchase)
                    .directive('viewLabels', viewLabels);

                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });
