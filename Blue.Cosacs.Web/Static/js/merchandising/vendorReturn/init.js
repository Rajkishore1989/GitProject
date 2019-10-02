define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/vendorReturn/services/vendorReturnResourceProvider',
        'merchandising/vendorReturn/controllers/vendorReturn',
        'merchandising/vendorReturn/controllers/vendorReturnSearch'
    ],
    function (angular, $, cosacs, merchandising, repo, ctrl, searchCtrl) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();

                angular.module('merchandising')
                    .service('vendorReturnResourceProvider', ['$q', '$resource', 'apiResourceHelper', repo])
                    .controller('VendorReturnCtrl', ['$scope', '$filter', '$location', 'pageHelper', 'vendorReturnResourceProvider', 'user', ctrl])
                    .controller('VendorReturnSearchCtrl', ['$scope', '$timeout', '$filter', '$location', 'pageHelper', 'vendorReturnResourceProvider', 'locationResourceProvider', 'vendorResourceProvider', 'user', 'helpers', searchCtrl]);

                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });
