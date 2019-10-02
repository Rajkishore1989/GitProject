define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/goodscosting/services/goodsCostingResourceProvider',
        'merchandising/goodscosting/controllers/goodsCosting'
    ],
    function (angular, $, cosacs, merchandising, repo, ctrl) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();

                angular.module('merchandising')
                    .service('goodsCostingResourceProvider', ['$q', '$resource', 'apiResourceHelper', repo])
                    .controller('GoodsCostCtrl', ['$scope', '$filter', 'pageHelper', 'goodsCostingResourceProvider', ctrl]);

                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });
