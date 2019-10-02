define([
    'angular',
    'underscore',
    'url'
],
function (angular, _, url) {
    'use strict';

    var settingsSources = [
        'Blue.Cosacs.Merchandising.ProductTags',
        'Blue.Cosacs.Merchandising.Fascia'
    ];

    return function ($scope, $timeout, $filter, pageHelper, warehouseOversupplyRepo, locationResourceProvider, reportHelper) {
        $scope.vm = {};
        $scope.vm.searching = false;
        $scope.vm.columns = [];
        $scope.vm.dateFormat = pageHelper.dateFormat;
        $scope.vm.gridTemplate = url.resolve('/static/js/merchandising/reports/warehouseOversupplyReport/templates/warehouseOversupplyGrid.html');
        $scope.vm.gridUtils = {
            yesOrNo: function (m) {
                if (m) {
                    return "Yes";
                } else {
                    return "No";
                }
            }
        };

        function configureDatePicker() {
            $timeout(function () {
                $('.date').datepicker('option', 'maxDate', new Date());
            }, 0);
        }

        function reset() {
            $scope.vm.query = {};
            $scope.vm.results = [];
            $scope.vm.clearTags = !$scope.vm.clearTags;
            $scope.vm.resultCount = undefined;
        }

        function initializePageData() {
            locationResourceProvider.getList(true).then(function (locations) {
                $scope.vm.locations = locations;
            });
            configureDatePicker();
            reset();
        }

        function search() {
            $scope.vm.searching = true;
            $scope.vm.results = [];
            $scope.vm.resultCount = 0;

            warehouseOversupplyRepo.search($scope.vm.query).then(function (results) {

                // Warn if large results set returned
                $scope.vm.resultCount = results.products.length;

                // Get levels and generate grid columns
                $scope.vm.columns = reportHelper.initialiseColumns($scope.vm.columns, [results.levels, ['SKU', 'Description', 'Stock on Hand (Warehouse)', 'Locations Assigned', 'Location (Without Stock)', 'Date Last Received', 'Requisition Pending']]);
                
                $timeout(function() {
                    $scope.vm.results = results;
                }, 1000);

                $scope.vm.searching = false;
                
            }, function() {
                $scope.vm.searching = false;
            });
        }

        function print() {
            reportHelper.getPrint("WarehouseOversupplyReport", $scope.vm.query, $scope.vm.columns);
        }

        function getExport() {
            reportHelper.getExport("WarehouseOversupplyReport", $scope.vm.query);
        }

        function hasData(data) {
            return data.products && data.products.length > 0;
        }

        pageHelper.getSettings(settingsSources, function (options) {
            $scope.vm.options = options;
            $scope.$apply();
        });

        initializePageData();
        
        $scope.resolve = url.resolve;
        $scope.search = search;
        $scope.reset = reset;
        $scope.print = print;
        $scope.getExport = getExport;
        $scope.hasData = hasData;
    };
});
