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

    return function ($scope, $timeout, $filter, pageHelper, topSkuRepo, locationResourceProvider, reportHelper) {
        $scope.dateFormat = pageHelper.dateFormat;
        $scope.vm = {
            searching: false,
            rendering: false,
            columns: [],
            gridTemplate: url.resolve('/static/js/merchandising/reports/topSku/templates/topSkuGrid.html')
        };

        pageHelper.getSettings(settingsSources, function (options) {
            $scope.vm.options = options;
            $scope.$apply();
        });

        function configureDatePicker() {
            $timeout(function () {
                $('.date').datepicker('option', 'maxDate', new Date());
            }, 0);
        }

        function reset() {
            $scope.vm.query = {
                performancePercentage: 1,
                performanceType: 1,
                groupByLocation: 'true'
            };
            $scope.vm.results = [];
            $scope.vm.clearTags = !$scope.vm.clearTags;
        }

        function initializePageData() {
            locationResourceProvider.getList().then(function (locations) {
                $scope.vm.locations = locations;
            });
            configureDatePicker();
            reset();
        }

        function search() {
            $scope.vm.searching = true;
            $scope.vm.results = [];

            topSkuRepo.search($scope.vm.query).then(function (results) {

                // Massage data for display
                var baseUrl = url.resolve('/merchandising/products/details/');
                _.each(results.locations, function (loc) {
                    _.each(loc.products, function (prod) {
                        prod.valueDelivered = $filter('pbCurrency')(prod.valueDelivered);
                        prod.netValueDelivered = $filter('pbCurrency')(prod.netValueDelivered);
                        prod.contribution = $filter('pbPercentage')(prod.contribution);
                        prod.cumulativeValueDelivered = $filter('pbCurrency')(prod.cumulativeValueDelivered);
                        prod.cumulativeNetValueDelivered = $filter('pbCurrency')(prod.cumulativeNetValueDelivered);
                        prod.link = baseUrl + prod.productId;
                    });
                });

                // Warn if large results set returned
                $scope.vm.resultCount = _.reduce(results.locations, function (tally, next) {
                    return tally + next.products.length;
                }, 0);

                // Get levels and generate grid columns
                $scope.vm.columns = reportHelper.initialiseColumns($scope.vm.columns, [results.levels, ['SKU', 'Description', 'Brand', 'Tags', 'Qty.', 'Sales Value', 'Net Sales Value', 'Contribution Percentage', 'Cumulative Sales Value', 'Cumulative Net Sales Value']]);
               
                $scope.vm.rendering = true;
                $timeout(function() {
                    $scope.vm.results = results;
                    $scope.vm.rendering = false;
                }, 1000);

                $scope.vm.searching = false;
                
            }, function() {
                $scope.vm.searching = false;
            });
        }

        function showResultsCount() {
            return $scope.vm.resultCount !== undefined;
        }

        function print() {
            if ($scope.vm.results.searchKey) {
                var colsIndices = [];
                _.each($scope.vm.columns, function (col, index) {
                    if (col.selected === true) {
                        colsIndices.push(index);
                    }
                });
                 
                url.open('/Merchandising/TopSkuReport/Print?searchKey=' + $scope.vm.results.searchKey + '&c=' + colsIndices);
            } 
        }

        function getExport() {
            if ($scope.vm.results.searchKey) {
                url.open('/Merchandising/TopSkuReport/Export?searchKey=' + $scope.vm.results.searchKey);
            } 
        }
        
        $scope.resolve = url.resolve;
        $scope.search = search;
        $scope.reset = reset;
        $scope.print = print;
        $scope.getExport = getExport;
        $scope.showResultsCount = showResultsCount;
        initializePageData();
    };
});
