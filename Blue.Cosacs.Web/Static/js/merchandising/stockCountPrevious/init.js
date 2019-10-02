define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/stockCountPrevious/services/stockCountPreviousResourceProvider',
        'merchandising/stockCountPrevious/controllers/previousCount'
],
    function (angular, $, cosacs, merchandising, previousCountRepo, previousCountCtrl) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();

                angular.module('merchandising')
                    .service('stockCountPreviousResourceProvider', ['$q', '$resource', 'apiResourceHelper', previousCountRepo])
                    .controller('PreviousCountCtrl', ['$scope', 'stockCountPreviousResourceProvider', previousCountCtrl]);
                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });