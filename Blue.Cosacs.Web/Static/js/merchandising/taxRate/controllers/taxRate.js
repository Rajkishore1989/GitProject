define([
    'angular',
    'url'
],
    function (angular) {
        'use strict';

        return function ($scope) {
            
            $scope.taxRates = [];

            $scope.$watch('vm', function (vm) {
                $scope.taxRates = vm || [];           
            });
        };
    });
