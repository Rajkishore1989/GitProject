define(['angular', 'underscore', 'url', 'notification'],
function (angular, _, url, notification) {
    'use strict';

    var settingsSources = [
        'Blue.Cosacs.Merchandising.ProductTags',
        'Blue.Cosacs.Merchandising.Fascia'
    ];

    return function ($scope, $timeout, $filter, pageHelper, buyerSalesHistoryRepo, locationResourceProvider, reportHelper) {
        $scope.vm = {};
        $scope.vm.searching = false;
        $scope.vm.columns = [];
        $scope.vm.dateFormat = pageHelper.dateFormat;
        $scope.vm.gridTemplate = url.resolve('/static/js/merchandising/reports/buyerSalesHistoryReport/templates/buyerSalesHistoryGrid.html');

        $scope.vm.stockTypes = {
            "RegularStock": "Regular Stock",
            "SparePart": "Spare Parts",
            "RepossessedStock": "Repossessed Stock"
        };

        $scope.vm.kpi = {
            "Sales Value": "Sales Value",
            "Sales Volume": "Sales Volume",
            "Margin Value": "Margin Value",
            "Margin Percentage": "Margin Percentage"
        };

        $scope.vm.isValid = function(){

            if (!$scope.vm.query.kpi){
                return false;
            }

            if (!$scope.vm.query.locationId && !$scope.vm.query.fascia){
                return false;
            }

            return !_.isEmpty($scope.vm.query.hierarchy);
        };

        $scope.vm.gridUtils = {
            chooseFilter: function () {
                var result;
                switch ($scope.vm.query.kpi) {
                    case "Sales Value":
                        result = "Currency";
                        break;
                    case "Margin Value":
                        result = "Currency";
                        break;
                    case "Sales Volume":
                        result = "";
                        break;
                    default:
                        result = "Percentage";
                }
                return result;
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

        function clearData() {
            $scope.vm.results = [];
            $scope.vm.resultCount = undefined;
        }

        function initializePageData() {
            locationResourceProvider.getList().then(function (locations) {
                $scope.vm.locations = locations;
            });
            configureDatePicker();
            reset();
        }

        function search() {

            if (!$scope.vm.isValid()){
                notification.show('You have to select either Location or Fascia and one value on the hierarchy.');
                return;
            }

            $scope.vm.searching = true;
            $scope.vm.results = [];
            $scope.vm.resultCount = undefined;

            buyerSalesHistoryRepo.search($scope.vm.query).then(function (results) {

                // Warn if large results set returned
                $scope.vm.resultCount = results.products.length;

                // Get levels and generate grid columns
                $scope.vm.columns = reportHelper.initialiseColumns($scope.vm.columns, ['Sku', 'Description', 'Brand', 'Vendor', 'Stock On Order', 'Stock On Hand', 'Average Weighted Cost', 'Stock On Hand Cost', 'Cash Price', 'Year', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March', 'Year to Date']);
               
                $timeout(function() {
                    $scope.vm.results = results;
                }, 1000);

                $scope.vm.searching = false;
                
            }, function() {
                $scope.vm.searching = false;
            });
        }

        function getExport() {
            reportHelper.getExport("BuyerSalesHistoryReport", $scope.vm.query, $scope.vm.columns);
        }

        function print() {
            if ($scope.vm.query.locationId) {
                $scope.vm.query.location = $scope.vm.locations[$scope.vm.query.locationId];
            } else {
                $scope.vm.query.location = "";
            }
            reportHelper.getPrint("BuyerSalesHistoryReport", $scope.vm.query, $scope.vm.columns);
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
        $scope.clearData = clearData;
    };
});
