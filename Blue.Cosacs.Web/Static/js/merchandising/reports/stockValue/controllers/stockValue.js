define([
    'angular',
    'underscore',
    'url'
],
function (angular, _, url) {
    'use strict';

    var settingsSources = [
        'Blue.Cosacs.Merchandising.Fascia'
    ];

    return function($scope, $timeout, $filter, pageHelper, repo, locationResourceProvider, periodProvider, reportHelper) {
        $scope.dateFormat = pageHelper.dateFormat;
        $scope.vm = {
            searching: false,
            columns: [],
            gridTemplate: url.resolve('/static/js/merchandising/reports/stockValue/templates/stockValueGrid.html')
        };

        pageHelper.getSettings(settingsSources, function (options) {
            $scope.vm.options = options;
            $scope.$apply();
        });

        function reset() {
            $scope.vm.query = {
                isGrouped: 'true'
            };
            $scope.vm.results = [];
        }

        function initializePageData() {
            locationResourceProvider.getList().then(function (locations) {
                $scope.vm.locations = locations;
            });

            periodProvider.getCurrentAndPrevious().then(function (periods) {
                $scope.vm.periods = periods;
            });

            // Get levels and generate grid columns
            $scope.vm.columns = reportHelper.initialiseColumns($scope.vm.columns, ['Stock On Hand Qty.', 'Stock On Hand Value', 'Stock On Hand Sales Value']);
            
            reset();
        }

        function updateLocation() {
            $scope.vm.query.location = $scope.vm.locations[$scope.vm.locationId];
        }

        function search() {
            $scope.vm.searching = true;
            $scope.vm.results = [];

            repo.search($scope.vm.query).then(function (results) {
                $scope.vm.results = results;
                $scope.vm.searching = false;
            }, function() {
                $scope.vm.searching = false;
            });
        }

        function print() {
            reportHelper.getPrint("StockValueReport", $scope.vm.query, $scope.vm.columns);
        }

        function getExport() {
            reportHelper.getExport("StockValueReport", $scope.vm.query);
        }

        function canSearch() {
            return $scope.vm.query.periodEndDate;
        }
        
        $scope.resolve = url.resolve;
        $scope.search = search;
        $scope.reset = reset;
        $scope.print = print;
        $scope.getExport = getExport;
        $scope.canSearch = canSearch;
        $scope.updateLocation = updateLocation;
       
        initializePageData();
    };
});
