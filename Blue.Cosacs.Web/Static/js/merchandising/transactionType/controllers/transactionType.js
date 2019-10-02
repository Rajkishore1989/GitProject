define([
    'angular',
    'underscore',
    'url'],

function (angular, _, url) {
    'use strict';

    return function ($scope, transactionTypeRepo, pageHelper, user) {
        $scope.canEdit = user.hasPermission("TransactionTypeEdit");

        function canAccept(form) {
            return !$scope.saving &&
                form &&
                form.$valid;
        }

        function accept(form) {
            if (!canAccept(form)) {
                return;
            }

            $scope.saving = true;

            transactionTypeRepo
                .save($scope.transactionTypes)
                .then(function () {
                    $scope.saving = false;
                    pageHelper.notification.show("Transaction type saved successfully.");
                }, function (err) {
                    $scope.saving = false;
                    if (err && err.message) {
                        pageHelper.notification.showPersistent(err.message);
                    }
                });
        }

        $scope.canAccept = canAccept;
        $scope.accept = accept;
    };
});