define([
        'angular',
        'jquery',
        'angularShared/app',
        'merchandising/app',
        'merchandising/repossessedConditions/controllers/repossessedConditions',
        'merchandising/repossessedConditions/services/repossessedConditionResourceProvider'
    ],
    function (angular, $, cosacs, merchandising, repossessedConditionsCtrl, repossessedConditionResourceProvider) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();

                angular.module('merchandising')
                    .service('repossessedConditionResourceProvider', ['$q', '$resource', 'apiResourceHelper', repossessedConditionResourceProvider])
                    .controller('RepossessedConditionsCtrl', ['$scope', '$http', '$q', '$location', 'pageHelper', 'user', 'repossessedConditionResourceProvider', '$dialog', repossessedConditionsCtrl]);
                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });