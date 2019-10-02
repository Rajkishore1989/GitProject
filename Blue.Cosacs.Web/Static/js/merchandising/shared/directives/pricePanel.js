define([
        'angular',
        'underscore',
        'url'
    ],
    function (angular, _, url) {
    'use strict';
    return function (pageHelper) {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                    'standardPrice': '@',
                    'priceModel': '=',
                    'panelTitle': '@',
                    'components': '=',
                    'total': '=',
                    'totalIncTax': '=',
                    'avgTax': '=',
                    'adjustedTotal': '=',
                    'isEditing': '=',
                    'showMargin': '=',
                    'isCombo': '='
            },
            templateUrl:
                url.resolve('/Static/js/merchandising/shared/templates/price-panel.html'),
            link: function (scope) {

                scope.withTax = function (amt, tax) {
                    return (1 + tax) * amt;
                };

                scope.$watch('isCombo', function (isCombo) { 
                    scope.type = isCombo ? "Combo" : "Set";
                });
            }
        };
    };
});