define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/taxRate/controllers/taxRate'
    ],
    function (angular, $, cosacs, merchandising, taxRateCtrl) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();

                angular.module('merchandising')
                    .controller('taxRateCtrl', ['$scope', taxRateCtrl]);

                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });
