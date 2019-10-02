define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/location/controllers/location'
    ],
    function (angular, $, cosacs, merchandising, locationCtrl) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();

                angular.module('merchandising')
                    .controller('LocationCtrl', ['$scope', '$http', '$location', 'pageHelper','user', locationCtrl]);

                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });