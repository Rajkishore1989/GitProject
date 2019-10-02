define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/stockMovement/controllers/stockMovement'
],
    function (angular, $, cosacs, merchandising, stockMovementCtrl) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();

                angular.module('merchandising')
                    .controller('StockMovementCtrl', ['$scope', '$location', 'pageHelper', 'user', stockMovementCtrl]);
                
                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });