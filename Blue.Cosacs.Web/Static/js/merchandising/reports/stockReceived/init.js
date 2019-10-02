define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/reports/stockReceived/controllers/stockReceivedReport',
        'merchandising/reports/stockReceived/services/stockReceivedResourceProvider'
],
    function (angular, $, cosacs, merchandising, reportCtrl, stockReceivedRepo) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();

                angular.module('merchandising')
                    .service('stockReceivedResourceProvider', ['$q', '$resource', 'apiResourceHelper', 'pageHelper', stockReceivedRepo])
                    .controller('StockReceivedReportCtrl', ['$scope', '$timeout', 'pageHelper', 'stockReceivedResourceProvider', 'locationResourceProvider', 'hierarchyResourceProvider', 'vendorResourceProvider', reportCtrl]);
                
                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });