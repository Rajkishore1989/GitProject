define([
    'angular'
],
function (angular) {
    'use strict';
    return function(dateHelper) {
        return {
            require: 'ngModel',
            restrict: 'A',
            link: function (scope, elem, attrs, ctrl) {
                function setValidity(key, value) {
                    ctrl.$setValidity(key, value);
                }

                function toView(val) {
                    return val;
                }

                function toModel(val) {
                    var isValid = dateHelper.validDate(val);
                    setValidity('date-format', isValid);

                    if (!isValid) {
                        return null;
                    }
                    return dateHelper.toUtcDateTime(val);
                }

                ctrl.$formatters.unshift(toView);
                ctrl.$parsers.unshift(toModel);
            }
        };
    };
});