define([
    'angular',
    'underscore',
    'url'],

function (angular, _, url) {
    'use strict';

    return function ($scope) {
        var editing = false,
            readonly = $scope.isReadonly(),
            beforeEditClone = {};

        function searchProducts(component) {
            return {
                placeholder: component.sku || "Enter a product",
                minimumInputLength: 2,
                ajax: {
                    url: url.resolve('Merchandising/Products/SelectSearch'),
                    dataType: 'json',
                    data: function (term) {
                        return {
                            q: term,
                            rows: 10
                        };
                    },
                    results: function (data) {
                        return {
                            results: _.map(data.response.docs, function (doc) {
                                $scope.component.productId = doc.ProductId;
                                $scope.component.sku = doc.Sku;
                                $scope.component.longDescription = doc.LongDescription;
                                return {
                                    sku: doc.Sku,
                                    longDescription: doc.LongDescription,
                                    productId: doc.ProductId
                                };
                            })
                        };
                    }
                },
                formatResult: function (data) {
                    return "<table><tr><td><b> " + data.sku + " </b></td><td> : </td><td> " + data.longDescription + "</td></tr></table>";
                },
                formatSelection: function (data) {
                    return data.sku;
                },
                dropdownCssClass: "productResults",
                escapeMarkup:
                    function (m) {
                        return m;
                    },
                id : function(data) {
                return data.sku;
                }
            };
        }

        function initializeSkuLookup(component) {
            $scope.$watch("component.product.id", function () {
                if (component.product) {
                    component.productId = component.product.productId;
                    component.sku = component.product.sku;
                    component.longDescription = component.product.longDescription;
                }
            });
        }

        function initializeEditMode(component) {
            if (!component.productId) {
                edit();
            }
        }

        function validateSku(components, form) {
            var exists = _.where(components, { sku: $scope.component.sku }).length > 1;
            form.sku.$setValidity('duplicate', !exists);
            var tooShort = $scope.component.sku.length < 1;
            form.sku.$setValidity('min-length', !tooShort);
            form.sku.$setValidity('sku-exists', true);
        }

        function canEdit() {
            return !readonly && !editing && !$scope.$parent.isEditing() && !$scope.$parent.isSaving();
        }

        function canAccept(form, components) {
            validateSku(components, form);
            return !readonly && form.$valid && editing && !$scope.$parent.isSaving();
        }

        function canCancel() {
            return !readonly && editing && !$scope.$parent.isSaving();
        }

        function canRemove() {
            return !readonly && canEdit() && !$scope.$parent.isSaving();
        }

        function edit() {
            if (!canEdit) {
                return;
            }
            beforeEditClone = angular.copy($scope.component);
            setEditing(true);
        }

        function accept(form, components, component) {
            if (!canAccept(form, components)) {
                return;
            }
            var sku = (form.sku.$viewValue === null ? component.sku : form.sku.$viewValue.sku);
            $scope.$parent.acceptComponent(component.comboProductId, sku, form.quantity.$viewValue);
            setEditing(false);
        }

        function cancel() {
            if (!canCancel) {
                return;
            }

            if (!beforeEditClone.sku) {
                $scope.$parent.cancelComponent($scope.component);
            } else {
                $scope.component = beforeEditClone;
            }

            setEditing(false);
        }

        function setEditing(value) {
            editing = value;
            $scope.$parent.setEditing(value);
        }

        function isEditing() {
            return editing;
        }

        function generateUrl(link) {
            return url.resolve(link);
        }

        initializeSkuLookup($scope.component);
        initializeEditMode($scope.component);

        $scope.searchProducts = searchProducts;
        $scope.canEdit = canEdit;
        $scope.canAccept = canAccept;
        $scope.canCancel = canCancel;
        $scope.canRemove = canRemove;
        $scope.edit = edit;
        $scope.accept = accept;
        $scope.cancel = cancel;
        $scope.isEditing = isEditing;
        $scope.generateUrl = generateUrl;
        $scope.product = {};
    };
});
