define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/transactionType/controllers/transactionType',
        'merchandising/transactionType/services/transactionTypeResourceProvider'
],
    function (angular, $, cosacs, merchandising, transactionTypeCtrl, transactionTypeRepo) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();

                angular.module('merchandising')
                    .service('transactionTypeResourceProvider', ['$q', '$resource', 'apiResourceHelper', transactionTypeRepo])
                    .controller('TransactionTypeCtrl', ['$scope', 'transactionTypeResourceProvider', 'pageHelper', 'user', transactionTypeCtrl]);

                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });