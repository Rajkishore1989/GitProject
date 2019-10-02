define(['angular', 'url'],
function (angular, url) {
    'use strict';
    return function () {
        return {
            restrict: 'E',
            scope: {
                taxExcluding: '=',
                taxRate: '='
            },
            templateUrl:
                url.resolve('/Static/js/merchandising/shared/templates/taxInput.html'),
            link: function (scope) {

                scope.localRate = 0;

                var withTax = function (amt) {
                    return (1 + scope.localRate) * amt;
                },
                withoutTax = function (amt) {
                    return amt / (1 + scope.localRate);
                };

                scope.$watch('taxRate', function (rate) {
                    scope.localRate = rate || 0;
                    scope.taxIncluding = withTax(scope.taxExcluding);
                });

                scope.updateTax = function (isIncluding) {
                    if (isIncluding) {
                        scope.taxExcluding = withoutTax(scope.taxIncluding);
                    } else {
                        scope.taxIncluding = withTax(scope.taxExcluding);
                    }
                };
            }
        };
    };
});