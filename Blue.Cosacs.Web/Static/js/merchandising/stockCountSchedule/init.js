define([
        'angular',
        'lib/bootstrap/tooltip',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/shared/services/pageHelper',
        'merchandising/shared/services/dateHelper',
        'merchandising/stockCountSchedule/controllers/stockCountSchedule',
        'merchandising/stockCountSchedule/services/stockCountScheduleResourceProvider'
],
    function (angular, toolTip, $, cosacs, merchandising, pageHelper, dateHelper, stockCountScheduleCtrl, stockCountScheduleRepo) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();

                angular.module('merchandising')
                    .service('stockCountScheduleResourceProvider', ['$q', '$resource', 'apiResourceHelper', stockCountScheduleRepo])
                    .controller('StockCountScheduleCtrl', ['$scope', '$location', 'pageHelper', 'dateHelper', 'stockCountScheduleResourceProvider', 'locationResourceProvider', '$timeout', stockCountScheduleCtrl]);
                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });