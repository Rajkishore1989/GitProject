define(['underscore', 'url'],
    function (_, url) {
        'use strict';

        return function () {
            return function (s) {
                s = (s === undefined || s === null) ? '' : s;

                return url.resolve(s);
            };
        };
    });
