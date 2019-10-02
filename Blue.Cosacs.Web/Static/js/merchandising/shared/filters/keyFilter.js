define(['underscore'],
function (_) {
    'use strict';

    return function () {
        return function (object, keyFilter) {
            var result = {};
            _.each(object, function(v, k) {
                if ((new RegExp(keyFilter, 'i')).test(k)) {
                    result[k] = v;
                }
            });
            return result;
        };
    };
});
