define([
    'angular',
    'jquery',
    'lib/bootstrap/tooltip',
    'underscore',
    'url'],

function (angular, $, tooltip, _, url) {
    'use strict';

    return function ($scope, $location, $timeout, pageHelper, user, transferRepo, locationResourceProvider, productResourceProvider) {
        var defaultTooltip = 'Please enter a numeric value between 1 and 20000';
        $scope.editing = true;
        $scope.saving = false;
        $scope.stockAvailable = null;
        $scope.quantityTooltip = defaultTooltip;
        $scope.hasEditPermission = user.hasPermission("StockTransferEdit");
        $scope.receivingLocationValid = false;
        $scope.sendingLocationValid = false;
        $scope.viaLocationValid = true;

        function validateLocation() {
            $scope.receivingLocationValid = true;
            $scope.sendingLocationValid = true;
            $scope.viaLocationValid = true;

            if ($scope.stockTransfer === null) {
                $scope.receivingLocationValid = false;
                $scope.sendingLocationValid = false;
                $scope.viaLocationValid = false;
            } else if ($scope.stockTransfer.receivingLocationId && $scope.stockTransfer.receivingLocationId === $scope.stockTransfer.sendingLocationId) {
                pageHelper.notification.showPersistent("Receiving and sending locations cannot be the same location.");
                $scope.receivingLocationValid = false;
                $scope.sendingLocationValid = false;
            } else if ($scope.stockTransfer.receivingLocationId && $scope.stockTransfer.receivingLocationId === $scope.stockTransfer.viaLocationId) {
                pageHelper.notification.showPersistent("Receiving and via locations cannot be the same location.");
                $scope.receivingLocationValid = false;
                $scope.viaLocationValid = false;
            } else if ($scope.stockTransfer.sendingLocationId && $scope.stockTransfer.sendingLocationId === $scope.stockTransfer.viaLocationId) {
                pageHelper.notification.showPersistent("Sending and via locations cannot be the same location.");
                $scope.sendingLocationValid = false;
                $scope.viaLocationValid = false;
            }

            if (!$scope.stockTransfer.sendingLocationId) {
                $scope.sendingLocationValid = false;
            }
            if (!$scope.stockTransfer.receivingLocationId) {
                $scope.receivingLocationValid = false;
            }
        }

        function locationsValid() {
            return $scope.stockTransfer === null ||
            ($scope.stockTransfer.receivingLocationId !== $scope.stockTransfer.sendingLocationId &&
                $scope.stockTransfer.sendingLocationId !== $scope.stockTransfer.viaLocationId &&
                $scope.stockTransfer.receivingLocationId !== $scope.stockTransfer.viaLocationId);
        }

        function canSave() {
            return $scope.editing && !$scope.saving && $scope.hasEditPermission && $scope.stockTransfer.products.length > 0 && locationsValid();
        }

        function canAddComments() {
            return $scope.hasEditPermission && !$scope.saving;
        }

        function canEdit() {
            return $scope.stockTransfer && $scope.stockTransfer.products.length === 0;
        }

        function canEditProduct() {
            return $scope.stockTransfer &&
                $scope.stockTransfer.receivingLocationId > 0 &&
                $scope.stockTransfer.sendingLocationId > 0 &&
                locationsValid();
        }  

        function canAddProduct(form) {
            return canEditProduct(form) &&
                form.$valid;
        }

        function isCreated() {
            return $scope.stockTransfer.id > 0;
        }

        function canPrint() {
            return isCreated() && $scope.hasEditPermission;
        }

        function printStockSheet() {
            if (!canPrint) {
                return;
            }
            url.open('/Merchandising/StockTransfer/PrintStockSheet/' + $scope.stockTransfer.id);
        }

        function printTransferNote() {
            if (!canPrint) {
                return;
            }
            url.open('/Merchandising/StockTransfer/PrintTransferNote/' + $scope.stockTransfer.id);
        }

        function newTransfer() {
            url.go('/Merchandising/StockTransfer/New');
        }

        function showProducts() {
            return $scope.stockTransfer.products.length > 0;
        }

        function addProduct(product, form) {

            if (!canAddProduct(form))
                return;
            
            if ($scope.stockTransfer.receivingLocationId === $scope.stockTransfer.sendingLocationId) {
                pageHelper.notification.show("Sending location and receiving location are the same.");
                return;
            }
            
            if (product.productId > 0) {
                $scope.stockTransfer.products.push(product);
                $scope.newProduct = {};
                $('#quantity').tooltip('disable');
            }
        }

        function updateTitle(stockTransfer) {
            pageHelper.setTitle(stockTransfer.id ? 'Stock Transfer #' + stockTransfer.id : 'Create Stock Transfer');
        }

        function save() {
            $scope.saving = true;

            transferRepo.save($scope.stockTransfer)
                .then(function(adj) {
                    $scope.saving = false;
                    $scope.editing = false;
                    $scope.stockTransfer = adj;
                    updateTitle(adj);
                    $location.path(url.resolve('Merchandising/StockTransfer/Detail/' + adj.id));
                    pageHelper.notification.show("Stock transfer saved.");
                }, function(err) {
                    $scope.saving = false;
                    if (err && err.message) {
                        pageHelper.notification.showPersistent(err.message);
                    }
                });
        }

        function removeProduct(index) {
            $scope.stockTransfer.products.splice(index, 1);
        }

        function productSearchSetup() {
            return {
                placeholder: "Enter a product",
                width: '100%',
                minimumInputLength: 2,
                ajax: {
                    url: url.resolve('Merchandising/Products/SearchStockProducts'),
                    dataType: 'json',
                    data: function(term) {
                        return {
                            q: term,
                            rows: 10,
                            locationId: $scope.stockTransfer.sendingLocationId
                        };
                    },
                    results: function(result) {
                        return {
                            results: _.map(result.data, function(doc) {
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
                formatResult: function(data) {
                    return "<table class='WarrantyResults'><tr><td><b> " + data.sku + " </b></td><td> : </td><td> " + data.description + "</td></tr></table>";
                },
                formatSelection: function(data) {
                    return data.sku;
                },
                dropdownCssClass: "productResults",
                escapeMarkup: function(m) {
                    return m;
                }
            };
        }

        function checkLocationsValid() {
            if (!locationsValid()) {
                    pageHelper.notification.showPersistent("Receiving, Sending and Via Locations must be unique.");
            }
        }

        function lineCost(product) {
            return product.quantity * product.averageWeightedCost;
        }

        function totalLineCost() {
            if ($scope.stockTransfer.products.length > 0) {
                return _.reduce($scope.stockTransfer.products, function(sum, el) {
                    return sum + (el.averageWeightedCost * el.quantity);
                }, 0);
            }
            return 0;
        }

        function checkQuantity() {
            var tooltip = ($scope.stockTransfer && $scope.newProduct.quantity > $scope.amount) ?
                'Please note that the entered quantity exceeds the current stock on hand at this sending location (' + $scope.amount + ' on hand).' :
                $scope.newProduct.quantity < 1 || $scope.newProduct.quantity > 20000 ? defaultTooltip : '';

            if (tooltip !== '') {
                $('#quantity').attr('data-original-title', tooltip);
                $('#quantity').tooltip({ trigger: 'focus' }).tooltip('enable').tooltip('show');
            } else {
                $('#quantity').tooltip('enable').tooltip('hide');
            }
        }

        function updateQuantityTooltip() {
            if ($scope.newProduct) {
                productResourceProvider.availability($scope.newProduct.productId, $scope.stockTransfer.sendingLocationId)
                    .then(function(amount) {
                        $scope.amount = amount;
                    });
            }
        }

        function getSearchParams() {
            return {
                locationId: $scope.stockTransfer.sendingLocationId
            };
        }

        function processSearchResult(searchResult) {
            if (searchResult) {
                $scope.newProduct = searchResult;
                updateQuantityTooltip();
            }
        }
       
        $scope.$watch('vm', function (vm) {
            $scope.stockTransfer = vm || {};

            if (vm.id > 0)
                $scope.editing = false;

            locationResourceProvider.getList().then(function (locations) {
                $scope.locations = locations;
            });
            
            updateTitle(vm);
            validateLocation();
        });

        $scope.resolve = url.resolve;
        $scope.canAddComments = canAddComments;
        $scope.canEdit = canEdit;
        $scope.canPrint = canPrint;
        $scope.printStockSheet = printStockSheet;
        $scope.printTransferNote = printTransferNote;
        $scope.canEditProduct = canEditProduct;
        $scope.canAddProduct = canAddProduct;
        $scope.canSave = canSave;
        $scope.addProduct = addProduct;
        $scope.removeProduct = removeProduct;
        $scope.productSearchSetup = productSearchSetup;
        $scope.processSearchResult = processSearchResult;
        $scope.showProducts = showProducts;
        $scope.isCreated = isCreated;
        $scope.save = save;
        $scope.lineCost = lineCost;
        $scope.totalLineCost = totalLineCost;
        $scope.updateQuantityTooltip = updateQuantityTooltip;
        $scope.checkQuantity = checkQuantity;
        $scope.checkLocationsValid = checkLocationsValid;
        $scope.validateLocation = validateLocation;
        $scope.getSearchParams = getSearchParams;
        $scope.newTransfer = newTransfer;
    };
});
