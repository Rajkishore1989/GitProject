define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/ticketing/controllers/ticketing'
],
    function (angular, $, cosacs, merchandising, ticketingCtrl) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();

                angular.module('merchandising')
                    .controller('ticketingCtrl', ['$scope', ticketingCtrl]);

                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });
