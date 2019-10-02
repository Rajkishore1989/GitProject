define([
    'angular',
    'underscore',
    'url',
    'moment'],

function (angular, _, url, moment) {
    'use strict';

    return function ($scope, location, pageHelper, stockCountRepo, user) {
        var userCanStart = user.hasPermission('StockCountStart'),
            userCanVerify = user.hasPermission('StockCountEdit'),
            userCanClose = user.hasPermission('StockCountClose'),
            statuses = {
                pending: 'Scheduled',
                inProgress: 'In Progress',
                closed: 'Closed',
                cancelled: 'Cancelled'
            };

        function status() {
            if ($scope.stockCount.cancelledById) {
                return statuses.cancelled;
            }
            if ($scope.stockCount.closedById) {
                return statuses.closed;
            }
            if ($scope.stockCount.startedById) {
                return statuses.inProgress;
            }
            return statuses.pending;
        }

        function canStart() {
            return userCanStart &&
                moment().isAfter($scope.stockCount.countDate) &&
                $scope.status === statuses.pending;
        }

        function canVerify() {
            return userCanVerify &&
                $scope.status === statuses.inProgress;
        }

        function canClose() {
            return !$scope.saving &&
                userCanClose &&
                $scope.status === statuses.inProgress;
        }

        function canCancel() {
            return !$scope.saving &&
                userCanClose &&
                $scope.status !== statuses.cancelled &&
                $scope.status !== statuses.closed;
        }

        function canSave(form) {
            return !$scope.saving &&
                $scope.status === statuses.inProgress &&
                form &&
                form.$valid &&
                form.$dirty;
        }

        function canPrint() {
            return !$scope.saving &&
                $scope.status === statuses.inProgress;
        }

        function canPrintVariances() {
            return !$scope.saving &&
               $scope.status === statuses.inProgress;
        }

        function showClose() {
            return userCanClose &&
                $scope.status === statuses.inProgress;
        }

        function showCancel() {
            return userCanClose &&
                $scope.status !== statuses.cancelled &&
                $scope.status !== statuses.closed;
        }

        function showSave(form) {
            return $scope.status === statuses.inProgress &&
                form &&
                form.$valid &&
                form.$dirty;
        }

        function showPrint() {
            return $scope.status === statuses.inProgress;
        }

        function showPrintVariances() {
            return $scope.status === statuses.inProgress;
        }

        function canSearch() {
            return $scope.status !== statuses.pending;
        }

        function start() {
            if (!canStart()) {
                return;
            }
            window.location = url.resolve('/Merchandising/StockCountStart/Start/' + $scope.stockCount.id);
        }

        function close() {
            if (!canClose()) {
                return;
            }

            save();

            $scope.saving = true;

            stockCountRepo.close($scope.stockCount.id)
                .then(function (stockCount) {
                    $scope.stockCount = stockCount;
                    $scope.status = status();
                    $scope.saving = false;
                }, function (err) {
                    $scope.saving = false;
                    if (err && err.message) {
                        pageHelper.notification.showPersistent(err.message);
                    }
                });
        }

        function cancel() {
            if (!canCancel()) {
                return;
            }

            $scope.saving = true;

            stockCountRepo.cancel($scope.stockCount.id)
                .then(function (stockCount) {
                    $scope.stockCount = stockCount;
                    $scope.status = status();
                    $scope.saving = false;
                }, function (err) {
                    $scope.saving = false;
                    if (err && err.message) {
                        pageHelper.notification.showPersistent(err.message);
                    }
                });
        }
        
        function save(form) {
            if (!canSave(form)) {
                return;
            }

            $scope.saving = true;

            stockCountRepo.save($scope.paginator.page)
                .then(function () {
                    $scope.saving = false;
                    $scope.$broadcast('saved');
            }, function (err) {
                    $scope.saving = false;
                    if (err && err.message) {
                        pageHelper.notification.showPersistent(err.message);
                    }
                });
        }
        
        function exportProducts() {
            return url.open('Merchandising/StockCount/Export/' + $scope.stockCount.id);
        }

        function print() {
            if (!canPrint()) {
                return;
            }
            url.open('/Merchandising/StockCount/Print/' + $scope.stockCount.id);
        }

        function printVariances() {
            if (!canPrintVariances()) {
                return;
            }

            url.open('/Merchandising/StockCount/PrintVariance/' + $scope.stockCount.id);
        }

        function productSearchSetup() {
            return {
                placeholder: "Enter a SKU or product description",
                width: '100%',
                minimumInputLength: 2,
                ajax: {
                    url: url.resolve('Merchandising/Products/SearchStockProducts'),
                    dataType: 'json',
                    data: function (term) {
                        return {
                            q: term,
                            rows: 10,
                            locationId: $scope.stockCount.locationId
                        };
                    },
                    results: function (result) {
                        return {
                            results: _.map(result.data, function (doc) {
                                return {
                                    sku: doc.sku,
                                    description: doc.longDescription,
                                    id: doc.productId,
                                    averageWeightedCost: doc.averageWeightedCost
                                };
                            })
                        };
                    }
                },
                formatResult: function (data) {
                    return "<table class='WarrantyResults'><tr><td><b> " + data.sku + " </b></td><td> : </td><td> " + data.description + "</td></tr></table>";
                },
                formatSelection: function (data) {
                    return data.sku;
                },
                dropdownCssClass: "productResults",
                escapeMarkup: function (m) {
                    return m;
                }
            };
        }

        function processSearchResult(searchResult) {
            if (searchResult) {
                $scope.productId = searchResult.id;
                $scope.params.productId = searchResult.id;
                $scope.searchResult = searchResult;
                $scope.paginator.get();
            }
        }

        function defaultParams() {
            return {
                id: $scope.stockCount.id
            };
        }

        function clear() {
            $scope.searchResult = {};
            $scope.paginator.reset();
            $scope.paginator.get();
        }

        $scope.$watch('stockCount', function () {
            $scope.status = status();
        });

        $scope.saving = false;
        $scope.clear = clear;
        $scope.params = {};
        $scope.productSearch = stockCountRepo.productSearch;
        $scope.resolve = url.resolve;
        $scope.canStart = canStart;
        $scope.canVerify = canVerify;
        $scope.canClose = canClose;
        $scope.canCancel = canCancel;
        $scope.canSave = canSave;
        $scope.canSearch = canSearch;
        $scope.canPrint = canPrint;
        $scope.canPrintVariances = canPrintVariances;
        $scope.showClose = showClose;
        $scope.showCancel = showCancel;
        $scope.showSave = showSave;
        $scope.showPrint = showPrint;
        $scope.showPrintVariances = showPrintVariances;
        $scope.start = start;
        $scope.close = close;
        $scope.cancel = cancel;
        $scope.save = save;
        $scope.print = print;
        $scope.printVariances = printVariances;
        $scope.productSearchSetup = productSearchSetup;
        $scope.processSearchResult = processSearchResult;
        $scope.defaultParams = defaultParams;
        $scope.exportProducts = exportProducts;
    };
});