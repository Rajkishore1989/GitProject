define([
    'angular',  
    'moment'
],
function (angular, moment) {
    'use strict';

    return function() {
        var that = this;

        //function toLocalDateTime(val) {
        //    if (!val || !val.length) {
        //        return null;
        //    }
        //    return moment(val).local().format();
        //}

        function validDate(val) {
            var dateTime = moment(val);

            return dateTime.isValid();            
        }

        //function toUtcDateTime(val) {
        //
        //    var dateTime = moment(val);
        //
        //    return dateTime.utc().format();
        //}

        // that.toLocalDateTime = toLocalDateTime;
       // that.toUtcDateTime = toUtcDateTime;
        that.validDate = validDate;

    };
});