define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/combo/controllers/combo',
        'merchandising/combo/services/comboResourceProvider',
        'merchandising/combo/controllers/component',
        'merchandising/combo/controllers/location',
        'merchandising/combo/controllers/price',
        'merchandising/shared/directives/pricePanel'
    ],
    function (angular, $, cosacs, merchandising, comboCtrl, repo, componentCtrl, locationCtrl, priceCtrl, pricePanel) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();

                angular.module('merchandising')
                    .service('comboResourceProvider', ['$q', '$resource', 'apiResourceHelper', repo])
                    .directive('pricePanel', ['pageHelper', pricePanel])
                    .controller('ComboCtrl', ['$scope', '$location', '$timeout', 'pageHelper','user', 'helpers', 'comboResourceProvider', 'productResourceProvider', 'taggingResourceProvider', comboCtrl])
                    .controller('ComponentCtrl', ['$scope', componentCtrl])
                    .controller('LocationCtrl', ['$scope', locationCtrl])
                    .controller('PriceCtrl', ['$scope', priceCtrl]);
                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });