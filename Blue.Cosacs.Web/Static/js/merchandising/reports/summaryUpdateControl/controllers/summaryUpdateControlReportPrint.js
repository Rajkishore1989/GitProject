define([
    'angular',
    'underscore',
    'url'
],
function (angular, _, url) {
    'use strict';

    return function ($scope, $timeout, $location, pageHelper, summaryUpdateControlRepo, reportHelper) {
        var isLoading = false;

        function initializePageData() {
            $scope.query = $location.search();

            $scope.get();
        }

        $scope.groupTypes = function(results) {
            return _.groupBy(results.rows, function(r) {
                return r.transactionType;
            });
        };

        $scope.typeSummaries = function (groups) {
            var result = _.clone($scope.rowName);
            _.each(groups, function (g, k) {
                result[k] = _.reduce(g, function(m, x) {
                    if (x.productType === 'RegularStock') {
                        m.regVal = (m.regVal || 0) + x.value;
                        m.regUnits = (m.regUnits || 0) + x.units;
                    }
                    if (x.productType === 'RepossessedStock') {
                        m.repVal = (m.repVal || 0) + x.value;
                        m.repUnits = (m.repUnits || 0) + x.units;
                    }
                    if (x.productType === 'SparePart') {
                        m.spVal = (m.spVal || 0) + x.value;
                        m.spUnits = (m.spUnits || 0) + x.units;
                    }
                    return m;
                }, {});
                result[k].rows = reportHelper.pages(_.map(g, function(v) {
                    var x = {
                        transactionDate: v.transactionDate,
                        transactionUrl: v.reference
                    };
                    if (v.productType === 'RegularStock') {
                        x.regVal = v.value;
                        x.regUnits = v.units;
                    }
                    if (v.productType === 'RepossessedStock') {
                        x.repVal = v.value;
                        x.repUnits = v.units;
                    }
                    if (v.productType === 'SparePart') {
                        x.spVal = v.value;
                        x.spUnits = v.units;
                    }
                    return x;
                }));
            });
            return result;
        };

        $scope.rowName = {
            'Goods Receipt': 'Goods Receipts Notes - GRN & GRN II',
            'Stock Transfer': 'Stock Transfer - STN, GFR, GRFR',
            'Deliveries': 'Deliveries - DEL, RDL',
            'Collects': 'Collects - GRT, RPL',
            'Inventory Count Adjustments': 'Inventory Count Adjustments',
            'Adjustment Gains': 'Adjustments Gains',
            'Adjustment Losses': 'Adjustments Loss'
        };

        $scope.get = function () {
            $scope.results = undefined;
            isLoading = true;
            summaryUpdateControlRepo.search($scope.query || {})
                .then(function (results) {
                    $timeout(function() {
                        isLoading = false;
                        $scope.results = results;
                        $scope.results.types = $scope.groupTypes(results);
                        $scope.results.summaries = $scope.typeSummaries($scope.results.types);
                    }, 50);
                }, function(err) {
                    isLoading = false;
                });
        };

        $scope.loading = function() {
            return isLoading;
        };
        
        $scope.rowLimit = 100;

        $scope.showRowsMsg = function (type) {
            return $scope.results && $scope.results.summaries[type].rows && $scope.results.summaries[type].rows.length > $scope.rowLimit;
        };

        initializePageData();
    };
});
