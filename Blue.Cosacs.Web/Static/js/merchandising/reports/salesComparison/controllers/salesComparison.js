define(['angular','underscore','url', 'notification'],
    function (angular, _, url, notification) {
        'use strict';

        var settingsSources = [
            'Blue.Cosacs.Merchandising.ProductTags',
            'Blue.Cosacs.Merchandising.Fascia'
        ];

        return function($scope, $timeout, pageHelper, locationResourceProvider, salesComparisonProvider, brandProvider, periodProvider, reportHelper) {
            $scope.dateFormat = pageHelper.dateFormat;
            $scope.vm = {
                searching: false,
                columns: [],
                gridTemplate: url.resolve('/static/js/merchandising/reports/salesComparison/templates/salesComparisonGrid.html')
            };

            function reset() {
                $scope.vm.query = {};
                $scope.vm.results = [];
                $scope.vm.groupByLocation = 0;
                $scope.vm.resultCount = undefined;
            }

            function initializePageData() {
                pageHelper.setTitle('Sales Comparison Report');

                locationResourceProvider.getList().then(function(locations) {
                    $scope.vm.locations = locations;
                });

                pageHelper.getSettings(settingsSources, function(options) {
                    $scope.vm.options = options;
                    $scope.$apply();
                });

                brandProvider.get().then(function (brands) {
                    $scope.vm.brands = brands;
                });

                periodProvider.getCurrentAndPrevious().then(function (periods) {
                    $scope.vm.periods = periods;
                });

                _.each(['Division', 'Department', 'Class', 'SKU', 'Description', 'Brand', 'Product Tags', 'Stock On Hand', 'Stock On Order', 'Stock Requested', 'Cash Price', 'Regular Price', 'Promo Cash Price', 'Promo Regular Price', 'Location'], function (col) {
                    $scope.vm.columns.push({ name: col, selected: true });
                });

                reset();
            }

            function regroup() {
                if ($scope.vm.data) {
                    $scope.vm.results = _.map(_.groupBy($scope.vm.data, 'locationName'), function (group) {
                        return { name: group[0].locationName, data: group };
                    });

                    $scope.vm.columns = _.filter($scope.vm.columns, function (o) { return o.name !== 'Location'; });
                }
            }

            function countResults(data) {
                var count = _.reduce(data, function (memo, num) {
                    if (num.children && num.children.length) {
                        memo = memo + countResults(num.children);
                    }
                    return memo + num.items.length;
                }, 0);
                return count;
            }

            function search() {

                if (!$scope.vm.isValid()) {
                    notification.show('You have to select either Location or Fascia and one value on the hierarchy.');
                    return;
                }

                $scope.vm.searching = true;
                $scope.vm.results = [];

                salesComparisonProvider.search($scope.vm.query).then(function (data) {
                    // Warn if large results set returned
                    $scope.vm.resultCount = countResults(data);

                    regroup();

                    $timeout(function () {
                        $scope.vm.results = data;
                    }, 1000);
                   
                    $scope.vm.searching = false;
                }, function() {
                    $scope.vm.searching = false;
                });
            }

            function print() {
                reportHelper.getPrint("SalesComparisonReport", $scope.vm.query, $scope.vm.columns);
            }

            function getExport() {
                reportHelper.getExport("SalesComparisonReport", $scope.vm.query);
            }

            function hasData() {
                return $scope.vm.results && $scope.vm.results.length > 0;
            }
           
            $scope.vm.isValid = function () {

                if (!$scope.vm.query.PeriodEnd) {
                    return false;
                }

                if (!$scope.vm.query.locationId && !$scope.vm.query.fascia) {
                    return false;
                }

                return !_.isEmpty($scope.vm.query.hierarchy);
            };

            initializePageData();

            $scope.reset = reset;
            $scope.search = search;
            $scope.print = print;
            $scope.getExport = getExport;
            $scope.resolve = url.resolve;
            $scope.hasData = hasData;
        };
    });