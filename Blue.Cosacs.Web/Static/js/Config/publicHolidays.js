/*global define */
define(['url', 'confirm', 'jquery', 'underscore', 'moment', 'datepicker'], function (url, confirm, $, _, moment) {
    'use strict';
    function onSelectPicker(selectedDate, picker) {
        if (indexBeDeleted(moment(selectedDate).format('YYYY-MM-DDT00:00:00')) !== -1)
        {
            return confirmDelete(function(){
                callServer(selectedDate);
            }, selectedDate);
        }

        return callServer(selectedDate);
    }

    function callServer(selectedDate){
        $.ajax({
            type: 'POST',
            url: url.resolve("/Config/PublicHolidays/AddRemoveDate"),
            data: { date: selectedDate },
            success: function (updated, textStatus, jqXHR) {
                refreshDates(selectedDate);
            }
        });
    }

    function indexBeDeleted(date){
        return _.indexOf(holidayList.publicHols, date);
    }

    function refreshDates(date) {
        var index;

        date = moment(date).format('YYYY-MM-DDT00:00:00');
        index = indexBeDeleted(date);

        if (index === -1) {
            holidayList.publicHols.push(date);
        }
        else{
            holidayList.publicHols.splice(index, 1);
        }

        loadForYear(currentDisplayedYear);
    }

    //Use template to list Public Holidays on the right hand side of the screen.
    var listDates = function (publicHols) {
        var list = "<% _.each(publicHols, function(day) { %><li class='list-group-item'>" +
            "<span class='col-lg-10'><%= day %></span>" +
            "<a class='ui-widget action-delete-date glyphicons bin' href='#' title='Delete Public Holiday'></a>" +
            "</li> <% }); %>";

        publicHols = _.map(publicHols, function (d) {
            return moment(d).format('MMM DD');
        });

        $('#dateDisplay').html('<ul class="list-group">' +
                                _.template(list, { 'publicHols': publicHols }) + '</ul>');
    };

    //Highlight Public Holidays on the date picker
    function highlightDays(date) {
        date = moment(date).format('YYYY-MM-DDT00:00:00');

        var isToday = (date == moment(new Date()).format('YYYY-MM-DDT00:00:00'));

        for (var i = 0; i < holidayList.publicHols.length; i++) {
            if (holidayList.publicHols[i] == date) {
                return [true, 'highlightDays', ''];
            }
        }
        
        if (isToday) {
            return [true, 'ui-state-highlight', ''];
        } else {
            return [true, '', ''];
        }
    }

    //Filter the Public Holidays for the year currently displayed
    function loadForYear(year) {
        currentDisplayedYear = year;

        var holidayListForYear = $.grep(holidayList.publicHols, function (date, i) {
            return (date.substring(0, 4) == year);
        });

        listDates(holidayListForYear.sort());

        var $picker = $('#yearDatePicker');
        $picker.datepicker("refresh");
        $picker.find('.ui-state-active').removeClass('ui-state-active');
    }

    var holidayList = {};
    var currentDisplayedYear = "";


    function confirmDelete(callBack, date){
        var message = 'Are you sure you want to remove the ' + moment(date).format('DD MMM of YYYY') + ' as Public Holiday?';

        return confirm(message, "Remove Public Holiday", function (ok) {
            if (ok) {
                callBack();
            }
        }, false, "Remove");
    }

    return {

        init: function ($el) {
            var $picker = $el.find('#yearDatePicker');

            holidayList = { 'publicHols': $el.find('#dateDisplay').data('dates') };

            currentDisplayedYear = new Date().getFullYear();

            $picker.datepicker({
                numberOfMonths: [3, 4],
                defaultDate: new Date(new Date().getFullYear(), 1 - 1, 1),
                stepMonths: 12,
                //hideIfNoPrevNext: true,
                gotoCurrent: true,
                beforeShowDay: highlightDays,
                onSelect: onSelectPicker,
                onChangeMonthYear: loadForYear
            });

            // deselect the first day (defaultDate) of the year and the current day (today)
            $picker.find('.ui-state-active').removeClass('ui-state-active');
            $picker.find('.ui-state-hover').removeClass('ui-state-hover');

            var date = $picker.datepicker("getDate");
            var year = date.getFullYear();

            var holidays = $.grep(holidayList.publicHols, function (date, i) {
                return (date.substring(0, 4) == year);
            });


            listDates(holidays);

            //Delete Public Holidays from the list on the right hand side of the screen
            $el.on('click', '.action-delete-date', function () {
                var dateToDelete = moment(($(this).parents('li').text() + " " + currentDisplayedYear)).format('YYYY-MM-DDT00:00:00');

                return confirmDelete(function(){
                    return $.post(url.resolve('/Config/PublicHolidays/AddRemoveDate'), {
                        date: dateToDelete
                    }, refreshDates(dateToDelete));
                }, dateToDelete);
            });
        }
    };
});
