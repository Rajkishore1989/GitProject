define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/reports/stockValue/controllers/stockValue',
        'merchandising/reports/stockValue/controllers/stockValuePrint',
        'merchandising/reports/stockValue/services/stockValueResourceProvider',
        'merchandising/shared/services/periodProvider',
        'merchandising/shared/services/reportHelper'
],
    function (angular, $, cosacs, merchandising, reportCtrl, printCtrl, repo) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();
                angular.module('merchandising')
                    .service('stockValueResourceProvider', ['$q', '$resource', 'apiResourceHelper', repo])
                    .controller('stockValueCtrl', ['$scope', '$timeout', '$filter', 'pageHelper', 'stockValueResourceProvider', 'locationResourceProvider', 'periodProvider', 'reportHelper', reportCtrl])
                    .controller('stockValuePrintCtrl', ['$scope', '$location', 'pageHelper', 'reportHelper', printCtrl]);
                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });