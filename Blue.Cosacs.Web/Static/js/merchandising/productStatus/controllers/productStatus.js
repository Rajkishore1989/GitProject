define([
    'angular',
    'underscore',
    'url'
],
    function (angular, _) {
        'use strict';

        var settingsSources = [
            'Blue.Config.ContactType'
        ];

        return function ($scope, $location, pageHelper, user, productResourceProvider) {
            pageHelper.getSettings(settingsSources, function (options) {
                $scope.options = options;
                $scope.$apply();
            });
            $scope.systemStatuses = [];
            $scope.manualStatuses = [];
            $scope.newStatusName = '';
            $scope.newStatusAvailable = false;
            $scope.newStatusAuto = false;
            $scope.editing = false;

            $scope.readonly = !user.hasPermission('ProductsWithoutStockEdit');

            $scope.save = function (status) {
                productResourceProvider
                    .saveStatus(status)
                    .then(function(response) {
                    }, function(response) {
                        pageHelper.notification.showPersistent(response.message);
                });
            };

            $scope.$watch('vm', function (vm) {
                $scope.systemStatuses = vm.systemStatuses || [];
                $scope.manualStatuses = vm.manualStatuses || [];
            });

            $scope.saveNew = function () {
                var exists = _.findWhere($scope.manualStatuses, { name: $scope.newStatusName }) ||
                    _.findWhere($scope.systemStatuses, { name: $scope.newStatusName });
               
                if (!exists) {
                    var newStatus = { id: 0, name: $scope.newStatusName, isAutomatic: $scope.newStatusAuto };
                    productResourceProvider
                        .saveStatus(newStatus)
                        .then(function(response) {
                            newStatus.id = response.supplier.id;
                            $scope.editing = false;
                            $scope.manualStatuses.push(newStatus);
                            $scope.newStatusName = '';
                            
                            pageHelper.notification.show('Status saved successfully');
                        }, function(response) {
                            pageHelper.notification.show(response.message);
                        });
                } else {
                    pageHelper.notification.showPersistent('Status already exists');
                }
            };

            $scope.add = function (status) {
                $scope.editing = true;

            };

            $scope.cancel = function (status) {
                $scope.editing = false;
                
                var newStatus = { id: 0, name: $scope.newStatusName, isAutomatic: $scope.newStatusAuto };
            };

            $scope.remove = function (status) {
                productResourceProvider
                    .removeStatus(status)
                    .then(function (response) {
                        $scope.manualStatuses = _.filter($scope.manualStatuses, function (item) {
                            return item.id !== status.id;
                        });
                    }, function (response) {
                        pageHelper.notification.showPersistent(response.message);
                    });
            };
        };
    });
