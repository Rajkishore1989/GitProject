/*global define*/
define(['underscore', 'angular', 'moment', 'url'], function (_, angular, moment, url,$http,$q) {
    'use strict';

    var bookings;
    var holidays;
    var pendingHolidays;
    var publicHolidays;
    var technicians;
    var isDiary;
    var calcSlotTimes;

    var types = {
        SE: 'Service Request External',
        SI: 'Service Request Internal',
        IE: 'Installation External',
        II: 'Installation Internal',
        S: 'Stock Repair'
    };

    var removeTime = function (dateTime) {
        return moment(dateTime).hours(0).minutes(0).seconds(0).milliseconds(0);
    };

    var isDayEqual = function (date1, date2) {
        return removeTime(date1).diff(removeTime(date2), 'days') === 0;
    };

    var convertDate = function (list, prop, prop2) {
        _.each(list, function (item) {
            item[prop] = new Date(parseInt(item[prop].substr(6), 10));
            if (prop2 && item[prop2]) {
                item[prop2] = new Date(parseInt(item[prop2].substr(6), 10));
            }
        });
    };

    var expandHolidays = function (holidays) {
        var holidayList = [];
        _.each(holidays, function (holiday) {
            for (var start = moment(holiday.StartDate).clone(); start <= moment(holiday.EndDate); start.add('days', 1)) {
                holidayList.push({
                    Date: start.clone().toDate(),
                    Id: holiday.Id,
                    Approved: holiday.Approved
                });
            }
        });
        return holidayList;
    };

    var findHoliday = function (item) {
        return _.find(expandHolidays(holidays), function (h) {
            return isDayEqual(h.Date, item.Date);
        });
    };

    var checkWholeDayIsFree = function (items) { // Check if day can be used for holiday. (Ignore public holidays)
        return _.find(items, function (item) {
            return _.find(bookings, function (p) {
                return isDayEqual(p.Date, item.Date);
            }) || findHoliday(item);

        });
    };

    var checkIfHoliday = function (items) { // Check if day can be used for holiday. (Ignore public holidays)
        return _.find(items, function (item) {
            return _.find(publicHolidays, function (p) {
                return isDayEqual(p.Date, item.Date);
            }) || findHoliday(item);
        });
    };

    var filterDay = function (list, currentDay) {
        return _.filter(list, function (day) {
            return isDayEqual(day.Date, currentDay);
        });
    };

    var calDay = function (dayDate, slotSize) {
        var filterHoliday = filterDay(expandHolidays(holidays), dayDate);
        var filterBookings = filterDay(bookings, dayDate);
        var filterPublicHolidays = filterDay(publicHolidays, dayDate);

        return _.map(_.range(0, slotSize), function (slot) {
            var slotSpace = {
                slot: slot
            };
            _.each(filterBookings, function (booking) {
                if (slot >= booking.Slot && slot <= (booking.Slot + booking.SlotExtend)) {
                    slotSpace.booking = {
                        id: booking.Id,
                        requestId: booking.RequestId,
                        type: booking.Type,
                        slotExtend: booking.SlotExtend,
                        slot: booking.Slot,
                        rejected: booking.Reject
                    };
                }
            });
            _.each(filterHoliday, function (holiday) {
                slotSpace.holiday = {
                    Id: holiday.Id,
                    Approved: holiday.Approved
                };
            });
            _.each(filterPublicHolidays, function () {
                slotSpace.publicHoliday = {};
            });
            return slotSpace;
        });
    };

    var createWeek = function (startDate, slotSize, dayOnly) {
        var max = dayOnly ? 1 : 7;
        return _.map(_.range(0, max), function (day) {
            var d = startDate.clone().add('days', day).toDate();
            return {
                date: d,
                slots: calDay(d, slotSize)
            };
        });
    };

    var calTimes = function (technician) {
        var startHour = parseInt(technician.StartTime.substring(0, 2), 10);
        var startMinute = parseInt(technician.StartTime.substring(2, 4), 10);
        var endHour = parseInt(technician.EndTime.substring(0, 2), 10);
        var endMinute = parseInt(technician.EndTime.substring(2, 4), 10);
        var startDate = moment().hours(startHour).minutes(startMinute).seconds(0).milliseconds(0);
        var endDate = moment().hours(endHour).minutes(endMinute).seconds(0).milliseconds(0);
        if (endHour < startHour || (startHour === endHour && endMinute < startMinute)) {
            startDate = startDate.subtract('days', 1);
        }
        var slotSize = endDate.diff(startDate, 'minutes') / technician.Slots;
        var slotTimes = _.map(_.range(0, technician.Slots), function (slot) {
            return {
                time: startDate.clone().add('minutes', slotSize * slot),
                number: slot + 1
            };
        });
        slotTimes.push({
            time: endDate,
            number: ''
        });
        return slotTimes;
    };

    var findTech = function (techId) {
        return _.find(technicians, function (tech) {
            return tech.UserId === techId;
        });
    };

    var checkIfBookingTaken = function (date, slot, slotExtend, id) {
        if (checkIfHoliday([
            {
                Date: date
            }
        ])) {
            return true;
        }
        var found = _.find(bookings, function (booking) {
            return isDayEqual(booking.Date, date) && (((slot >= booking.Slot && slot <= booking.Slot + booking.SlotExtend) || (slot + slotExtend >= booking.Slot && slot <= booking.Slot)) && booking.Id !== id);
        });

        return typeof found !== 'undefined';
    };


    var checkOccupiedSlot = function (slot, bookings, id, currentDate) {
        return _.find(filterUser(bookings, id), function (booking) {
            return slot >= booking.Slot && slot <= booking.Slot + booking.SlotExtend && isDayEqual(booking.Date, currentDate);
        });
    };

    var filterUser = function (list, user) {
        return _.filter(list, function (item) {
            return user.toString() === item.UserId.toString();
        });
    };

    var findUnoccupiedSlot = function (tech, bookings, currentDate) {
        var results = _.find(_.range(0, tech.Slots), function (slot) {
            return !checkOccupiedSlot(slot, bookings, tech.UserId, currentDate);
        });
        return typeof results !== 'undefined';
    };


    var isSlotValid = function (slot, slotExtend, techId) {
        var tech = findTech(techId);
        return (slot + slotExtend <= tech.Slots);
    };

    var removeAllSelected = function () {
        for (var i = bookings.length; i >= 0; i--) {
            if (typeof bookings[i] !== 'undefined' && bookings[i].Type === 'N') {
                bookings.splice(i, 1);
            }
        }
    };

    var addSelectedBooking = function (date, techId, slot, id) {
        if (checkIfBookingTaken(date, slot, 0, id)) {
            return;
        }
        var existingBookingOtherDay = _.find(bookings, function (booking) {
            return booking.Type === 'N' && !isDayEqual(booking.Date, date);
        });
        var existingBooking = _.find(bookings, function (booking) {
            return booking.Type === 'N';
        });
        var existingBookingSlots = _.find(bookings, function (booking) {
            return isDayEqual(booking.Date, date) && booking.Type === 'N' && (booking.Slot === slot + 1 || booking.Slot === slot - 1);
        });
        if ((existingBookingOtherDay || existingBooking) && !existingBookingSlots) {
            removeAllSelected();
        }
        bookings.push({
            Date: date,
            Type: 'N',
            Slot: slot,
            SlotExtend: 0,
            RequestId: id,
            techId: techId,
            Reject: false
        });

    };

    var removePendingHoliday = function (id) {
        for (var j = pendingHolidays.length; j >= 0; j--) {
            if (typeof pendingHolidays[j] !== 'undefined' && id === pendingHolidays[j].Id) {
                pendingHolidays.splice(j, 1);
            }
        }
    };

    var filterRejected = function (bookings, rejected) {
        return _.filter(bookings, function (booking) {
            return booking.Reject === rejected;
        });
    };

    var calAllocationDate = function (date, slot) {
        var searchedSlot = _.find(calcSlotTimes, function (slotTime) {
            return slotTime.number === slot + 1;
        });
        var time = moment(searchedSlot.time);
        return moment(date).add('h', time.hours()).add('m', time.minutes()).add('s', time.seconds()).toDate();
    };

    var getFreeBooking = function (requestId) {
        return $http.get(url.resolve('/Service/TechnicianDiaries/GetFreeBooking?requestId=' + requestId));

    };

    return {
        init: function (technicianList, bookingList, holidayList, publicHolidayList, pHolidays, isDiaryBool) {
            bookings = bookingList;
            holidays = holidayList;
            pendingHolidays = pHolidays;
            publicHolidays = publicHolidayList;
            technicians = technicianList;
            convertDate(bookings, 'Date', 'CreatedOn');
            convertDate(publicHolidays, 'Date');
            isDiary = isDiaryBool;

            return this;
        },
        technicians: function () {
            return technicians;
        },
        calculateWeeks: function (params) {
            var tech = findTech(params.techId);
            var startDate = moment.isMoment(params.date) ? params.date.clone().hours(0).minutes(0).seconds(0).milliseconds(0) : moment(params.date).clone().hours(0).minutes(0).seconds(0).milliseconds(0);
            return _.map(_.range(0, params.numberOfWeeks), function (week) {
                return createWeek(startDate.clone().add('weeks', week), tech.Slots, params.dayOnly);
            });
        },
        calculateSlotsTimes: function (techId) {
            var tech = findTech(techId);
            calcSlotTimes = calTimes(tech);
            return calcSlotTimes;
        },
        slotNumbers: function (techId) {
            var tech = findTech(techId);
            return _.range(0, tech.Slots);
        },
        addHoliday: function (newHoliday) {
            holidays.push(newHoliday);
            if (!newHoliday.Approved) {
                pendingHolidays.push(newHoliday);
            }
        },
        listPending: function () {
            return _.sortBy(pendingHolidays, function (h) {
                return (+moment(h.StartDate).toDate());
            });
        },
        listRejected: function () {
            return _.sortBy(filterRejected(bookings, true), function (h) {
                return (+moment(h.Date).toDate());
            });
        },
        findPendingHoliday: function (id) {
            return _.find(pendingHolidays, function (day) {
                return day.Id === id;
            });
        },
        findHoliday: function (id) {
            return _.find(holidays, function (h) {
                return h.id === (id);
            });
        },
        removeHoliday: function (holidayId) {
            for (var i = holidays.length; i >= 0; i--) {
                if (typeof holidays[i] !== 'undefined' && holidayId === holidays[i].Id) {
                    holidays.splice(i, 1);
                }
            }
            removePendingHoliday(holidayId);
        },
        rejectBooking: function (id) {
            var booking = _.find(bookings, function (b) {
                return b.Id === id;
            });
            booking.Reject = true;
        },
        approveHoliday: function (id) {
            var hol = _.find(holidays, function (h) {
                return h.Id === id;
            });
            hol.Approved = true;
            removePendingHoliday(id);
        },
        addHolidayCheck: function (newHoliday) {
            var holidayDates = expandHolidays([newHoliday]);
            return (checkWholeDayIsFree(holidayDates));
        },
        addFreeToBooked: function (freeBooking) {
                bookings.push(freeBooking);
        },
        bookedToFree: function (id) {
            for (var i = bookings.length; i >= 0; i--) {
                if (typeof bookings[i] !== 'undefined' && id === bookings[i].Id) {
                    bookings.splice(i, 1);
                }
            }
        },
        isSlotTaken: function (date, slot, slotExtend, id) {
            return checkIfBookingTaken(date, slot, slotExtend, id);
        },
        isSlotValid: function (slot, slotExtend, techId) {
            return isSlotValid(slot, slotExtend, techId);
        },
        slotClass: function (slot) {
            var d = isDiary ? 'click' : '';
            if (slot.booking) {
                d += slot.booking.rejected ? ' rejected' : '';
                if (slot.booking.type.substring(0, 1) === 'N') {
                    return 'selectedCell' + d;
                } else {
                    return slot.booking.type === 'S' ? 'stockRepair ' + d : slot.booking.type.substring(0, 1) === 'S' ? 'Service ' + d : 'Installation ' + d;
                }
            } else if (slot.holiday) {
                return slot.holiday.Approved ? 'holidayApproved ' + d : 'holidayPending ' + d; // No Pending Yet
            } else if (slot.publicHoliday) {
                return 'publicHoliday';
            }
            return 'click';
        },
        slotTextReqId: function (slot) {
            if (slot.booking) {
                return slot.booking.requestId;
            } else if (slot.holiday) {
                return slot.holiday.Approved ? 'Not Available' : 'Availability Pending';
            } else if (slot.publicHoliday) {
                return 'Public Holiday';
            }
            return "";
        },
        slotUrl: function (slot) {
            if (slot.booking) {
                return url.resolve('/Service/Requests/') + slot.booking.requestId;
            } else {
                return '';
            }
        },
        formatHeader: function (date) {
            return moment(date).format('dddd DD/MM');
        },
        filterBusyTechnician: function (currentDate) {
            return _.filter(technicians, function (tech) {
                return findUnoccupiedSlot(tech, bookings, currentDate);
            });
        },
        addSelected: function (selected) {
            if (selected.slots) {
                for (var i = 0; i <= selected.slots; i++) {
                    addSelectedBooking(selected.day, selected.techId, selected.selectedSlot + i, selected.id);
                }
            } else {
                addSelectedBooking(selected.day, selected.techId, selected.selectedSlot, selected.id);
            }
        },
        removeAllSelected: function () {
            removeAllSelected();
        },
        saveDetail: function () {
            var selected = _.filter(bookings, function (booking) {
                return booking.Type === 'N';
            });
            var slots = _.pluck(selected, 'Slot');
            return {
                date: calAllocationDate(selected[0].Date, _.min(slots)),
                slot: _.min(slots),
                slotExtend: _.size(selected) - 1,
                techId: selected[0].techId
            };
        },
        convertType: function (item) {
            return types[item];
        },
        completeTechRequest: function () {
            var found = false;
            _.each(bookings, function (booking) {
                if (booking.Type === 'N') {
                    booking.Type = null;
                    found = true;
                }
            });
            return found;
        }
    };
});