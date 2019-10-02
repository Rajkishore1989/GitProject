define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/reports/stockMovement/controllers/stockMovementReport',
        'merchandising/reports/stockMovement/services/stockMovementResourceProvider'
],
    function (angular, $, cosacs, merchandising, reportCtrl, stockMovementRepo) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();

                angular.module('merchandising')
                    .service('stockMovementResourceProvider', ['$q', '$resource', 'apiResourceHelper', 'pageHelper', stockMovementRepo])
                    .controller('StockMovementReportCtrl', ['$scope', '$timeout', '$location', 'pageHelper', 'stockMovementResourceProvider', 'locationResourceProvider', 'hierarchyResourceProvider', reportCtrl]);
                
                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });