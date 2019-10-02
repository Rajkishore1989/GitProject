define([
    'angular',
    'underscore'],

function (angular, _) {
    'use strict';

    return function ($scope) {
        var editing = false,
            readonly = $scope.$parent.isReadonly(),
            beforeEditClone;

        function canEdit() {
            return !readonly && !editing && !$scope.$parent.isEditing() && !$scope.$parent.isSaving();
        }

        function canAccept(form) {
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
            beforeEditClone = angular.copy($scope.comboPrice);

            setEditing(true);
        }

        function fromModel(model) {
            _.each(model.prices, function(price, index) {
                $scope.modelPrices.cashPrice[price.productId] = price.cashPrice;
                $scope.modelPrices.regularPrice[price.productId] = price.regularPrice;
                $scope.modelPrices.dutyFreePrice[price.productId] = price.dutyFreePrice;
            });
            return $scope.modelPrices;
        }

        function toModel() {
            var result = {};
            for (var priceTypeList in $scope.modelPrices) {
                if ($scope.modelPrices.hasOwnProperty(priceTypeList)) {
                    var list = $scope.modelPrices[priceTypeList];
                    result[priceTypeList] = [];
                    for (var price in list) {
                        if (list.hasOwnProperty(price)) {
                            result[priceTypeList].push({ productId: price, price: list[price] });
                        }
                    }
                }
            }
            return result;
        }

        function accept(form) {
            if (!canAccept(form)) {
                return;
            }
           
            $scope.$parent.saveLocation($scope.comboPrice.fascia, $scope.comboPrice.locationId, toModel());
            setEditing(false);
        }

        function cancel() {
            if (!canCancel) {
                return;
            }

            $scope.comboPrice = beforeEditClone;
            setEditing(false);
        }

        function setEditing(value) {
            editing = value;
            $scope.$parent.setEditing(value);
        }

        function isEditing() {
            return editing;
        }

        function total(column) {
            return _.chain($scope.locationComponents)
                .map(function (p) { return p[column] * (_.isNumber(p.quantity) ? p.quantity : 0); })
                .reduce(function (m, c) { return m + parseFloat(c, 10); }, 0)
                .value() || 0;
        }
        
        function comboTotal(type) {
            var tot = 0;
            _.each($scope.locationComponents, function (locPrice) {
                if (typeof $scope.modelPrices[type] !== 'undefined') {
                    tot += (locPrice.quantity || 0) * ($scope.modelPrices[type][locPrice.productId] || 0);
                }
            });
            return tot;
        }

        function totalIncTax(column) {
            return _.chain($scope.locationComponents)
                .map(function (p) { return ((p[column] * (1 + p.taxRate)) * (_.isNumber(p.quantity) ? p.quantity : 0)); })
                .reduce(function (m, c) { return m + parseFloat(c, 10); }, 0)
                .value() || 0;
        }

        function comboTotalIncTax(type) {
            var tot = 0;
            _.each($scope.locationComponents, function (locPrice) {
                if (typeof $scope.modelPrices[type] !== 'undefined') {
                    tot += (locPrice.quantity || 0) * ($scope.modelPrices[type][locPrice.productId] || 0) * (1 + locPrice.taxRate);
                }
            });
            return tot;
        }

        function avgTax(column) {

            var totes = total(column);
            var totalInc = totalIncTax(column);
            return (totalInc - totes) / totes;
        }

        function comboAvgTax(column) {

            var totes = comboTotal(column);
            var totalInc = comboTotalIncTax(column);
            return (totalInc - totes) / totes;
        }
        
        $scope.locationComponents = $scope.$parent.components($scope.comboPrice);

        $scope.total = total;
        $scope.canEdit = canEdit;
        $scope.canAccept = canAccept;
        $scope.canCancel = canCancel;
        $scope.canRemove = canRemove;
        $scope.edit = edit;
        $scope.accept = accept;
        $scope.cancel = cancel;
        $scope.isEditing = isEditing;
        $scope.comboTotal = comboTotal;
        $scope.comboTotalIncTax = comboTotalIncTax;
        $scope.totalIncTax = totalIncTax;
        $scope.avgTax = avgTax;
        $scope.comboAvgTax = comboAvgTax;
        $scope.modelPrices = {
            cashPrice: [],
            regularPrice: [],
            dutyFreePrice: []
        };

        $scope.$watch('comboPrice', function (cp) {
            $scope.modelPrices = fromModel(cp);
        });
    };
});
