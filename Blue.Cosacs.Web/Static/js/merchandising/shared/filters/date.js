define(['underscore', 'moment'],
function (_, moment) {
    'use strict';

    return function (pageHelper, $filter) {
        var format = pageHelper.localisation.dateFormat;

        var convertDate = function (text,timeZoneAgnostic ) {
            if (!text) {
                return '';
            }

            //if (text.slice(-1) === 'Z' && !timeZoneAgnostic) {// Solr Hack. All datetime with Z are automatically UTC so just splice date. (Stored as Date in database and indexed)
            //    return moment(text.slice(0,10)).format();
            //}

            if (timeZoneAgnostic) {
                return moment.utc(text).local().format();// For datetimes stored as UTC in DB. (Stored as datetime in database maybe from solr or not)
            } else {
                return moment(text.slice(0,10)).format();  // Dates stored as just date without time.
            }

        };

        return function (text, timeZoneAgnostic) {
            return text === '0001-01-01T00:00:00' ? '' : $filter('date')(convertDate(text, timeZoneAgnostic), format);
        };
    };
});
