/*global define*/
define(['jquery', 'underscore', 'url', 'angular', 'angular.ui', 'angular.bootstrap'], function ($, _, url) {
    'use strict';

    var controller = function ($scope, $http, $rootScope) {

        $scope.username = '';
        $scope.password = '';

        $scope.disableAuthorise = function () {
            return _.isEmpty($scope.username) || _.isEmpty($scope.password);
        };

        $scope.authorise = function () {

            $scope.failureMessage = '';
            $http({
                method: 'POST',
                url: url.resolve('Authorisation'),
                data: {
                    username: $scope.username,
                    password: $scope.password,
                    requiredPermission: $scope.requiredPermission,
                    permissionArea: $scope.permissionArea
                }
            }).success(function (data) {
                $scope.password = '';
                if (data.HasPermission === true) {
                    $('#authorise').modal('hide');
                    $scope.username = '';
                    $rootScope.$broadcast('authorisationSuccess', {
                        success: $scope.success,
                        failure: $scope.failure,
                        authorisedBy: data.User
                    });
                } else {
                    $rootScope.$broadcast('authorisationFailure', {
                        success: $scope.success,
                        failure: $scope.failure
                    });
                    $scope.failureMessage = 'Authorisation failed. Either your username/password is incorrect or you do not have permission to authorise this change.';
                }
            }).error(function () {
                $scope.username = '';
                $scope.password = '';
                $rootScope.$broadcast('authorisationError');
                $scope.failureMessage = 'There was an error while trying to authorise. Please try again.';
            });
        };

        $scope.cancel = function () {
            $('#authorise').modal('hide');

            $rootScope.$broadcast('authorisationFailure', {
                success: $scope.success,
                failure: $scope.failure,
                cancel: true
            });
        };

        var showPopup = function (text, title, requiredPermission, permissionArea, success, failure) {

            $scope.success = success;
            $scope.failure = failure;
            $scope.text = text;
            $scope.title = title;
            $scope.requiredPermission = requiredPermission;
            $scope.permissionArea = permissionArea;
            $scope.failureMessage = '';

            $('#authorise').modal();
            $('#username').focus();
        };

        $scope.$on('requestAuthorisation', function (event, data) {
            showPopup(data.text, data.title, data.requiredPermission, data.permissionArea, data.success, data.failure);
        });
    };

    controller.$inject = ['$scope', '$http', '$rootScope'];
    return controller;
});