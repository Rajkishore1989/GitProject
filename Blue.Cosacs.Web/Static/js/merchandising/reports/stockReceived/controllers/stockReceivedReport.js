define([
    'angular',
    'underscore',
    'url'
],
function (angular, _, url) {
    'use strict';

    return function ($scope, $timeout, pageHelper, stockReceivedRepo, locationResourceProvider, hierarchyResourceProvider, vendorResourceProvider) {
        var isLoading = false;

        $scope.columns = [];
        $scope.gridTemplate = url.resolve('/static/js/merchandising/reports/stockReceived/templates/stockReceivedReportGrid.html');
        $scope.dateFormat = pageHelper.dateFormat;

        function configureDatePicker() {
            $timeout(function () {
                $('.date').datepicker('option', 'maxDate', new Date());
            }, 0);
        }

        function initializePageData() {
            pageHelper.setTitle('Stock Received Report');

            locationResourceProvider.getList(false).then(function (locations) {
                $scope.locations = locations;
            });

            hierarchyResourceProvider.getLevels().then(function (hierarchy) {
                $scope.divisions = hierarchy.divisions;
                $scope.departments = hierarchy.departments;
                $scope.classes = hierarchy.classes;
            });

            vendorResourceProvider.getList({ includeInactive: false }).then(function (vendors) {
                $scope.vendors = vendors;
            });

            pageHelper.getSettings(['Blue.Cosacs.Merchandising.Fascia'], function (options) {
                $scope.fascias = options.fascia;
            });

            _.each(['Division', 'Department', 'Class', 'Sku', 'Description', 'Location', 'Vendor','Date' ,'Last Received', 'Stock Received', 'Landed Cost', 'Extended Landed Cost', 'Reference Number', 'Stock On Hand', 'Purchase Order', 'Stock On Order'], function (col) {
                $scope.columns.push({ name: col, selected: true });
            });

            configureDatePicker();
        }

        function groupResults(results) {
            var vendors = _.groupBy(results, function (x) { return x.vendor; });
            _.each(vendors, function(v, k) {
                vendors[k] = _.groupBy(v, function(x) {
                    return x.location;
                });
            });
            return vendors;
        }

        function calcResultCount(results) {
            return _.filter(results, function(r) {
                return r.type !== 'Opening Balance';
            }).length;
        }

        $scope.resolve = url.resolve;

        $scope.reset = function () {
            $scope.query = {};
            $scope.results = {};
        };

        $scope.get = function () {
            $scope.results = undefined;
            isLoading = true;
            stockReceivedRepo.search($scope.query || {})
                .then(function (results) {
                    $timeout(function() {
                        isLoading = false;
                        $scope.results = groupResults(results);
                    }, 50);
                }, function(err) {
                    isLoading = false;
                });
        };

        $scope.loading = function() {
            return isLoading;
        };

        var routes = {
            GR: 'Merchandising/GoodsReceipt/Detail/',
            VR: 'Merchandising/VendorReturn/Detail/',
            GRD: 'Merchandising/GoodsReceiptDirect/Detail/',
            VRD: 'Merchandising/VendorReturnDirect/Detail/'
        };

        var locationTotal = function (l) {
            return _.reduce(l, function (m, x) {
                return m + x.extendedLandedCost || 0;
            }, 0);
        };

        var vendorTotal = function (v) {
            return _.reduce(v, function (m, l) {
                return m + locationTotal(l);
            }, 0);
        };

        $scope.gridUtils = {
            referenceLink: function(m) {
                return url.resolve(routes[m.label] + m.id);
            },
            locationTotal: locationTotal,
            vendorTotal: vendorTotal
        };

        $scope.getExport = function () {
            url.open('/Merchandising/StockReceivedReport/Export?' + $.param($scope.query || {}));
        };

        $scope.print = function () {
            var colsIndices = [];
            _.each($scope.columns, function (col, index) {
                if (col.selected === true) {
                    colsIndices.push(index);
                }
            });

            url.open('/Merchandising/StockReceivedReport/Print?c=' + colsIndices + '&' + $.param($scope.query || {}));
        };

        initializePageData();
    };
});
