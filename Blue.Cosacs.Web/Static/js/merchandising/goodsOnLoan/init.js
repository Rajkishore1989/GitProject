define([
        'angular',
        'angularShared/app',
        'merchandising/app',
        'merchandising/goodsOnLoan/controllers/goodsOnLoan',
        'merchandising/goodsOnLoan/controllers/goodsOnLoanSearch',
        'merchandising/goodsOnLoan/services/goodsOnLoanResourceProvider',
        'merchandising/goodsOnLoan/services/serviceRequestResourceProvider'
],
    function (angular, cosacs, merchandising, goodsOnLoanCtrl, searchCtrl, goodsOnLoanRepo, serviceRequestRepo) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();
                angular.module('merchandising')
                    .service('goodsOnLoanResourceProvider', ['$q', '$resource', 'apiResourceHelper', 'pageHelper', goodsOnLoanRepo])
                    .service('serviceRequestResourceProvider', ['$q', '$resource', 'apiResourceHelper', serviceRequestRepo])
                    .controller('GoodsOnLoanCtrl', ['$scope', '$location', 'pageHelper', 'user', 'goodsOnLoanResourceProvider', 'locationResourceProvider', '$timeout', 'serviceRequestResourceProvider', 'productResourceProvider', goodsOnLoanCtrl])
                    .controller('GoodsOnLoanSearchCtrl', ['$scope', '$timeout', 'pageHelper', 'goodsOnLoanResourceProvider', 'locationResourceProvider', searchCtrl]);
                
                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });