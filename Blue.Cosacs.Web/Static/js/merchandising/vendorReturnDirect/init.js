define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/vendorReturnDirect/services/vendorReturnDirectResourceProvider',
        'merchandising/vendorReturnDirect/controllers/vendorReturnDirect'
    ],
    function (angular, $, cosacs, merchandising, repo, ctrl) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();

                angular.module('merchandising')
                    .service('vendorReturnDirectResourceProvider', ['$q', '$resource', 'apiResourceHelper', repo])
                    .controller('VendorReturnDirectCtrl', ['$scope', '$filter', '$location', 'pageHelper', 'vendorReturnDirectResourceProvider', 'user', ctrl]);

                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });
