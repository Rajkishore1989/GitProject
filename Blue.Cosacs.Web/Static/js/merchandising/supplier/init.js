define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/shared/services/vendorResourceProvider',
        'merchandising/supplier/controllers/supplier'
    ],
    function (angular, $, cosacs, merchandising, repo,supplierCtrl) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();

                angular.module('merchandising')
                    .service('vendorResourceProvider', ['$q', '$resource', 'apiResourceHelper', repo])
                    .controller('SupplierCtrl', ['$scope', '$location', 'pageHelper', 'user', 'vendorResourceProvider', supplierCtrl]);

                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });
