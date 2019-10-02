define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/tagValues/controllers/tagValues',
        'merchandising/tagValues/controllers/tag'
    ],
    function (angular, $, cosacs, merchandising, tagValuesCtrl, tagCtrl) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();

                angular.module('merchandising')
                    .controller('TagValuesCtrl', ['$scope', 'user', tagValuesCtrl])
                    .controller('TagCtrl', ['$scope', '$http', tagCtrl]);

                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });