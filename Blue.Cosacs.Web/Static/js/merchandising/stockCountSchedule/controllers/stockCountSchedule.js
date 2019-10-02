define([
    'angular',
    'underscore',
    'url'],

function (angular, _, url) {
    'use strict';
    var settingsSources = ['Blue.Cosacs.Merchandising.Fascia'];

    return function ($scope, location, pageHelper, dateHelper, stockCountScheduleRepo, locationRepo, $timeout) {
        $scope.saving = false;
        $scope.paginator = {};
        $scope.dateFormat = pageHelper.dateFormat;
        $scope.dirty = false;

        locationRepo.getList().then(function (locations) {
            $scope.locations = locations;
        });

        function newStockCount() {
            return {
                type: "Perpetual",
                hierarchy: {}
            };
        }

        function generateUrl(link) {
            return url.resolve(link);
        }

        pageHelper.getSettings(settingsSources, function (options) {
            $scope.options = options;
            $scope.$apply();
        });

        function isValid(form) {
            return form.$valid && ($scope.stockCount.locationId || $scope.stockCount.fascia);
        }
        function showPreview(form) {
            return isValid(form) && !$scope.dirty;
        }

        function canSave(form) {
            return !$scope.saving && isValid(form);
        }

        function canPreview(form) {
            return !$scope.saving && isValid(form) && !$scope.stockCount.fascia;
        }

        function showHierarchy() {
            return $scope.stockCount.type === 'Perpetual';
        }

        function resetGrid() {
            $scope.dirty = true;
        }

        function save(form) {
            if (!canSave(form)) {
                return;
            }

            $scope.saving = true;
            //$scope.stockCount.countDate = dateHelper.toUtcDateTime($scope.stockCount.countDate);

            stockCountScheduleRepo.create($scope.stockCount)
                .then(function() {
                    $scope.saving = false;
                    reset();
                    // show persistent here because the form gets wiped
                    pageHelper.notification.show("Stock count scheduled.");
                }, function(err) {
                    $scope.saving = false;
                    if (err && err.message) {
                        pageHelper.notification.showPersistent(err.message);
                    }
                });
        }

        $scope.$watch('stockCount.locationId', function (locationId) {
            if ($scope.stockCount.locationId && $scope.stockCount.countDate && !$scope.saving) {
                exists();
            }
            resetGrid();
        });

        $scope.$watch('stockCount.countDate', function (countDate) {
            if ($scope.stockCount.locationId && $scope.stockCount.countDate && !$scope.saving) {
                exists();
            }
            resetGrid();
        });

        $scope.$watch('stockCount.fascia', function (fascia) {
            if (fascia) {
                $('#preview-tooltip').tooltip('enable');
            } else {
                $('#preview-tooltip').tooltip('disable');
            }
            resetGrid();
        });

        $scope.$watch('stockCount', function() {
            resetGrid();
        });

        function exists() {
            stockCountScheduleRepo.exists($scope.stockCount.locationId, $scope.stockCount.countDate)
                .then(function (results) {
                }, function (err) {
                    if (err && err.message) {
                        pageHelper.notification.show(err.message);
                    }
                });
        }

        function preview() {
            $scope.dirty = false;
            $scope.paginator.get();
        }

        function reset() {
            $scope.stockCount = newStockCount();
        }
        
        $timeout(function () {
            $('#countDate').datepicker('option', 'minDate', new Date());
            $('[data-toggle="tooltip"]').tooltip();
        }, 0);

        reset();
        $scope.canSave = canSave;
        $scope.canPreview = canPreview;
        $scope.showHierarchy = showHierarchy;
        $scope.save = save;
        $scope.generateUrl = generateUrl;
        $scope.resolve = url.resolve;
        $scope.isValid = isValid;
        $scope.newStockCount = newStockCount;
        $scope.preview = preview;
        $scope.getPreview = stockCountScheduleRepo.preview;
        $scope.showPreview = showPreview;
    };
});
