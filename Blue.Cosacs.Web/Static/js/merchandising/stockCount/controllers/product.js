define([
    'angular',
    'underscore'],

function (angular, _) {
    'use strict';

    return function ($scope) {
        var master;

        function copy() {
            master = angular.copy($scope.product);
        }

        function canUndo() {
            return !_.isEqual($scope.product, master);
        }

        function undo() {
            if (!canUndo()) {
                return;
            }

            $scope.product = angular.copy(master);
        }

        $scope.$on('saved', function() {
            copy();
        });

        $scope.canUndo = canUndo;
        $scope.undo = undo;
        copy();
    };
});