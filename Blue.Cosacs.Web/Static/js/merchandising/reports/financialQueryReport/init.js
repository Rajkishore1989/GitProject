define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/reports/financialQueryReport/controllers/financialQueryReport',
        'merchandising/reports/financialQueryReport/services/financialQueryResourceProvider'
],
    function (angular, $, cosacs, merchandising, reportCtrl, financialQueryRepo) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();

                angular.module('merchandising')
                    .service('financialQueryResourceProvider', ['$q', '$resource', 'apiResourceHelper', 'pageHelper', financialQueryRepo])
                    .controller('FinancialQueryReportCtrl', ['$scope', '$timeout', 'pageHelper', 'financialQueryResourceProvider', 'locationResourceProvider', reportCtrl]);
                
                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });