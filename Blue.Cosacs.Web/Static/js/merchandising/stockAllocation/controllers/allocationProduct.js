define([
    'angular',
    'underscore',
    'url',
    'lib/bootstrap/tooltip'],

function (angular, _, url, tooltip) {
    'use strict';

    return function ($scope) {
        var beforeEditClone = {};

        $scope.productSearch = 'Merchandising/Products/SearchStockProducts';

        function checkQuantity() {
            if ($scope.stockAllocation) {
                if ($scope.product.quantity < 1 || $scope.product.quantity > 20000) {
                    $('#quantity').tooltip({ trigger: 'focus' }).tooltip('enable').tooltip('show');
                } else {
                    $('#quantity').tooltip('disable').tooltip('hide');
                }
            }
        }

        function processSearchResult(searchResult) {
            if (searchResult) {
                $scope.product.productId = searchResult.id;
                $scope.product.description = searchResult.description;
                $scope.product.sku = searchResult.sku;
                $scope.product.stockAvailable = searchResult.stockAvailable;
                $scope.$parent.stockQtyAvailable[searchResult.sku] = searchResult.stockAvailable;
                $scope.product.averageWeightedCost = searchResult.averageWeightedCost;
            }
        }

        function clearProduct() {
            delete $scope.newProduct;
            delete $scope.product.productId;
            delete $scope.product.description;
            delete $scope.product.sku;
            delete $scope.product.stockAvailable;
            delete $scope.product.averageWeightedCost;
            delete $scope.product.quantity;
        }

        function getSearchParams() {
            return {
                locationId: $scope.stockAllocation.warehouseLocationId,
                storeTypeLocationId: $scope.product.receivingLocationId
            };
        }

        function mapSearchResult(source, dest) {
            dest.stockAvailable = source.stockOnHand + source.stockOnOrder;
            return dest;
        }


        function lineCost(product) {
            return product.quantity * product.averageWeightedCost;
        }

        function canEdit() {
            return !$scope.editing && $scope.$parent.canEditProduct() && $scope.$parent.canSave();
        }

        function setEditing(value) {
            $scope.editing = value;
            $scope.$parent.setEditing(value);
        }

        function validateSku(products, form) {
            var exists = _.where(products, { sku: $scope.sku, receivingLocationId: $scope.receivingLocationId }).length > 1;
            form.sku.$setValidity('duplicate', !exists);
            var tooShort = $scope.sku && $scope.sku.length < 1;
            form.sku.$setValidity('min-length', !tooShort);
            form.sku.$setValidity('sku-exists', true);
            form.receivingLocation.$setValidity('required', !!$scope.product.receivingLocationId);            
        }

        function setLocationValidity(form) {
            if (form) {
                form.receivingLocation.$setValidity('required', !!$scope.product.receivingLocationId);
                clearProduct();
            }
        }

        function canAccept(products, form) {
            validateSku(products, form);
            return form.$valid && $scope.editing;
        }

        function canCancel() {
            return $scope.editing && $scope.$parent.canSave();
        }

        function canRemove() {
            return canEdit();
        }

        function edit(form) {
            if (!canEdit()) {
                return;
            }

            setLocationValidity(form);
            beforeEditClone = angular.copy($scope.product);
            setEditing(true);
        }

        function accept(products, form) {

            if (!canAccept(products, form)) {
                return;
            }

            if ($scope.quantity > $scope.stockAvailable)
                $scope.quantity = $scope.stockAvailable;

            $scope.product.receivingLocation = $scope.$parent.locations[$scope.product.receivingLocationId];

            var success = $scope.$parent.saveProduct($scope.product, form);
            setEditing(!success);
        }

        function remove() {

            if (!canRemove()) {
                return;
            }
            $scope.$parent.removeProduct($scope.product);
            setEditing(false);
        }

        function isEditing() {
            return $scope.editing;
        }

        function cancel() {
            if (!canCancel) {
                return;
            }

            if (!beforeEditClone.sku) {
                $scope.$parent.removeProduct($scope.product);
            } else {
                $scope.product = beforeEditClone;
            }

            setEditing(false);
        }

        function initialise() {
            if ($scope.product.productId > 0) {
                setEditing(false);
            } else {
                $scope.index = ($scope.$parent.stockAllocation.products ? $scope.$parent.stockAllocation.products.length - 1 : 0);
                setEditing(true);
            }
        }

        initialise();

        $scope.editing = isEditing();
        $scope.processSearchResult = processSearchResult;
        $scope.canEdit = canEdit;
        $scope.canAccept = canAccept;
        $scope.canCancel = canCancel;
        $scope.canRemove = canRemove;
        $scope.remove = remove;
        $scope.edit = edit;
        $scope.accept = accept;
        $scope.cancel = cancel;
        $scope.isEditing = isEditing;
        $scope.lineCost = lineCost;
        $scope.checkQuantity = checkQuantity;
        $scope.getSearchParams = getSearchParams;
        $scope.mapSearchResult = mapSearchResult;
        $scope.setLocationValidity = setLocationValidity;
    };
});
