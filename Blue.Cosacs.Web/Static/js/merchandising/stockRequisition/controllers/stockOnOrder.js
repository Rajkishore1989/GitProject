define([
    'angular',
    'underscore',
    'url'],

function (angular, _, url) {
    'use strict';

    return function ($scope, pageHelper) {
        $scope.editing = true;
        $scope.saving = false;
        
        $scope.$watch('vm', function (vm) {
            $scope.stockOnOrder = vm || {};
            pageHelper.setTitle('Stock On Order For SKU ' + vm.sku);
        });
        
        $scope.resolve = url.resolve;
    };
});
