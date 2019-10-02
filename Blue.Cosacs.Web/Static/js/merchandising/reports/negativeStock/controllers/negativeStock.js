define([
    'angular',
    'underscore',
    'url'
],
function (angular, _, url) {
    'use strict';

    var settingsSources = [
        'Blue.Cosacs.Merchandising.Fascia',
        'Blue.Cosacs.Merchandising.ProductTags'
    ];

    return function ($scope, $timeout, $filter, pageHelper, repo, locationResourceProvider, periodProvider, reportHelper) {
        $scope.dateFormat = pageHelper.dateFormat;
        $scope.vm = {
            searching: false,
            columns: [],
            gridTemplate: url.resolve('/static/js/merchandising/reports/negativeStock/templates/negativeStockGrid.html')
        };

        pageHelper.getSettings(settingsSources, function (options) {
            $scope.vm.options = options;
            $scope.$apply();
        });

        $scope.vm.stockTypes = {
            "RegularStock": "Regular Stock",
            "SparePart": "Spare Parts",
            "RepossessedStock": "Repossessed Stock"
        };

        function initColumns() {
            $scope.vm.columns = reportHelper.initialiseColumns($scope.vm.columns, ['Division', 'Department', 'Class', 'Product', 'Location', 'Stock On Hand Qty.', 'Unit Cost', 'Stock On Hand Value', 'Last Received Date', 'Last Transaction Type', 'Last Transaction Id', 'Last Transaction Narration', 'Last Transaction Date']);
        }

        function reset() {
            $scope.vm.query = { isGrouped: 'true' };
            $scope.vm.results = [];
            initColumns();
        }

        function initializePageData() {
            locationResourceProvider.getList().then(function(locations) {
                $scope.vm.locations = locations;
            });

            periodProvider.getCurrentAndPrevious().then(function(periods) {
                $scope.vm.periods = periods;
            });

            reset();
        }

        function updateLocation() {
            $scope.vm.query.location = $scope.vm.locations[$scope.vm.locationId];
        }

        function prepareHierarchy() {
            $scope.vm.query.division = $scope.vm.query.hierarchy[1] || "";
            $scope.vm.query.department = $scope.vm.query.hierarchy[2] || "";
            $scope.vm.query["class"] = $scope.vm.query.hierarchy[3] || "";
        }

        function search() {
            $scope.vm.searching = true;
            $scope.vm.results = [];
            prepareHierarchy();
            repo.search($scope.vm.query).then(function (results) {

                // Warn if large results set returned
                $scope.vm.resultCount = results.length;
               
                $timeout(function () {
                    $scope.vm.results = results;
                }, 1000);

                $scope.vm.searching = false;
            }, function() {
                $scope.vm.searching = false;
            });
        }

        function print() {
            prepareHierarchy();
            reportHelper.getPrint("NegativeStockReport", $scope.vm.query, $scope.vm.columns);
        }

        function getExport() {
            prepareHierarchy();
            reportHelper.getExport("NegativeStockReport", $scope.vm.query);
        }

        function hasData(data) {
            return data.length > 0;
        }

        function canSearch() {
            return $scope.vm.query.periodEndDate;
        }

        $scope.vm.utils = {
            showMovement: function(x) {
                return url.open('Merchandising/StockMovementReport/?locationId=' + x.locationId + '&sku=' + x.sku);
            },
            transactionLink: function(m) {
            var route = '';
            switch (m.type) {
                case 'Transfer':
                    route = 'Merchandising/StockTransfer/Detail/';
                    break;
                case 'Allocation':
                    route = 'Warehouse/Bookings/detail/';
                    break;
                case 'Requisition':
                    route = 'Warehouse/Bookings/detail/';
                    break;
                case 'Adjustment':
                    route = 'Merchandising/StockAdjustment/Detail/';
                    break;
                case 'GoodsReceipt':
                    route = 'Merchandising/GoodsReceipt' + (m.isDirect ? 'Direct' : '') + '/Detail/';
                    break;
                case 'VendorReturn':
                    route = 'Merchandising/VendorReturn' + (m.isDirect ? 'Direct' : '') + '/Detail/';
                    break;
                case 'CINT':
                    return null;
                default :
                    return null;
                }
                return url.resolve(route + m.transactionId);
            },

            totalQuantity: function(y) {
                var x = _.findWhere($scope.vm.results, { location: y });
                return _.reduce(x.items, function (memo, product) { return memo + product.stockOnHandQuantity; }, 0);
            },
            totalValue: function(y) {
                var x = _.findWhere($scope.vm.results, { location: y });
                return _.reduce(x.items, function (memo, product) { return memo + product.stockOnHandValue; }, 0);
            }
        };
        
        $scope.resolve = url.resolve;
        $scope.search = search;
        $scope.reset = reset;
        $scope.print = print;
        $scope.getExport = getExport;
        $scope.canSearch = canSearch;
        $scope.updateLocation = updateLocation;
        $scope.hasData = hasData;
        initializePageData();
    };
});
