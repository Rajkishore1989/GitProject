define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/stockAdjustmentReason/controllers/stockAdjustmentReason',
        'merchandising/stockAdjustmentReason/controllers/primaryReason',
        'merchandising/stockAdjustmentReason/controllers/secondaryReason',
        'merchandising/stockAdjustmentReason/services/primaryReasonResourceProvider',
        'merchandising/stockAdjustmentReason/services/secondaryReasonResourceProvider'
],
    function (angular, $, cosacs, merchandising, stockAdjustmentReasonCtrl, primaryReasonCtrl, secondaryReasonCtrl, primaryRepo, secondaryRepo) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();

                angular.module('merchandising')
                    .service('primaryReasonResourceProvider', ['$q', '$resource', 'apiResourceHelper', primaryRepo])
                    .service('secondaryReasonResourceProvider', ['$q', '$resource', 'apiResourceHelper', secondaryRepo])
                    .controller('StockAdjustmentReasonCtrl', ['$scope', '$location', 'pageHelper', 'user', 'primaryReasonResourceProvider', 'secondaryReasonResourceProvider','$rootScope', stockAdjustmentReasonCtrl])
                    .controller('PrimaryReasonCtrl', ['$scope', 'pageHelper', 'primaryReasonResourceProvider','$rootScope', primaryReasonCtrl])
                    .controller('SecondaryReasonCtrl', ['$scope', 'pageHelper', 'secondaryReasonResourceProvider', '$rootScope', secondaryReasonCtrl]);

                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });