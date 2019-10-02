/* global define */
define(['jquery', 'underscore', 'url', 'spa', 'moment', 'jsonDateToMomentUtcFix', 'text!Booking/Templates/BookingHistory.htm', 'jquery.pickList', 'datepicker'],
    function ($, _, url, spa, moment, jsonDateToMomentUtcFix, BookingHistoryTemplate, pickList) {
        "use strict";
        var pLink = 'Picking/Confirmation/',
        sLink = 'Delivery/Confirmation/';
        var dLink = 'Bookings/detail/';

        function createLink(link, number, disptext, appendItem) {
            $('<a/>').attr('href', url.resolve('/Warehouse/' + link + number))
                                 .attr('target', '_blank')
                                 .attr('class', 'external-link')
                                 .text(disptext)
                                 .appendTo(appendItem);
        }        

        function loadTracking($exception) {

            var main = $exception.parent().prev();
            var history = $exception.parent().prev().find('.bookingsHistory');
            if (history.length === 0) {
                $.ajax({
                    url: url.resolve('/Warehouse/Bookings/History/' + $exception.parent().prev().data("id")),
                    success: function (hdoc) {
                        hdoc.jsonDateToMomentUtcFix = jsonDateToMomentUtcFix;
                        var $hdoc = $(_.template(BookingHistoryTemplate, hdoc));
                        if (hdoc.pickingID) {
                            createLink(pLink, hdoc.pickingID, 'Show PickList', $hdoc.find('.pickedLink'));
                        }
                        if (hdoc.ScheduleID) {
                            createLink(sLink, hdoc.ScheduleID, 'Show Schedule', $hdoc.find('.scheduleLink'));
                        }
                        if (hdoc.OriginalId) {
                            createLink(dLink, hdoc.OriginalId, 'Show Parent', $hdoc.find('.exceptionLink'));
                        }
                        if (hdoc.ChildId) {
                            createLink(dLink, hdoc.ChildId, 'Show Child', $hdoc.find('.childLink'));
                        }
                        main.find('.tracking').append($hdoc);
                        main.find('.bookingsHistory').slideDown('slow');
                    }
                });
            }
            else if (history.css('display') === 'none') {
                history.slideDown('slow');
            }
            else {
                history.slideUp('slow');
            }
        }

        return {
            init: function ($el) {
                $('.itemDetail').click(function () {
                    var main = $(this).parent();
                    var history = main.find('.bookingsHistory');
                    if (history.length === 0) {
                        $.ajax({
                            url: url.resolve('/Warehouse/Bookings/History/' + $(this).data("id")),
                            success: function (hdoc) {
                                hdoc.jsonDateToMomentUtcFix = jsonDateToMomentUtcFix;
                                var $hdoc = $(_.template(BookingHistoryTemplate, hdoc));
                                if (hdoc.pickingID) {
                                    createLink(pLink, hdoc.pickingID, 'Show PickList', $hdoc.find('.pickedLink'));
                                }
                                if (hdoc.ScheduleID) {
                                    createLink(sLink, hdoc.ScheduleID, 'Show Schedule', $hdoc.find('.scheduleLink'));
                                }
                                if (hdoc.OriginalId) {
                                    createLink(dLink, hdoc.OriginalId, 'Show Parent', $hdoc.find('.exceptionLink'));
                                }
                                if (hdoc.ChildId) {
                                    createLink(dLink, hdoc.ChildId, 'Show Child', $hdoc.find('.childLink'));
                                }
                                main.find('.tracking').append($hdoc);
                                main.find('.bookingsHistory').slideDown('slow');
                            }
                        });
                    } else if (history.css('display') === 'none') {
                        history.slideDown('slow');
                    } else {
                        history.slideUp('slow');
                    }
                });

                $('.resolveDate').datepicker({
                    defaultDate: "+1",
                    maxDate: "+1y",
                    minDate: "0",
                    dateFormat: "D, d MM, yy"
                });

                $('.exception').hide();

                $('.showException').click(function () {
                    var exception = $(this).parents(".panel").find('.exception');
                    if (exception.css('display') === 'none') {
                        exception.slideDown('slow');
                        $(this).find("span").removeClass("chevron-down").addClass("chevron-up");
                    } else {
                        exception.slideUp('slow');
                        $(this).find("span").removeClass("chevron-up").addClass("chevron-down");
                    }
                    loadTracking($(this));
                });

                $('.showAmend').click(function () {
                    var exception = $(this).parents(".panel").find('.exception');
                    if (exception.css('display') === 'none') {
                        exception.slideDown('slow');
                        $(this).find("span").removeClass("chevron-down").addClass("chevron-up");
                    } else {
                        exception.slideUp('slow');
                        $(this).find("span").removeClass("chevron-up").addClass("chevron-down");
                    }
                });

                $('.resolveDate').change(function () {
                    $(this).parents(".form-horizontal").find('.btnResolve').attr("disabled", false);
                });

                $('textarea').live('keyup', function () {
                    var cancelBtt = $(this).parents(".form-horizontal").find('.btnCancel');

                    if (this.textLength === 0) {
                        cancelBtt.attr("disabled", true);
                    } else {
                        cancelBtt.attr("disabled", false);
                    }
                });

                $('.btnResolve').click(function () {
                    var data = {
                        Id: $(this).parents(".exception").data('id'),
                        Date: moment($(this).parents(".form-horizontal").find('.resolveDate').datepicker("getDate")).format(),
                        Time: $(this).parents(".form-horizontal").find('select').val()
                    };
                    $.post(url.resolve('/Warehouse/Bookings/Resolve'), data, function () {
                        spa.go("/Warehouse/Bookings/detail/" + data.Id);
                    });
                });

                $('.btnCancel').click(function () {
                    var data = {
                        Id: $(this).parents(".exception").data('id'),
                        Notes: $(this).parents(".form-horizontal").find('.cancelNotes').val()
                    };

                    $.post(url.resolve('/Warehouse/Bookings/Cancel'), data, function () {
                        spa.go("/Warehouse/Bookings/detail/" + data.Id);
                    });
                });

                $(".stockbranch, .delbranch").each(function () {
                    var _this = $(this);
                    var key = _this.text().trim();
                    if (key) {
                        pickList.k2v('BRANCH', key, function (rows) {
                            _this.text(rows[key]);
                        });
                    }
                });
            }
        };
    });
