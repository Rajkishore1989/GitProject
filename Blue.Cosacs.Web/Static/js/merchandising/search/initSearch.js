define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/search/controllers/defaultSearch',
        'merchandising/shared/services/taxHelper'

],
    function (angular, $, cosacs, merchandising, searchController, taxHelper) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();

                angular.module('merchandising')
                    .controller('SearchController', ['$scope', 'taxHelper', searchController]);

                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };

    });