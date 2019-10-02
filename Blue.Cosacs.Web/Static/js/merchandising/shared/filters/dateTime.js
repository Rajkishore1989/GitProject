define(['underscore'],
function (_) {
    'use strict';

    return function (pageHelper, $filter) {
        var format = pageHelper.localisation.dateFormat + ' h:mm a';

        return function (text) {
            return $filter('date')(text, format);
        };
    };
});
