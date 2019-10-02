define([
    'angular'
],
function (angular) {
    'use strict';
    return function (pageHelper) {
        return {
            require: 'ngModel',
            restrict: 'A',
            link: function (scope, element, attrs, ngModelCtrl) {
                var min = pageHelper.coallesceNumbers(scope.$parent.$eval(attrs.ngMin), attrs.min),
                    max = pageHelper.coallesceNumbers(scope.$parent.$eval(attrs.ngMax), attrs.max),
                    required = attrs.hasOwnProperty('ngRequired') || attrs.hasOwnProperty('required');

                if (!ngModelCtrl) {
                    return;
                }

                function setValidity(key, value) {
                    ngModelCtrl.$setValidity(key, value);
                }

                function toModel(val) {
                    var pos = pageHelper.getCaretPosition(element);
                    if (val !== 0 && !val) {
                        setValidity('required', !required);
                        return null;
                    } else {
                        setValidity('required', true);
                    }

                    if (val === '-') {
                        setValidity('integer', false);
                        return null;
                    } else {
                        setValidity('integer', true);
                    }

                    var num = Number.parseInt(val);

                    if (isNaN(num)) {
                        num = null;
                    }

                    if (min !== undefined && num !== null) {
                        setValidity('min', num >= min);
                    } else {
                        setValidity('min', true);
                    }

                    if (max !== undefined && num !== null) {
                        setValidity('max', num <= max);
                    } else {
                        setValidity('max', true);
                    }

                    if (val !== num) {
                        ngModelCtrl.$setViewValue(num);
                        ngModelCtrl.$render();
                        pageHelper.setCaretPosition(element, pos);
                    }
                    return num;
                }

                element.bind('keypress', function (event) {
                    if (event.keyCode === 32) {
                        event.preventDefault();
                    }
                });

                ngModelCtrl.$parsers.push(toModel);

                toModel(ngModelCtrl.$viewValue);
            }
        };
    };
});