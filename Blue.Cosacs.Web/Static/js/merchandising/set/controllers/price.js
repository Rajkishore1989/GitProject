define([
    'angular',
    'underscore',
    'url'],

function (angular, _, url) {
    'use strict';

    return function ($scope) {
        var components = $scope.$parent.$parent.$parent.components();

        function getProduct() {
            $scope.price.product = _.find(components, function (component) {
                return component.productId === $scope.price.productId;
            });
        }

        function linePrice(value) {
            if (typeof value !== 'undefined') {
                return $scope.price.quantity * value;
            }
            return 0;
        }

        function margin(value) {
            return value === 0 ? 0 : (value - $scope.price.averageWeightedCost) / value;
        }

        function setItemPrice(setPrice, thisComponent, allComponents, priceField) {

            if (typeof thisComponent === 'undefined' ||
                thisComponent === null ||
                setPrice === null ||
                thisComponent.quantity === 0 ||
                thisComponent[priceField] === 0)
                return 0;

            var totalPrice = 0;
            _.each(allComponents, function (comp) {
                totalPrice += (comp[priceField] || 0) * (comp.quantity || 0);
            });

            var portion = thisComponent.quantity * thisComponent[priceField] / totalPrice;
            
            return (setPrice * portion / thisComponent.quantity);
        }

        function invalidPrice() {
            var prc = $scope.price[$scope.standardPrice];
            return prc === null || prc === 0;
        }

        function generateUrl(link) {
            return url.resolve(link);
        }

        getProduct();
        $scope.linePrice = linePrice;
        $scope.margin = margin;
        $scope.setItemPrice = setItemPrice;
        $scope.invalidPrice = invalidPrice;
        $scope.generateUrl = generateUrl;
    };
});
