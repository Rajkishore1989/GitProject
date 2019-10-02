/* global define */
define(['jquery', 'underscore', 'moment', 'url', 'spa',  'jsonDateToMomentUtcFix', 'text!Booking/Templates/BookingHistory.htm', 'datepicker'],

function ($, _, moment, url, spa, jsonDateToMomentUtcFix, BookingHistoryTemplate) {
    "use strict";

    return {
        bookingExpand: function (event, data) {
            var pLink = 'Picking/Confirmation/';
            var DCLink = 'delivery/Confirmation/';
            var dLink = 'Bookings/detail/';
            var item = $(data.element);
            var doc = data.resultItem;
            var e = data.domEvent;

            function createLink(link, number, disptext, appendItem) {
                $('<a/>').attr('href', url.resolve('/Warehouse/' + link + number))
                    .attr('target', '_blank')
                    .attr('class', 'external-link')
                    .text(disptext)
                    .appendTo(appendItem);
            }

            var createdOn = moment(doc.CreatedOn);

            item.find('.ordered .date')
                .text(createdOn.fromNow())
                .attr('title', createdOn.format("dddd, MMMM Do YYYY, h:mm:ss a"))
                .end();

            if (!doc.PickedOn || _.isEmpty(doc.PickedOn.trim())) {
                item.find('.picked').text('');
            }
            if (!doc.CheckedBy || _.isEmpty(doc.CheckedBy.trim())) {
                item.find('.checked').text('');
            }
            if (!doc.ConfirmedOn || _.isEmpty(doc.ConfirmedOn.trim())) {
                item.find('.confirmed').text('');
            }

            if (e.target.tagName !== 'A') {
                var history = $(item).find('.bookingsHistory');
                if (history.length === 0) {
                    $.ajax({
                        url: url.resolve('/Warehouse/Bookings/History/' + doc.BookingNo),
                        success: function (hdoc) {
			                hdoc.jsonDateToMomentUtcFix = jsonDateToMomentUtcFix;
                            var $hdoc = $(_.template(BookingHistoryTemplate, hdoc));
                            if (hdoc.pickingID) {
                                createLink(pLink, hdoc.pickingID, 'Show PickList', $hdoc.find('.pickedLink'));
                            }
                            if (hdoc.ScheduleID) {
                                createLink(DCLink, hdoc.ScheduleID, 'Show Schedule', $hdoc.find('.scheduleLink'));
                            }
                            if (hdoc.OriginalId) {
                                createLink(dLink, hdoc.OriginalId, 'Show Parent', $hdoc.find('.exceptionLink'));
                            }
                            if (hdoc.ChildId) {
                                createLink(dLink, hdoc.ChildId, 'Show Child', $hdoc.find('.childLink'));
                            }
                            $(item).append($hdoc);
                            $(item).find('.bookingsHistory').slideDown('slow');
                        }
                    });
                } else if (history.css('display') === 'none') {
                    history.slideDown('slow');
                } else {
                    history.slideUp('slow');
                }
            }

            return item;
        }
    };
});
