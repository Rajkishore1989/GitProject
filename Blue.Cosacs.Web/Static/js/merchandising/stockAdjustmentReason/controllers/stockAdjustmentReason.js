define([
    'angular',
    'underscore',
    'url'],

function (angular, _, url) {
    'use strict';

    return function ($scope, location, pageHelper, user, primaryReasonRepo, secondaryReasonRepo, $rootScope) {
        $scope.editing = false;
        $scope.saving = false;
        $scope.hasEditPermission = user.hasPermission("StockAdjustmentReasonsEdit");

        $scope.$on('editingStarted', function() {
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

        function canEdit() {
            return !$scope.editing && !$scope.saving && $scope.hasEditPermission;
        }

        function canAddPrimaryReason(form) {
            return canEdit() && form.$valid;
        }

        function addPrimaryReason(primaryReason) {
            $rootScope.$broadcast("savingStarted");

            var model = {
                primaryReason: primaryReason
            };

            primaryReasonRepo
                .create(model)
                .then(function (reason) {
                    $rootScope.$broadcast("savingFinished");
                    $scope.vm.push(reason);
                    pageHelper.notification.show("Primary reason created successfully.");
                $scope.primaryReason = '';
            }, function(err) {
                    $rootScope.$broadcast("savingFinished");
                    if (err && err.message) {
                        pageHelper.notification.showPersistent(err.message);
                    }
                });
        }

        function saveDefaultForCountAdjustment() {
            $rootScope.$broadcast("savingStarted");

            secondaryReasonRepo
                .setDefault($scope.defaultForCountAdjustment)
                .then(function() {
                    $rootScope.$broadcast("savingFinished");

                    var secondaryReasons = _.chain($scope.vm)
                        .map(function(primaryReason) {
                            return primaryReason.secondaryReasons;
                        })
                        .flatten().value();

                    _.each(secondaryReasons, function(reason) { reason.defaultForCountAdjustment = false; });
                    _.findWhere(secondaryReasons, { id: $scope.defaultForCountAdjustment }).defaultForCountAdjustment = true;

                    pageHelper.notification.show("Default reason for count adjustment saved.");
                }, function(err) {
                    $rootScope.$broadcast("savingFinished");
                    if (err && err.message) {
                        pageHelper.notification.showPersistent(err.message);
                    }
                });
        }

        function removePrimaryReason(id) {
            $rootScope.$broadcast("savingStarted");

            primaryReasonRepo
                .remove(id)
                .then(function () {
                    $scope.vm = _.reject($scope.vm, function (r) {
                        return r.id === id;
                    });
                pageHelper.notification.show("Primary reason deleted successfully.");
                    $rootScope.$broadcast("savingFinished");
                }, function (err) {
                    $rootScope.$broadcast("savingFinished");
                    if (err && err.message) {
                        pageHelper.notification.showPersistent(err.message);
                    }
                });
        }

        function getSecondaryReasons() {
            return _.chain($scope.vm)
                .where(function(primaryReason) {
                    return primaryReason.secondaryReasons.length;
                })
                .map(function(primaryReason) {
                    return _.map(primaryReason.secondaryReasons, function(secondaryReason) {
                        return {
                            id: secondaryReason.id,
                            name: secondaryReason.secondaryReason,
                            primary: primaryReason.primaryReason,
                            isDefault: !!secondaryReason.defaultForCountAdjustment
                        };
                    });
                })
                .flatten()
                .value();
        }

        function populateDefaultReasonDropdown() {
            $scope.secondaryReasonOptions = getSecondaryReasons();
            if ($scope.secondaryReasonOptions.length) {
                $scope.defaultForCountAdjustment = _.findWhere($scope.secondaryReasonOptions, { isDefault: true }).id;
            }
        }

        $scope.$watch('vm', function () {
            populateDefaultReasonDropdown();
        });

        $scope.canEdit = canEdit;
        $scope.canAddPrimaryReason = canAddPrimaryReason;
        $scope.addPrimaryReason = addPrimaryReason;
        $scope.saveDefaultForCountAdjustment = saveDefaultForCountAdjustment;
        $scope.removePrimaryReason = removePrimaryReason;
        $scope.populateDefaultReasonDropdown = populateDefaultReasonDropdown;
    };
});
