define(['underscore'],
function (_) {
    'use strict';

    return function () {

        var convertRatioToPercentage = function (val, decimalPlaces) {
            return +(val * 100).toFixed(decimalPlaces || 2);
        };

        return function (text, defaultText, zeroText, decimalPlaces) {
            var val = Number.parseFloat(text);

            if (isNaN(val) || val === Infinity || val === -Infinity) {
                if (defaultText) {
                    return defaultText;
                }
                val = null;
            } else if (zeroText && val === 0) {
                return zeroText;
            }

            return convertRatioToPercentage(val, decimalPlaces) + '%';
        };
    };
});
