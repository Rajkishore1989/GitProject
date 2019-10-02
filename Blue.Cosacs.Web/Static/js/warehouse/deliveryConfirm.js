define(['jquery', 'moment', 'url', 'confirm', 'single-click', 'ConvertToISO8601Date', 'datepicker', 'chosen.jquery'],

function ($, moment, url, confirm, singleClick, isoDate) {
    "use strict";

    var CreatedOnDate = moment($('#ScheduleCreatedOn').attr('value'), 'DD/MM/YYYY'),
        minDate = CreatedOnDate.format('YYYY/MM/DD');

    var checkDate = function ($el, date, element, e) {
        var isDate = new Date(date);
        if (isDate === "Invalid Date") {
            element.empty().append("*Delivered / Collected On date has to be a valid date. Please select a date between creation date and today's date.").show();
        } else {
            var DeliveryDate = moment(date);
            var now = moment(new Date()).hours(23).minutes(59).seconds(59);

            if (DeliveryDate >= CreatedOnDate && DeliveryDate <= now) {
                element.hide();
                setTimeout(function () {
                    e.currentTarget.disabled = true;
                    $(e.currentTarget).addClass('disabled');
                }, 100);
               
                return isDate;
            } else {
                if (DeliveryDate > now) {
                    element.empty().append("*Delivered / Collected On date cannot be in the future. Please select a date between creation date and today's date.").show();
                } else if (DeliveryDate < CreatedOnDate) {
                    element.empty().append("*Delivered / Collected On date cannot be before the creation date. Please select a date between creation date and today's date.").show();
                }
            }
        }
        singleClick.reset();
        return null;
    };

    return {
        init: function ($el) {
            $('.warning-date').hide();
            $('.rejectItemSel').chosen({ allow_single_deselect: true });
            $('.delQtySel').chosen();
            $('.delQuantity').hide();
            $('.rejectItemSel').change(function () {
                if ($(this).val().length > 0) {
                    $(this).parents('td').find('.delQuantity').show();
                } else {
                    $(this).parents('td').find('.delQuantity').hide();
                }
            });

            $(".date-picker").attr("disabled", false);
            $(".date-picker").datepicker({
                defaultDate: "0",
                maxDate: "+0",
                minDate: new Date(minDate),
                dateFormat: "D, d MM, yy",
                onSelect: function () {
                    $(this).parent().parent().find('.confirm-delivery').removeClass('disabled').attr('disabled', false);
                }
            });

            $(".confirm-delivery").click(function (e) {
                //single item confirmed
                var date = $(e.target).parent().parent().find(".date").datepicker('getDate');
                var dateOk = checkDate($el, date, $(e.target).parent().find('.single-warning-date'), e);

                if (dateOk) {
                    var DeliveryConfirmation = {
                        shipmentId: $(e.target).data("id"),
                        confirmedDate: isoDate.convertDateOnly(dateOk),
                        rejectionReason: $(e.target).parents('tr').find('.rejectItemSel').val(),
                        rejectionNotes: $(e.target).parents('tr').find('textarea').val(),
                        quantity: $(e.target).parents('tr').find('.delQtySel').val()
                    };
                    $.get(url.resolve('/Warehouse/Delivery/ConfirmSingleShipment'),
                        DeliveryConfirmation,

                        function () {
                            location.reload();
                        });
                }

                return false;
            });

            $('.rejectItemSel').on('change', function (e) {
                $(e.currentTarget).parents('tr').toggleClass('rejected');
            });

            $('#reprint').click(function (e) {

                var scheduleId = $(e.currentTarget).data('scheduleId');
                confirm('You have chosen to reprint the delivery schedule. If you continue, this will be audited. Would you like to reprint the schedule?',
                    'Audit confirmation', function (agree) {
                        if (agree) {
                            url.open('/Warehouse/delivery/PrintSchedule/' + scheduleId);
                        }
                    });

                singleClick.reset();
                e.preventDefault();
            });

            $("#save").click(function (e) {
                var dateOk = checkDate($el, $('#DeliveryOn').val(), $('.warning-date'), e);
                if (dateOk) {
                    return true;
                }
                return false;
            });
        }
    };
});
