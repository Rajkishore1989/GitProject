define(['underscore'],
function (_) {
    'use strict';

    return function (pageHelper) {
        var decimalPlaces = pageHelper.localisation.decimalPlaces,
            commaPattern = decimalPlaces > 0 ? /\B(?=(\d{3})+(?!\d)\.)/g : /\B(?=(\d{3})+(?!\d))/g;

        var numberWithCommas = function(x) {
            return x.toString().replace(commaPattern, ",");
        };

        return function (text, currency, blankZeros) {
            var num;

            num = parseFloat(text);

            if (!_.isNumber(num) || isNaN(num)) {
                num = 0;
            }

            if (blankZeros && num === 0) {
                return '';
            }

            currency = currency || pageHelper.localisation.currencySymbol;

            var sign = num < 0 ? '-' : '';
            return sign + currency + ' ' + numberWithCommas(pageHelper.roundLocal(Math.abs(num)));
        };
    };
});
