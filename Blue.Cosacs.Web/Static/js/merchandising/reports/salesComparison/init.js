define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/reports/salesComparison/controllers/salesComparison',
        'merchandising/reports/salesComparison/services/salesComparisonProvider',
        'merchandising/reports/salesComparison/services/brandProvider',
        'merchandising/shared/services/periodProvider',
        'merchandising/shared/services/reportHelper'
],
    function (angular, $, cosacs, merchandising, ctrl, salesComparisonProvider, brandProvider) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();

                angular.module('merchandising')
                     .service('salesComparisonProvider', ['$q', '$resource', 'apiResourceHelper', salesComparisonProvider])
                     .service('brandProvider', ['$q', '$resource', 'apiResourceHelper', brandProvider])
                     .controller('salesComparisonCtrl', ['$scope', '$timeout', 'pageHelper', 'locationResourceProvider', 'salesComparisonProvider', 'brandProvider', 'periodProvider', 'reportHelper', ctrl]);
                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });