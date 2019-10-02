define([
    'angular',
    'underscore',
    'url',
    'notification'],
       
    function (angular, _, url, notification) {
        'use strict';

        return function ($scope, $http) {

            $scope.edit = function () {
                $scope.original = angular.copy($scope.tag);

                $scope.isEditing = true;
            };

            $scope.cancel = function () {
                $scope.tag = $scope.original;
                $scope.isEditing = false;
            };

            $scope.save = function (form) {
                if ($scope.$parent.checkAllConditions($scope.tag) && form.$valid) {
                    $http.post(url.resolve('/merchandising/tagvalues/save/'), $scope.tag)
                        .success(function() {
                            $scope.isEditing = false;
                            notification.show('Tag values saved successfully.');
                        })
                        .error(function() {
                            notification.showPersistent('There was an error saving.');
                        });
                } 
            };
        };
    });