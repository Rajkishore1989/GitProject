define([
    'angular',
    'underscore',
    'url'],

function (angular, _, url) {
    'use strict';

    return function ($scope,pageHelper, primaryReasonRepo, $rootScope) {

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

        function hasDefaultSecondaryReason(reason) {
            return _.some(reason.secondaryReasons, function(r) {
                return r.defaultForCountAdjustment;
            });
        }

        function canRemove(reason) {
            return $scope.canEdit() && !hasDefaultSecondaryReason(reason);
        }

        function canAddSecondaryReason() {
            return $scope.canEdit();
        }

        function addSecondaryReason(reason) {
            if (!canAddSecondaryReason()) {
                return;
            }

            $rootScope.$broadcast("editingStarted");
            reason.secondaryReasons.push({ primaryReasonId: reason.id });
        }

        $scope.canAddSecondaryReason = canAddSecondaryReason;
        $scope.canRemove = canRemove;
        $scope.addSecondaryReason = addSecondaryReason;
    };
});
