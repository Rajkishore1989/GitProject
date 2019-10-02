define([
        'angular',
        'jquery',
        'underscore',
        'url',
        'angularShared/app',
        'merchandising/app',
        'merchandising/perioddata/controllers/periodDataController',
        'facetsearch/service',
        'underscore.string',
        'angular.ui',
        'angular.bootstrap',
        'lib/select2'
    ],
    function (angular, $, _, url, cosacs, merchandising, PeriodDataController, facetService) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();
                angular.module('merchandising')
                    .service('facetService', facetService)
                    .controller('PeriodDataController', ['$scope', '$location', 'pageHelper', '$http', '$attrs', 'user', PeriodDataController]);
                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });