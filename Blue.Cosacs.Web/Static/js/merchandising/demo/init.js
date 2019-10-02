define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/demo/controllers/reflink'
    ],
    function (angular, $, cosacs, merchandising, refLinkCtrl) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();

                angular.module('merchandising')
                    .controller('RefLinkCtrl', ['$scope', refLinkCtrl]);

                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });
