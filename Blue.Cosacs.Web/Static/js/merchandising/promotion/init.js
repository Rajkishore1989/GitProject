define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/promotion/services/promotionResourceProvider',
        'merchandising/promotion/controllers/promotion',
        'merchandising/shared/services/taxHelper'
    ],
    function (angular, $, cosacs, merchandising, repo, promotionCtrl, taxHelper) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();

                angular.module('merchandising')
                    .service('promotionResourceProvider', ['$q', '$resource', 'apiResourceHelper', repo])
                    .controller('promotionCtrl', ['$scope', '$location', 'pageHelper', 'taxHelper', 'user','promotionResourceProvider','$timeout','productResourceProvider', promotionCtrl]);

                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });
