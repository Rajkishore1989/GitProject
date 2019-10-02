/*global define*/
define([
    'underscore',
    'angular',
    'lookup',
    'angularShared/services/lookup',
    'angularShared/services/user',
    'merchandising/hierarchy/services/productHierarchyService'],
    function (_, angular, lookup, lookupFun, userService, productHierarchySrv) {
        'use strict';

        return angular.module('cosacs.services', [])
            .factory('user', userService)
            .factory('productHierarchySrv', productHierarchySrv)
            .service("lookup", lookupFun);
    });