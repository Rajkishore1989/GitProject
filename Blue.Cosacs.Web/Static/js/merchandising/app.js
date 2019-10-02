define([
        'angular',
        'merchandising/config',
        'merchandising/shared/services',
        'merchandising/shared/filters',
        'merchandising/shared/directives'
    ],
    function(angular) {
        'use strict';

        return angular.module('merchandising', [
                'merchandising.config',
                'merchandising.services',
                'merchandising.filters',
                'merchandising.directives'
            ]);
    });