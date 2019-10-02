define([
     'angular',
     'url'
],
function (angular,url) {
    'use strict';

   
    return function (user, $rootScope) {
        return {
            restrict: 'E',
            scope: {
                stockLevels: '='
            },
            templateUrl: url.resolve('/Static/js/merchandising/product/templates/stockLevels.html'),
            link: function (scope, element, attrs) {
                scope.resolve = url.resolve;
            }
        };
    };
});