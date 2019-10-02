define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/reports/negativeStock/controllers/negativeStock',
        'merchandising/reports/negativeStock/services/negativeStockResourceProvider',
        'merchandising/shared/services/periodProvider',
        'merchandising/shared/services/reportHelper'
],
    function (angular, $, cosacs, merchandising, reportCtrl, repo) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();
                angular.module('merchandising')
                    .service('negativeStockResourceProvider', ['$q', '$resource', 'apiResourceHelper', repo])
                    .controller('negativeStockCtrl', ['$scope', '$timeout', '$filter', 'pageHelper', 'negativeStockResourceProvider', 'locationResourceProvider', 'periodProvider', 'reportHelper', reportCtrl]);
                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });