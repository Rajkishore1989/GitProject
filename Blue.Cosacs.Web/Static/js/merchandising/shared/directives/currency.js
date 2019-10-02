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
                var prevText,
                    decimalPlaces = pageHelper.localisation.decimalPlaces,
                    required = attrs.hasOwnProperty('ngRequired') || attrs.hasOwnProperty('required');

                function setValidity(key, value) {
                    ctrl.$setValidity(key, value);
                }

                function isValid(val) {
                    var num = Number.parseFloat(val);
                    return val === '' || (
                        _.isNumber(num) &&
                        !isNaN(num) &&
                        ((val.match(/\./g) || []).length < decimalPlaces || decimalPlaces === 0)
                    );
                }

                function toView(model) {
                    if (angular.isNumber(model)) {
                        return pageHelper.paddedFloorLocal(model);
                    }
                    return null;
                }

                function cleanInput(text) {
                    var negStr;
                    if (!text && text !== 0) {
                        text = '';
                    }
                    text = text.toString();
                    negStr = text.indexOf('-') === 0 ? '-' : '';
                    if (decimalPlaces === 0) {
                        text = text.replace(/\./g, '');
                    }

                    // remove any character other than ['.', '0-9']
                    return (negStr + pageHelper.paddedFloorLocal(text.replace(/[^\.\d]+/g, '')));
                }

                function toModel(text) {
                    var val = cleanInput(text),
                        pos = pageHelper.getCaretPosition(elem);

                    // set required validity
                    if (required && val.length < 1) {
                        setValidity('required', false);
                    } else {
                        setValidity('required', true);
                    }

                    // allow user to enter a minus by itself but
                    // keep the value 0 until a number is entered
                    if (val === '-') {
                        return 0;
                    }

                    if (text !== prevText) {
                        if (!isValid(val)) {
                            val = prevText;
                        }
                        prevText = text;
                        ctrl.$setViewValue(pageHelper.paddedFloorLocal(val));
                        ctrl.$render();
                        pageHelper.setCaretPosition(elem, pos);
                    }

                    return val ? Number.parseFloat(val) : null;
                }

                elem.on('keypress', function (event) {
                    if (event.keyCode === 32) {
                        event.preventDefault();
                    }

                });

                elem.on('keydown', function (event) {
                    var text = elem.val();
                    if (event.keyCode === 190) {
                        pageHelper.setCaretPosition(elem, text.indexOf('.'));
                    }
                });

                elem.on('$destroy', function () {
                    elem.off('keypress');
                });

                ctrl.$formatters.unshift(toView);
                ctrl.$parsers.unshift(toModel);
            }
        };
    };
});