define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/stockCountStart/controllers/stockCountStart',
        'merchandising/stockCountStart/services/stockCountStartResourceProvider'
],
    function (angular, $, cosacs, merchandising, stockCountCtrl, stockCountRepo) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();

                angular.module('merchandising')
                    .service('stockCountStartResourceProvider', ['$q', '$resource', 'apiResourceHelper', stockCountRepo])
                    .controller('StockCountStartCtrl', ['$scope', 'pageHelper', 'stockCountStartResourceProvider', '$http', stockCountCtrl]);
                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });