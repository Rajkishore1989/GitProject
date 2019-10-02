define([
        'angular',
        'angularShared/app',
        'merchandising/app',
        'merchandising/stockRequisition/controllers/stockRequisition',
        'merchandising/stockRequisition/controllers/stockRequisitionSearch',
        'merchandising/stockRequisition/controllers/stockOnOrder',
        'merchandising/stockRequisition/services/stockRequisitionResourceProvider'
],
    function (angular, cosacs, merchandising, stockRequisitionCtrl, searchCtrl, stockRequisitionOnOrderCtrl, stockRequisitionRepo) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();
                angular.module('merchandising')
                    .service('stockRequisitionResourceProvider', ['$q', '$resource', 'apiResourceHelper', 'pageHelper', stockRequisitionRepo])
                    .controller('StockRequisitionCtrl', ['$scope', '$location', 'pageHelper', 'user', 'stockRequisitionResourceProvider', 'locationResourceProvider', stockRequisitionCtrl])
                    .controller('StockRequisitionSearchCtrl', ['$scope', '$timeout', 'pageHelper', 'stockRequisitionResourceProvider', 'locationResourceProvider', searchCtrl])
                    .controller('StockRequisitionOnOrderCtrl', ['$scope', 'pageHelper', stockRequisitionOnOrderCtrl]);
                
                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });