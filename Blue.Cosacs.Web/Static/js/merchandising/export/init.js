define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/export/controllers/export'
],
    function (angular, $, cosacs, merchandising, exportCtrl) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();

                angular.module('merchandising')
                    .controller('exportCtrl', ['$scope', exportCtrl]);

                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });
