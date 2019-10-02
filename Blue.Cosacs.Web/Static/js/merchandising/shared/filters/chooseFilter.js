define(['underscore'],
function (_) {
    'use strict';

    return function ($filter, pbCurrencyFilter, pbPercentageFilter) {
        return function (value, type) {
            if (type === "Currency") {
                return pbCurrencyFilter(value);
            }
            if (type === "Percentage") {
                return pbPercentageFilter(value);
            }
            return value;
        };
    };
});
