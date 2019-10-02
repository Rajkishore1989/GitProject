define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/cintError/controllers/cintError'
    ],
    function (angular, $, cosacs, merchandising, ctrl) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();

                angular.module('merchandising')
                    .service(['$q', '$resource', 'apiResourceHelper', 'pageHelper'])
                    .controller('CintErrorCtrl', ['$scope', '$timeout', 'pageHelper','$http', ctrl]);
                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });