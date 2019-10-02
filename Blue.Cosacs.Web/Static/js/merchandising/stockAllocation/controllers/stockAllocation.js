define([
    'angular',
    'underscore',
    'url'],

function (angular, _, url) {
    'use strict';

    return function ($scope, $location, pageHelper, user, repo, locationResourceProvider) {
        $scope.editing = true;
        $scope.saving = false;
        $scope.hasEditPermission = user.hasPermission("StockAllocationEdit");
        $scope.products = [];

        $scope.stockQtyAvailable = {};

        function canSave() {
            return $scope.editing &&
                !$scope.saving &&
                $scope.hasEditPermission &&
                $scope.stockAllocation &&
                $scope.stockAllocation.warehouseLocationId &&
                $scope.stockAllocation.products.length > 0 &&
                !$scope.editingProduct;
        }

        function canAddComments() {
            return $scope.hasEditPermission && !$scope.saving;
        }

        function canEdit() {
            return $scope.stockAllocation && $scope.products.length === 0;
        }

        function canEditProduct() {
            return $scope.stockAllocation && $scope.editing &&
                $scope.stockAllocation.warehouseLocationId > 0;
        }  

        function canAddProduct(form) {
            return canEditProduct(form) && form.$valid;
        }

        function runningQtyAvailable(product) {

            if (!product.sku) {
                return "";
            }

            var matching = _.where($scope.stockAllocation.products, { sku: product.sku });

            var index = _.indexOf(matching, product);

            var previous = matching;

            if (index != -1) {
                previous = _.first(matching, index);
            }

            if (previous.length > 0) {
                var sum = _.reduce(previous, function(memo, num) {
                    return memo + num.quantity;

                }, 0);

                return $scope.stockQtyAvailable[product.sku] - sum;
            }
            return product.stockAvailable;
        }

        function isCreated() {
            return $scope.stockAllocation.id > 0;
        }

        function showProducts() {
            return $scope.products.length > 0;
        }

        function setEditing(val) {
            $scope.editingProduct = val;
        }

        function addProduct(form) {

            if (!canAddProduct(form))
                return;
          
            $scope.products.push({});
            setEditing(true);
        }

        function saveProduct(product, form) {

            if (!canAddProduct(form))
                return false;

            var existingHash = _.filter($scope.stockAllocation.products, function(p) {
                return p.$$hashKey === product.$$hashKey;
            });

            if (existingHash.length > 0) {
                existingHash[0] = product;
                return true;
            }

            if (product.productId > 0) {
                var existing = _.filter($scope.stockAllocation.products, function(p) {
                    return p.sku === product.sku && p.receivingLocationId == product.receivingLocationId;
                }).length;

                if (existing > 0) {
                    pageHelper.notification.showPersistent("Product has already been added.");
                    return false;
                } else {
                    $scope.stockAllocation.products.push(product);
                }
            }

            return true;
        }
        
        function updateTitle(stockAllocation) {
            pageHelper.setTitle(stockAllocation && stockAllocation.id ? 'Stock Allocation #' + stockAllocation.id : 'Create Stock Allocation');
        }

        function reset() {
            $scope.stockAllocation = {};
            $scope.stockAllocation.products = [];
            $scope.stockAllocation.receivingLocationId = null;
            $scope.stockAllocation.warehouseLocationId = null;
            $scope.products = [];
        }

        function initializePage() {
            locationResourceProvider.getList(false).then(function (locations) {
                $scope.locations = locations;
            });

            locationResourceProvider.getList(true).then(function (warehouses) {
                $scope.warehouses = warehouses;
            });

            updateTitle($scope.stockAllocation);

            reset();
        }

        function save() {
            $scope.saving = true;
            
            repo.save($scope.stockAllocation)
                .then(function() {
                    $scope.saving = false;
                    reset();
                    pageHelper.notification.show("Stock allocation saved.");
                }, function(err) {
                    $scope.saving = false;
                    if (err && err.message) {
                        pageHelper.notification.showPersistent(err.message);
                    }
                });
        }

        function removeProduct(product) {
            $scope.products = _.reject($scope.products, function (p) {
                return p === product;
            });
        }

        $scope.resolve = url.resolve;
        $scope.canAddComments = canAddComments;
        $scope.canEdit = canEdit;
        $scope.canEditProduct = canEditProduct;
        $scope.canAddProduct = canAddProduct;
        $scope.canSave = canSave;
        $scope.addProduct = addProduct;
        $scope.saveProduct = saveProduct;
        $scope.removeProduct = removeProduct;
        $scope.showProducts = showProducts;
        $scope.isCreated = isCreated;
        $scope.setEditing = setEditing;
        $scope.save = save;
        $scope.runningQtyAvailable = runningQtyAvailable;

        initializePage();
    };
});
