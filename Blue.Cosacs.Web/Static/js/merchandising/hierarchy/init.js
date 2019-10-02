define([
        'angular',
        'jquery',
        'underscore',
        'url',
        'angularShared/app',
        'merchandising/app',
        'merchandising/hierarchy/controllers/tagsController',
        'merchandising/hierarchy/directives/hierarchy',
        'facetsearch/service',
        'underscore.string',
        'angular.ui',
        'angular.bootstrap'
    ],
    function (angular, $, _, url, cosacs, merchandising, TagsController, hierarchyDirective, facetService) {
        'use strict';

        return {
            init: function ($el) {
                cosacs().service('facetService', facetService)
                    .controller('TagsController', TagsController)
                    .directive('hierarchy', ['$timeout', '$dialog', 'user', 'facetService', hierarchyDirective]);

                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });