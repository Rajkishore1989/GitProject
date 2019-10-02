define([
        'angular',
        'underscore',
        'url'
    ],
    function(angular, _, url) {
        'use strict';

        var settingsSources = [
            'Blue.Cosacs.Merchandising.ProductTags',
            'Blue.Cosacs.Merchandising.Fascia'
        ];

        return function ($scope, $timeout, pageHelper, locationResourceProvider, allocatedStockReportProvider, reportHelper) {
            $scope.vm = {};
            $scope.vm.searching = false;
            $scope.vm.columns = [];
            $scope.vm.dateFormat = pageHelper.dateFormat;
            $scope.vm.gridTemplate = url.resolve('/static/js/merchandising/reports/allocatedStockReport/templates/allocatedStockReportGrid.html');

            $scope.vm.utils = {
                expand: function (group) {
                    if (!group.expanded) {
                        group.expanded = true;
                    } else {
                        group.expanded = false;
                    }
                    return group.expanded;
                }
            };

            function reset() {
                $scope.vm.query = {};
                $scope.vm.results = [];
                $scope.vm.resultCount = null;
                $scope.vm.resultsNotFound = null;
            }

            function initializePageData() {
                pageHelper.setTitle('Allocated Stock Report');

                locationResourceProvider.getList().then(function(locations) {
                    $scope.vm.locations = locations;
                });

                pageHelper.getSettings(settingsSources, function(options) {
                    $scope.vm.options = options;
                });

                reset();
            }

            function search() {
                $scope.vm.searching = true;
                $scope.vm.results = [];

                allocatedStockReportProvider.search($scope.vm.query).then(function (results) {

                    // Warn if large results set returned
                    $scope.vm.resultCount = results.length;
                    $scope.resultsNotFound = results.length === 0;

                    // Get levels and generate grid columns
                    $scope.vm.columns = reportHelper.initialiseColumns($scope.vm.columns, ['SKU', 'Description', 'Location', 'Stock On Hand Quantity', 'Stock On Hand Value', 'Stock Available Quantity', 'Stock Available Value', 'Stock Allocated Quantity', 'Stock Allocated Value', 'Reference Number', 'Date Allocated']);
                    
                    $timeout(function () {
                        $scope.vm.results = results;
                    }, 1000);
                  
                    $scope.vm.searching = false;
                }, function() {
                    $scope.vm.searching = false;
                });
            }

            function print() {
                reportHelper.getPrint("AllocatedStockReport", $scope.vm.query, $scope.vm.columns);
            }

            function getExport() {
                reportHelper.getExport("AllocatedStockReport", $scope.vm.query);
            }

            function hasData(data) {
                return data.length > 0;
            }
            
            initializePageData();
            $scope.resolve = url.resolve;
            $scope.reset = reset;
            $scope.search = search;
            $scope.print = print;
            $scope.getExport = getExport;
            $scope.hasData = hasData;
        };
    });