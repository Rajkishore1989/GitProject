define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/shared/services/productResourceProvider',
        'merchandising/productStatus/controllers/productStatus'
    ],
    function (angular, $, cosacs, merchandising, repo, productStatusCtrl) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();

                angular.module('merchandising')
                    .service('productResourceProvider', ['$q', '$resource', 'apiResourceHelper', repo])
                    .controller('productStatusCtrl', ['$scope', '$location', 'pageHelper', 'user', 'productResourceProvider', productStatusCtrl]);

                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });
