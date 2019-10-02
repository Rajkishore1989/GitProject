define([
         'jquery',
        'angular',
        'underscore',
        'url',
        'notification',
        'moment',
        'datepicker'
        
],
function ($,angular,_ ,url) {
    'use strict';

    return function (user) {
        return {
            restrict: 'E',
            scope: {
                product: '='
            },
            templateUrl: url.resolve('/Static/js/merchandising/product/templates/incoterm.html'),
            link: function (scope) {
                scope.canView = user.hasPermission("IncotermView");
            }
        };
    };
});