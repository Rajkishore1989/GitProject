define([
        'angular',
        'underscore',
        'url',
        'notification'
    ],
    function(angular, _, url, notification) {
        'use strict';

        return function($scope, $http, $q, $location, pageHelper, user, repossessedConditionProvider, $dialog) {
            $scope.canEdit = user.hasPermission("RepossessedConditionsEdit");

            $scope.editing = false;
            $scope.originalCondition = {};

            $scope.isEditing = function (condition) {
                return condition === $scope.editing;
            };

            $scope.editCondition = function (condition) {
                $scope.originalCondition = angular.copy(condition);
                $scope.editing = condition;
            };

            $scope.validateName = function(name, form) {
                var duplicate = _.reject($scope.repossessedConditions, function(c) {
                    return c.name.toLowerCase() !== name.toLowerCase();
                }).length > 1;
                form.name.$setValidity('duplicate', !duplicate);
            };

            $scope.validateSkuSuffix = function (skuSuffix, form) {
                var duplicate = _.reject($scope.repossessedConditions, function (c) {
                    return c.skuSuffix.toLowerCase() !== skuSuffix.toLowerCase();
                }).length > 1;
                form.skuSuffix.$setValidity('duplicate', !duplicate);
            };

            $scope.acceptEdit = function (condition, form) {

                if (form.$invalid) {
                    return;
                }

                var promise;

                if (condition.id) {
                    promise = repossessedConditionProvider.update(condition.id, condition.name, condition.skuSuffix);
                } else {
                    promise = repossessedConditionProvider.create(condition.name, condition.skuSuffix);
                }

                promise.then(function(c) {
                    condition.id = c.id;

                    notification.show('Repossessed condition saved successfully.');

                    $scope.editing = false;
                    $scope.originalCondition = {};
                }, function(result) {
                    notification.show(result.message || 'An error occurred while saving.');
                });
            };

            $scope.cancelEdit = function () {
                if (!$scope.originalCondition.name) {
                    $scope.repossessedConditions = _.reject($scope.repossessedConditions, function (c) { return c === $scope.editing; });
                } else {
                    var c = _.indexOf($scope.repossessedConditions, $scope.editing);
                    $scope.repossessedConditions[c] = $scope.originalCondition;
                }
                $scope.originalCondition = {};
                $scope.editing = false;
            };

            $scope.addCondition = function() {
                var newCondition = {
                    name: '',
                    skuSuffix: ''
                };

                $scope.repossessedConditions.push(newCondition);
                $scope.editing = newCondition;
            };

            $scope.removeCondition = function (condition) {
                var deleteConfirmation = $dialog.messageBox('Confirm delete repossessed condition',
						'Are you sure you wish to delete the repossessed condition "' + condition.name + '"?', [{
						    label: 'Delete',
						    result: 'yes',
						    cssClass: 'btn-primary'
						}, {
						    label: 'Cancel',
						    result: 'no'
						}]);

                deleteConfirmation.open().then(function (msgResult) {
                    if (msgResult === 'yes') {
                        repossessedConditionProvider.remove(condition.id).then(function () {
                            notification.show('Repossessed condition successfully deleted.');
                            $scope.repossessedConditions = _.reject($scope.repossessedConditions, function (c) { return c === condition; });
                        }, function (result) {
                            notification.showPersistent(result.message || 'An error occured deleting.');
                        });
                    }
                });
            };
        };
    });