define([
    'angular',
    'underscore'
],
function (angular, _) {
    'use strict';
    return function (pageHelper) {
        return {
            require: 'ngModel',
            restrict: 'A',
            link: function (scope, elem, attrs, ctrl) {
                var prevVal,
                    min = pageHelper.coallesceNumbers(scope.$parent.$eval(attrs.ngMin), attrs.min),
                    max = pageHelper.coallesceNumbers(scope.$parent.$eval(attrs.ngMax), attrs.max),
                    required = attrs.hasOwnProperty('ngRequired') || attrs.hasOwnProperty('required');

                if (min) {
                    min = min / 100;
                }

                if (max) {
                    max = max / 100;
                }

                function convertRatioToPercentage(val) {
                    return val ? + (val * 100).toFixed(2) : val;
                }

                function convertPercentageToRatio(val) {
                    return val / 100;
                }

                function setValidity(key, value) {
                    ctrl.$setValidity(key, value);
                }

                function isNumber(val) {
                    return _.isNumber(val) && !isNaN(val);
                }

                function rangeCheck(num) {
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
                }

                function toView(model) {
                    return convertRatioToPercentage(model);
                }

                function toModel(val) {
                    var model;
                    var pos = pageHelper.getCaretPosition(elem);

                    if (val !== 0 && !val) {
                        setValidity('required', !required);
                        return null;
                    } else {
                        setValidity('required', true);
                    }

                    // allow user to enter a minus by itself but
                    // keep the value null until a number is entered
                    if (val === '-') {
                        return null;
                    }

                    model = convertPercentageToRatio(Number.parseFloat(val));

                    setValidity('percentage', isNumber(model));
                    rangeCheck(model);

                    if (isNaN(model)) {
                        model = null;
                    }

                    if (val !== prevVal) {
                        if (val && (val.toString().match(/\./g) || []).length > 1) {
                            ctrl.$setViewValue(prevVal);
                        } else if (/\.$/.test(val)) {
                            prevVal = val;
                            ctrl.$setViewValue(model === null ? '.' : model + '.');
                        } else {
                            prevVal = val;
                            ctrl.$setViewValue(convertRatioToPercentage(model));
                        }
                        ctrl.$render();
                        pageHelper.setCaretPosition(elem, pos);
                    }

                    return model;
                }

                elem.bind('keypress', function (event) {
                    if (event.keyCode === 32) {
                        event.preventDefault();
                    }
                });

                ctrl.$formatters.unshift(toView);
                ctrl.$parsers.push(toModel);
            }
        };
    };
});