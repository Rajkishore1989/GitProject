define([
    'angular',
    'underscore',
    'lib/bootstrap/tooltip',
    'url'],

function (angular, _, tooltip, url) {
    'use strict';

    return function ($scope, $location, pageHelper, user, repo, locationResourceProvider) {
        $scope.editing = true;
        $scope.saving = false;
        $scope.searchEndpoint = 'Merchandising/Products/SearchStockProductsWithMatchingStoreType';
        $scope.hasEditPermission = user.hasPermission("StockRequisitionEdit");
        var defaultTooltip = 'Please enter a numeric value between 1 and 20000';
        $scope.quantityTooltip = defaultTooltip;


        function canSave() {
            return $scope.editing && !$scope.saving && $scope.hasEditPermission && $scope.stockRequisition.products.length > 0;
        }

        function canAddComments() {
            return $scope.hasEditPermission && !$scope.saving;
        }

        function canEdit() {
            return $scope.stockRequisition && $scope.stockRequisition.products.length === 0;
        }

        function canEditProduct() {
            return $scope.stockRequisition &&
                $scope.stockRequisition.receivingLocationId > 0 &&
                $scope.stockRequisition.warehouseLocationId > 0;
        }  

        function canAddProduct(form) {
            return canEditProduct(form) &&
                form.$valid;
        }

        function isCreated() {
            return $scope.stockRequisition.id > 0;
        }

        function showProducts() {
            return $scope.stockRequisition.products.length > 0;
        }

        function clearStockInfo() {
            $scope.stockInfo = null;
        }

        function addProduct(product, form) {

            if (!canAddProduct(form))
                return;
            
            if (product.productId > 0) {
                var existing = _.find($scope.stockRequisition.products, function(p) {
                    return p.sku === product.sku;
                });

                if (!existing) {
                    $scope.stockRequisition.products.push(product);
                    $scope.newProduct = {};
                    $('#quantity').tooltip('disable');
                } else {
                    pageHelper.notification.showPersistent("Product has already been added.");
                }

                $scope.stockInfo = null;
            }
        }

        function updateTitle(stockRequisition) {
            pageHelper.setTitle(stockRequisition && stockRequisition.id ? 'Stock Requisition #' + stockRequisition.id : 'Create Stock Requisition');
        }

        function reset() {
            $scope.stockRequisition = {};
            $scope.stockRequisition.products = [];
            $scope.stockRequisition.receivingLocationId = null;
            $scope.stockRequisition.warehouseLocationId = null;
        }

        function initializePage() {
            locationResourceProvider.getList(false).then(function (locations) {
                $scope.locations = locations;
            });

            locationResourceProvider.getList(true).then(function (warehouses) {
                $scope.warehouses = warehouses;
            });

            updateTitle($scope.stockRequisition);

            reset();
        }

        function save() {
            $scope.saving = true;

            repo.save($scope.stockRequisition)
                .then(function(adj) {
                    $scope.saving = false;
                    pageHelper.notification.show("Stock requisition saved.");
                    reset();
                }, function(err) {
                    $scope.saving = false;
                    if (err && err.message) {
                        pageHelper.notification.showPersistent(err.message);
                    }
                });
        }

        function removeProduct(id) {
            $scope.stockRequisition.products = _.reject($scope.stockRequisition.products, function (r) {
                return r.productId === id;
            });
        }

        function getSearchParams() {
            return {
                locationId: $scope.stockRequisition.warehouseLocationId,
                storeTypeLocationId : $scope.stockRequisition.receivingLocationId
            };
        }

        function processSearchResult(searchResult) {
            $scope.stockInfo = null;
            if (searchResult) {
                $scope.newProduct = searchResult;

                repo.getStockInfo({
                    productId: searchResult.id,
                    receivingLocationId: $scope.stockRequisition.receivingLocationId,
                    warehouseLocationId: $scope.stockRequisition.warehouseLocationId
                }).then(function(stockInfo) {
                    $scope.stockInfo = stockInfo || {};
                });
            }
        }

        function lineCost(product) {
            return product.quantity * product.averageWeightedCost;
        }

        function totalLineCost() {
            if ($scope.stockRequisition.products.length > 0) {
                return _.reduce($scope.stockRequisition.products, function(sum, el) {
                    return sum + (el.averageWeightedCost * el.quantity);
                }, 0);
            }
            return 0;
        }

        function checkQuantity() {
            if ($scope.stockInfo) {
                $scope.amount = $scope.stockInfo.warehouseAvailableStock + $scope.stockInfo.warehouseStockOnOrder;
                var tooltip = ($scope.stockRequisition && $scope.newProduct.quantity > $scope.amount) ?
                    'Please note that the entered quantity exceeds the current stock available at this sending location (' + $scope.amount + ' available).' :
                    $scope.newProduct.quantity < 1 || $scope.newProduct.quantity > 20000 ? defaultTooltip : '';

                if (tooltip !== '') {
                    $('#quantity').attr('data-original-title', tooltip);
                    $('#quantity').tooltip({ trigger: 'focus' }).tooltip('enable').tooltip('show');
                } else {
                    $('#quantity').tooltip('disable').tooltip('hide');
                }
            }
        }

        $scope.resolve = url.resolve;
        $scope.canAddComments = canAddComments;
        $scope.canEdit = canEdit;
        $scope.canEditProduct = canEditProduct;
        $scope.canAddProduct = canAddProduct;
        $scope.canSave = canSave;
        $scope.addProduct = addProduct;
        $scope.removeProduct = removeProduct;
        $scope.processSearchResult = processSearchResult;
        $scope.showProducts = showProducts;
        $scope.isCreated = isCreated;
        $scope.save = save;
        $scope.lineCost = lineCost;
        $scope.totalLineCost = totalLineCost;
        $scope.checkQuantity = checkQuantity;
        $scope.clearStockInfo = clearStockInfo;
        $scope.getSearchParams = getSearchParams;

        initializePage();
    };
});
