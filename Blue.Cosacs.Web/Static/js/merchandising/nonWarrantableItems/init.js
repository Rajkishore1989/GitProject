/* jshint ignore:start */
define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/nonWarrantableItems/controllers/nonWarrantableItems',
        'merchandising/nonWarrantableItems/services/NonWarrantableItemsResourceProvider'
],
    function (angular, $, cosacs, merchandising, nonWarrantableItemsCtrl, NonWarrantableItemsRepo) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();

                angular.module('merchandising')
                    .service('NonWarrantableItemsResourceProvider', ['apiResourceHelper', NonWarrantableItemsRepo])
                    .controller('nonWarrantableItemsCtrl', ['$scope', '$timeout', 'pageHelper', 'NonWarrantableItemsResourceProvider', nonWarrantableItemsCtrl]);

                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });
/* jshint ignore:end */