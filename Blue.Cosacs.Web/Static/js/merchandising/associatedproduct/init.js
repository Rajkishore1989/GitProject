define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/associatedproduct/controllers/associatedproduct'
    ],
    function (angular, $, cosacs, merchandising, associatedProductCtrl) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();

                angular.module('merchandising')
                    .controller('associatedProductCtrl', ['$scope', 'productResourceProvider','pageHelper', associatedProductCtrl]);

                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });