define([
    'angular',
    'underscore',
    'url'],

function (angular, _, url) {
    'use strict';

    return function ($scope, pageHelper, secondaryReasonRepo, $rootScope) {
        var backup;

        $scope.editMode = !$scope.secondaryReason.id;

        $scope.$on('editingStarted', function () {
            $scope.editing = true;
        });

        $scope.$on('editingFinished', function () {
            $scope.editing = false;
        });

        $scope.$on('savingStarted', function () {
            $scope.saving = true;
        });

        $scope.$on('savingFinished', function () {
            $scope.saving = false;
        });

        function canEditSecondaryReason() {
            return $scope.canEdit() && !$scope.editMode;
        }

        function canAccept(form) {
            return !$scope.saving && $scope.hasEditPermission && $scope.editMode && form.$valid;
        }

        function canCancel() {
            return $scope.editMode;
        }

        function canRemove() {
            return $scope.canEdit() && !$scope.editMode && !$scope.secondaryReason.defaultForCountAdjustment;
        }

        function finishEdit() {
            $scope.editMode = false;
            backup = null;
            $rootScope.$broadcast("editingFinished");
        }

        function accept(form) {
            if (!canAccept(form)) {
                return;
            }

            $rootScope.$broadcast("savingStarted");

            secondaryReasonRepo
                .save($scope.secondaryReason)
                .then(function (reason) {
                    $rootScope.$broadcast("savingFinished");
                    finishEdit();
                    angular.extend($scope.secondaryReason, reason);
                    $scope.populateDefaultReasonDropdown();
                    pageHelper.notification.show("Secondary reason saved successfully.");
                   
                }, function (err) {
                    $rootScope.$broadcast("savingFinished");
                    if (err && err.message) {
                        pageHelper.notification.showPersistent(err.message);
                    }
                });
        }

        function cancel() {
            if (!canCancel()) {
                return;
            }

            $scope.secondaryReason = backup;

            if (!backup) {
                $scope.reason.secondaryReasons.pop();
            } else {
                $scope.secondaryReason = backup;
            }

            finishEdit();
        }

        function removeSecondaryReason(id) {
            if (!canRemove()) {
                return;
            }

            $rootScope.$broadcast("savingStarted");

            secondaryReasonRepo
                .remove(id)
                .then(function() {
                    $rootScope.$broadcast("savingFinished");
                    $scope.reason.secondaryReasons = _.reject($scope.reason.secondaryReasons, function (r) {
                        return r.id === id;
                    });
                    $scope.populateDefaultReasonDropdown();
                    pageHelper.notification.show("Secondary reason deleted successfully.");
                }, function(err) {
                    $rootScope.$broadcast("savingFinished");
                    if (err && err.message) {
                        pageHelper.notification.showPersistent(err.message);
                    }
                });
        }

        $scope.canEditSecondaryReason = canEditSecondaryReason;
        $scope.canAccept = canAccept;
        $scope.canCancel = canCancel;
        $scope.canRemove = canRemove;
        $scope.accept = accept;
        $scope.cancel = cancel;
        $scope.removeSecondaryReason = removeSecondaryReason;
    };
});
