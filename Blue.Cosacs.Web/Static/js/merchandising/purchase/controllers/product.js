define([
    'angular',
    'underscore',
    'url',
    'jquery',
    'lib/select2',    
    'datepicker'
],
    function (angular, _, url, $) {
        'use strict';
        return function ($scope, $timeout, pageHelper) {
            var beforeEditClone = {};

            function searchProducts(product) {
                return {
                    placeholder: product.sku || "Enter a product",
                    minimumInputLength: 2,
                    ajax: {
                        url: url.resolve('Merchandising/Products/PurchaseProductSearch'),
                        dataType: 'json',
                        data: function(term) {
                            return {
                                q: term,
                                rows: 10,
                                vendorId: $scope.purchase.vendorId,
                                locationId: $scope.purchase.receivingLocationId
                            };
                        },
                        results: function(result) {
                            return {
                                results: _.map(result.data, function(doc) {
                                    return {
                                        sku: doc.sku,
                                        description: doc.longDescription,
                                        productId: doc.productId,
                                        unitCost: doc.unitCost,
                                        vendorCurrency: doc.vendorCurrency,
                                        quantityOnOrder: doc.quantityOnOrder,
                                        labelRequired: doc.labelRequired
                                    };
                                })
                            };
                        }
                    },
                    formatResult: function(data) {
                        return "<table><tr><td><b> " + data.sku + " </b></td><td> : </td><td> " + data.description + "</td></tr></table>";
                    },
                    formatSelection: function(data) {
                        return data.sku;
                    },
                    dropdownCssClass: "productResults",
                    escapeMarkup:
                        function(m) {
                            return m;
                        },
                    id: function(data) {
                        return data.sku;
                    }
                };
            }

            $scope.processSearchResult = function(searchResult) {
                if (searchResult) {
                    if (searchResult.vendorCurrency === $scope.purchase.vendor.currency) {
                        $scope.product.unitCost = searchResult.unitCost;
                        $scope.product.productId = searchResult.productId;
                        $scope.product.sku = searchResult.sku;
                        $scope.product.description = searchResult.description;
                        $scope.product.quantityOnOrder = searchResult.quantityOnOrder;
                        $scope.product.labelRequired = searchResult.labelRequired;
                    } else {
                        pageHelper.notification.showPersistent("The selected product's cost price currency does not match the selected vendor currency. Please update either the vendor currency or the product cost price currency to make them match.");
                    }
                }
            };

            function initializeEditMode(product) {
                $scope.editing = false;
                if (!product.productId) {
                    edit();
                }
            }

            function validateSku(products, form) {
                var tooShort = $scope.product.sku.length < 1;
                form.sku.$setValidity('min-length', !tooShort);
                form.sku.$setValidity('sku-exists', true);
            }

            function canEdit() {
                return !$scope.readonly && !$scope.editing && !$scope.saving && $scope.$parent.editing;
            }

            function canAccept(form, products) {
                if (form.sku) {
                    validateSku(products, form);
                }
                return !$scope.readonly && form.$valid && $scope.editing && !$scope.saving;
            }

            function canCancel() {
                return !$scope.readonly && $scope.editing && !$scope.saving;
            }

            function canRemove() {
                return canEdit() && $scope.mode === 'create' && $scope.$parent.editing;
            }

            function edit() {
                if (!canEdit()) {
                    return;
                }

                beforeEditClone = angular.copy($scope.product);

                setEditing(true);
            }

            function accept(form, products, product) {
                if (!canAccept(form, product)) {
                    return;
                }
                setEditing(false);
            }

            function cancel(idx) {
                if (!canCancel) {
                    return;
                }
                if (!beforeEditClone.sku) {
                    $scope.removeProduct(idx);
                } else {
                    $scope.product = beforeEditClone;
                }
                setEditing(false);
            }

            function setEditing(value) {
                $scope.editing = value;
                $scope.$parent.$parent.editingProduct = value;
            }

            function canCancelProduct(product) {
                return product.quantityOrdered - product.totalQuantityReceived - product.quantityCancelled > 0;
            }

            function cancelProduct(poProduct) {
                $scope.$parent.cancelProduct(poProduct);
            }

            $scope.$on('purchaseOrderDateChange', function(event, date) {
                $scope.product.requestedDeliveryDate = $scope.product.requestedDeliveryDate || date;
            });

            $timeout(function () {
                // current jqueryui datepicker directive doesnt support setting mindate
                $('.itemRequestedDate').datepicker('option', 'minDate', new Date());
            }, 0);

            initializeEditMode($scope.product);

            $scope.searchProducts = searchProducts;
            $scope.canEdit = canEdit;
            $scope.canAccept = canAccept;
            $scope.canCancel = canCancel;
            $scope.canRemove = canRemove;
            $scope.edit = edit;
            $scope.accept = accept;
            $scope.cancel = cancel;
            $scope.canCancelProduct = canCancelProduct;
            $scope.cancelProduct = cancelProduct;
        };
    });
