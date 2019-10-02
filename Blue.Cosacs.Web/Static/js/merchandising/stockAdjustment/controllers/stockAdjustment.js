define([
    'angular',
    'jquery',
    'underscore',
    'url',
    'lib/bootstrap/tooltip'],

function (angular, $, _, url, t) {
    'use strict';

    return function ($scope, $location, pageHelper, user, adjustmentRepo, locationResourceProvider, $timeout) {
        $scope.editing = true;
        $scope.saving = false;
        $scope.hasEditPermission = user.hasPermission("StockAdjustmentEdit");

        function canSave() {
            return $scope.editing && !$scope.saving && $scope.hasEditPermission && $scope.adjustment.products.length > 0 && !isApproved();
        }

        function canAddComments() {
            return $scope.hasEditPermission && !$scope.saving && !isApproved();
        }

        function canEdit() {
            return $scope.adjustment && $scope.adjustment.products.length === 0;
        }

        function canEditProduct() {
            return $scope.adjustment &&
                $scope.adjustment.locationId > 0 &&
                $scope.adjustment.primaryReasonId > 0 &&
                $scope.adjustment.secondaryReasonId > 0;
        }  

        function canAddProduct(form) {
            return canEditProduct(form) &&
                form.$valid;
        }

        function isApproved() {
            return $scope.adjustment.authorisedDate;
        }

        function isCreated() {
            return $scope.adjustment.id > 0;
        }

        function canApprove() {
            return isCreated() && !isApproved() && $scope.hasEditPermission;
        }

        function canPrint() {
            return isCreated() && $scope.hasEditPermission;
        }

        function print() {
            if (!canPrint) {
                return;
            }
            url.open('/Merchandising/StockAdjustment/Print/' + $scope.adjustment.id);
        }

        function showProducts() {
            return $scope.adjustment.products.length > 0;
        }

        function addProduct(product, form) {

            if (!canAddProduct(form))
                return;
            if (product.quantity + product.stockOnHand < 0) {
                pageHelper.notification.show("Stock on hand for " + product.sku + " will be negative once adjustment is processed");
            }

            if (product.productId > 0) {
                //var existing = _.find($scope.adjustment.products, function(p) {
                //    return p.sku === product.sku;
                //});

                //if (!existing) {
                    $scope.adjustment.products.push(product);
                    $scope.newProduct = {};
                //} else {
                //    pageHelper.notification.showPersistent("Product has already been added.");
                //}
            }
        }

        function updateTitle(stockAdjustment) {
            pageHelper.setTitle(stockAdjustment.id ? 'Stock Adjustment #' + stockAdjustment.id : 'Create Stock Adjustment');
        }

        function save() {
            $scope.saving = true;

            adjustmentRepo.save($scope.adjustment)
                .then(function(adj) {
                    $scope.saving = false;
                    $scope.editing = false;
                    $scope.adjustment = adj;
                    updateTitle(adj);
                    $location.path(url.resolve('Merchandising/StockAdjustment/Detail/' + adj.id));
                    pageHelper.notification.show("Stock adjustment saved.");
                }, function(err) {
                    $scope.saving = false;
                    if (err && err.message) {
                        pageHelper.notification.showPersistent(err.message);
                    }
                });
        }

        function approve() {
            $scope.saving = true;
            adjustmentRepo.approve($scope.adjustment.id, $scope.adjustment.comments)
                .then(function (adj) {
                    $scope.adjustment.authorisedById = adj.authorisedById;
                    $scope.adjustment.authorisedDate = adj.authorisedDate;
                    $scope.saving = false;
                    pageHelper.notification.show("Stock adjustment approved.");
                }, function (err) {
                    $scope.saving = false;
                    if (err && err.message) {
                        pageHelper.notification.showPersistent(err.message);
                    }
                });
        }

        function removeProduct(index) {
            $scope.adjustment.products.splice(index, 1);
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
                            locationId: $scope.adjustment.locationId
                        };
                    },
                    results: function(result) {
                        return {
                            results: _.map(result.data, function(doc) {
                                return {
                                    sku: doc.sku,
                                    description: doc.longDescription,
                                    id: doc.productId,
                                    averageWeightedCost: doc.averageWeightedCost,
                                    stockOnHand: doc.stockOnHand
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

        function processSearchResult(searchResult) {
            if (searchResult) {
                $scope.newProduct.productId = searchResult.id;
                $scope.newProduct.description = searchResult.description;
                $scope.newProduct.sku = searchResult.sku;
                $scope.newProduct.averageWeightedCost = searchResult.averageWeightedCost;
                $scope.newProduct.stockOnHand = searchResult.stockOnHand;
            }
        }

        function lineCost(product) {
            return product.quantity * product.averageWeightedCost;
        }

        function totalLineCost() {
            if ($scope.adjustment.products.length > 0) {
                return _.reduce($scope.adjustment.products, function(sum, el) {
                    return sum + (el.averageWeightedCost * el.quantity);
                }, 0);
            }
            return 0;
        }

        function updateSecondaryReason(primaryId) {
            var prim = _.find($scope.reasons, function (r) {
                return r.id === primaryId;
            });

            if (prim) {
                $scope.secondaryReasons = _.map(prim.secondaryReasons, function (r) {
                    return { k: r.id, v: r.secondaryReason };
                });
            }
        }

       
        $scope.$watch('vm', function (vm) {
            $scope.adjustment = vm;

            if (vm.id > 0)
                $scope.editing = false;

            locationResourceProvider.getList().then(function (locations) {
                $scope.locations = locations;
            });

            adjustmentRepo.getReasons().then(function (reasons) {
                $scope.reasons = reasons;
                $scope.primaryReasons = _.map(reasons, function(r) {
                    return { k:r.id, v:r.primaryReason };
                });
            });

            updateTitle(vm);
        });

        $timeout(function () {
            $('[data-toggle="tooltip"]').tooltip();
        }, 0);
        
        $scope.resolve = url.resolve;
        $scope.canApprove = canApprove;
        $scope.canAddComments = canAddComments;
        $scope.canEdit = canEdit;
        $scope.canPrint = canPrint;
        $scope.print = print;
        $scope.canEditProduct = canEditProduct;
        $scope.canAddProduct = canAddProduct;
        $scope.canSave = canSave;
        $scope.addProduct = addProduct;
        $scope.removeProduct = removeProduct;
        $scope.productSearchSetup = productSearchSetup;
        $scope.processSearchResult = processSearchResult;
        $scope.showProducts = showProducts;
        $scope.approve = approve;
        $scope.isApproved = isApproved;
        $scope.isCreated = isCreated;
        $scope.save = save;
        $scope.lineCost = lineCost;
        $scope.totalLineCost = totalLineCost;
        $scope.updateSecondaryReason = updateSecondaryReason;
    };
});
