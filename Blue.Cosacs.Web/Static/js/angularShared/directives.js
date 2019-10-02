/*global define*/
// To contain all common shared directives
define(['angular', 'directives/list','directives/printDirective'],
    function (angular, listDirective,printDirective) {
        'use strict';
        var searchRow = function () {
            return {
                restrict: 'EC',
                replace:true,
                template: '<div class="search row">&nbsp;</div>'
            };
        };

        return angular.module('cosacs.directives', [])
            .directive('searchrow', searchRow)
            .directive('list', listDirective)
            .directive('ngPrint', printDirective);

    });