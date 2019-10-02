define([
    'angular',
    'underscore',
    'url',
    'notification'
],
function (angular, _, url, notification) {
    'use strict';

    return function ($scope, $timeout, $location, pageHelper, stockMovementRepo, locationResourceProvider, hierarchyResourceProvider) {
        var isLoading = false;
        var isRendering = false;

        $scope.columns = [];
        $scope.gridTemplate = url.resolve('/static/js/merchandising/reports/stockMovement/templates/stockMovementReportGrid.html');

        $scope.dateFormat = pageHelper.dateFormat;

        function configureDatePicker() {
            $timeout(function () {
                $('.date').datepicker('option', 'maxDate', new Date());
            }, 0);
        }

        function initializePageData() {
            pageHelper.setTitle('Stock Movement Report');

            locationResourceProvider.getList(false).then(function (locations) {
                $scope.locations = locations;
            });

            hierarchyResourceProvider.getLevels().then(function (hierarchy) {
                $scope.divisions = hierarchy.divisions;
                $scope.departments = hierarchy.departments;
                $scope.classes = hierarchy.classes;
            });

            pageHelper.getSettings(['Blue.Cosacs.Merchandising.Fascia'], function (options) {
                $scope.fascias = options.fascia;
            });

            var queryString = $location.search();
            $scope.query = {
                locationId: queryString.locationId || '',
                sku: queryString.sku || ''
            };

            configureDatePicker();

            if ($scope.query.locationId && $scope.query.locationId !== '' || ($scope.query.sku && $scope.query.sku !== '')) {
                $scope.get();
            }
        }

        function groupByLocation(results) {
            return _.groupBy(results, function(m) { return m.location; });
        }

        function calcResultCount(results) {
            return _.filter(results, function(r) {
                return r.type !== 'Opening Balance';
            }).length;
        }

        $scope.resolve = url.resolve;

        $scope.reset = function () {
            $scope.query = {};
            $scope.results = [];
        };

        $scope.get = function () {
            $scope.results = undefined;
            isLoading = true;
            stockMovementRepo.search($scope.query || {})
                .then(function (results) {


                    // Get levels and generate grid columns
                    if ($scope.columns.length === 0) {

                        _.each(['Division', 'Department', 'Class', 'Type', 'Transaction', 'Product', 'Brand', 'Product Tags', 'Location', 'Quantity', 'Stock On Hand', 'Date', 'Date Processed', 'User'], function (col) {
                            $scope.columns.push({ name: col, selected: true });
                        });
                    }

                    $scope.resultCount = calcResultCount(results);
                    isRendering = true;
                    $timeout(function() {
                        isLoading = false;
                        isRendering = false;
                        $scope.results = groupByLocation(results);
                    }, 50);
                }, function(err) {
                    isLoading = false;
                });
        };

        $scope.loading = function() {
            return isLoading;
        };

        $scope.rendering = function () {
            return isRendering;
        };

        $scope.gridUtils = {
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
                    route = 'Merchandising/GoodsReceipt/Detail/';
                    break;
                case 'DirectGoodsReceipt':
                    route = 'Merchandising/GoodsReceiptDirect/Detail/';
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
            }
        };

        $scope.showResultsCount = function() {
            return $scope.resultCount !== undefined;
        };

        $scope.getExport = function () {
            url.open('/Merchandising/StockMovementReport/Export?' + $.param($scope.query || {}));
        };

        $scope.print = function () {
            var colsIndices = [];
            _.each($scope.columns, function (col, index) {
                if (col.selected === true) {
                    colsIndices.push(index);
                }
            });

            url.open('/Merchandising/StockMovementReport/Print?c=' + colsIndices + '&' + $.param($scope.query || {}));
        };

        initializePageData();
    };
});
