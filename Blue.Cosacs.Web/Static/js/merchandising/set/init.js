define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/set/controllers/set',
        'merchandising/set/controllers/component',
        'merchandising/set/controllers/location',
        'merchandising/set/controllers/price',
        'merchandising/set/services/setResourceProvider',
        'merchandising/shared/directives/pricePanel'
],
    function (angular, $, cosacs, merchandising, setCtrl, componentCtrl, locationCtrl, priceCtrl, repo, pricePanel) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();

                angular.module('merchandising')
                    .service('setResourceProvider', ['$q', '$resource', 'apiResourceHelper', repo])
                    .directive('pricePanel', ['pageHelper', pricePanel])
                    .controller('SetCtrl', ['$scope', '$location', '$timeout', 'pageHelper', 'helpers', 'setResourceProvider', 'productResourceProvider', 'taggingResourceProvider', 'user', setCtrl])
                    .controller('ComponentCtrl', ['$scope', componentCtrl])
                    .controller('LocationCtrl', ['$scope', 'pageHelper', locationCtrl])
                    .controller('PriceCtrl', ['$scope', priceCtrl]);

                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });