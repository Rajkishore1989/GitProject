define([
    'angular',
    'underscore',
    'url',
    'lib/select2',
    'jquery',
    'datepicker'
],
    function (angular, _, url) {
        'use strict';
        return function ($scope, pageHelper) {
            var beforeEditClone = {};

            function initializeEditMode(product) {
                $scope.editing = false;
                if (!product.productId) {
                    edit();
                }
            }

            function searchProducts(product) {
                return {
                    placeholder: product.sku || "Enter a product",
                    minimumInputLength: 2,
                    ajax: {
                        url: url.resolve('Merchandising/Products/PurchaseProductSearch'),
                        dataType: 'json',
                        data: function (term) {
                            return {
                                q: term,
                                rows: 10,
                                type: "SparePart",
                                vendorId: $scope.receipt.vendorId,
                                locationId: $scope.receipt.locationId
                        };
                        },
                        results: function (result) {
                            return {
                                results: _.map(result.data, function (doc) {
                                    return {
                                        sku: doc.sku,
                                        description: doc.longDescription,
                                        productId: doc.productId,
                                        unitLandedCost: doc.unitLandedCost,
                                        vendorCurrency: doc.vendorCurrency,
                                        quantityOnOrder: doc.quantityOnOrder
                                    };
                                })
                            };
                        }
                    },
                    formatResult: function (data) {
                        return "<table><tr><td><b> " + data.sku + " </b></td><td> : </td><td> " + data.description + "</td></tr></table>";
                    },
                    formatSelection: function (data) {
                        return data.sku;
                    },
                    dropdownCssClass: "productResults",
                    escapeMarkup:
                        function (m) {
                            return m;
                        },
                    id: function (data) {
                        return data.sku;
                    }
                };
            }

            function processSearchResult(searchResult) {
                $scope.resultValid = false;
                if (searchResult) {
                    if (searchResult.vendorCurrency === $scope.receipt.vendor.currency) {
                        if (_.all($scope.$parent.$parent.receipt.products, function (prod) { return prod.productId !== searchResult.productId; })) {
                            $scope.resultValid = true;
                            $scope.product.unitLandedCost = searchResult.unitLandedCost;
                            $scope.product.productId = searchResult.productId;
                            $scope.product.sku = searchResult.sku;
                            $scope.product.description = searchResult.description;
                            $scope.product.quantityOnOrder = searchResult.quantityOnOrder;
                        } else {
                            pageHelper.notification.show("Product already added.");
                        }
                    } else {
                        pageHelper.notification.showPersistent("The selected product's cost price currency does not match the selected vendor currency. Please update either the vendor currency or the product cost price currency to make them match.");
                    }
                }
            }

            function canAccept(form) {
                return !$scope.readonly && form.$valid && $scope.editing && !$scope.saving && $scope.resultValid;
            }

            function canEdit() {
                return !$scope.readonly && !$scope.editing && !$scope.saving && $scope.$parent.editing &&
                    !(!$scope.editing && $scope.$parent.$parent.adding && $scope.product.productId !== 0);
            }

            function canCancel() {
                return !$scope.readonly && $scope.editing && !$scope.saving;
            }

            function canRemove() {
                return $scope.receipt.products.length > 0 && !$scope.editing && !$scope.saving &&
                    !(!$scope.editing && $scope.$parent.$parent.adding && $scope.product.productId !== 0);
            }

            function edit() {

                if ($scope.$parent.$parent.adding && $scope.product.productId !== 0) {
                    setEditing(false);
                    return;
                }

                beforeEditClone = angular.copy($scope.product);
                setEditing(true);
            }

            function cancel(idx) {

                if (!canCancel) {
                    return;
                } else {
                    if (beforeEditClone.productId === 0) {
                        $scope.$parent.$parent.adding = false;
                        $scope.$parent.$parent.remove(idx);
                    }
                    else
                    {
                        $scope.product = beforeEditClone;
                    }
                }
                setEditing(false);
            }

            function calculateBackOrder(product) {
                product.quantityBackOrdered = product.quantityOrdered - product.quantityReceived;
            }

            function accept(form, products, product) {
                if (!canAccept(form, product)) {
                    return;
                }
                $scope.$parent.$parent.adding = false;
                setEditing(false);
            }

            function cancelledQuantity(product) {
                if (product.quantityReceived !== null &&
                    product.quantityReceived !== undefined &&
                    product.quantityBackOrdered !== null &&
                    product.quantityBackOrdered !== undefined) {
                    return product.quantityOrdered - product.quantityReceived - product.quantityBackOrdered;
                }
                return 0;
            }

            function setEditing(value) {
                $scope.editing = value;
                $scope.$parent.$parent.editingProduct = value;
            }

            initializeEditMode($scope.product);
            
            $scope.canEdit = canEdit;
            $scope.canAccept = canAccept;
            $scope.canCancel = canCancel;
            $scope.edit = edit;
            $scope.accept = accept;
            $scope.cancelledQuantity = cancelledQuantity;
            $scope.cancel = cancel;
            $scope.searchProducts = searchProducts;
            $scope.calculateBackOrder = calculateBackOrder;
            $scope.processSearchResult = processSearchResult;
            $scope.canRemove = canRemove;
        };
    });
