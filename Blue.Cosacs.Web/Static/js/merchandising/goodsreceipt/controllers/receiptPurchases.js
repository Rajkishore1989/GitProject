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
        return function ($scope) {
            var beforeEditClone = {};

            function initializeEditMode(product) {
                $scope.editing = false;
                if (!product.productId) {
                    edit();
                }
            }

            function canEdit() {
                return !$scope.readonly && !$scope.editing && !$scope.saving && $scope.$parent.editing;
            }

            function canAccept(form) {
                return !$scope.readonly && form.$valid && $scope.editing && !$scope.saving;
            }

            function canCancel() {
                return !$scope.readonly && $scope.editing && !$scope.saving;
            }

            function edit() {
                if (!canEdit()) {
                    return;
                }

                beforeEditClone = angular.copy($scope.product);

                setEditing(true);
            }

            function cancel() {
                if (!canCancel) {
                    return;
                }

                $scope.product = beforeEditClone;
                setEditing(false);
            }

            function enableBackOrderCancel() {
                return $scope.$parent.$parent.receipt.enableBackOrderCancel;
            }

            function quantityChange(product, form) {
                var quantityChanged = (product.quantityReceived || 0) + (product.quantityCancelled || 0);
                product.quantityCancelled = product.quantityCancelled || 0;
                product.quantityBackOrdered = product.quantityPending - quantityChanged;

                if (product.quantityBackOrdered < 0) {
                    form.quantityReceived.$setValidity('quantity', false);
                    form.quantityCancelled.$setValidity('quantity', !enableBackOrderCancel() || false);
                    
                } else {
                    form.quantityReceived.$setValidity('quantity', true);
                    form.quantityCancelled.$setValidity('quantity', true);
                }

                if (product.quantityCancelled < 1) {
                    $scope.product.reasonForCancellation = '';
                }
            }

            function accept(form, products, product) {
                if (!canAccept(form, product)) {
                    return;
                }
                setEditing(false);
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
            $scope.cancel = cancel;
            $scope.quantityChange = quantityChange;
            $scope.enableBackOrderCancel = enableBackOrderCancel;
        };
    });
