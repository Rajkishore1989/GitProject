/* define*/
define(['jquery', 'underscore', 'service/calendarBase', 'angular', 'url', 'moment', 'angularShared/app', 'alert', 'spa', 'jquery.pickList',
        'notification', 'services/calenderService', 'angular.ui', 'angular-resource', 'lib/select2', 'modal', 'underscore.string'],

    function ($, _, calendarBase, angular, url, moment, app, alert, spa, pickList, notification, calenderSrv) {
        'use strict';
        /* TODO: + Move all 'calendarBase' functionality into the newly created service 'calenderSrv'
         TODO: + Detach all list properties from TechnicianDiary object and make them available as services from 'calenderSrv'
         */

        return {
            init: function ($el) {
                var diaryCtrl = function ($scope, Diary, xhr, $location, calenderSrv, Enum) {
                    // Initial Setup
                    var serverDate;
                    xhr.get(url.resolve('/Config/Settings/GetTime'))
                        .success(function (data) {
                            serverDate = moment(data.date);
                        });

                    $scope.types = {
                        SE: 'ServiceRequest External',
                        SI: 'ServiceRequestInternal',
                        IE: 'Installation External',
                        II: 'Installation Internal',
                        S: 'Stock Repair'
                    };

                    var permissionList = {
                        1618: 'DeleteBooking',
                        1622: 'AddBooking',
                        1615: 'ViewTechDiary',
                        1624: 'AddHoliday'
                    };

                    $scope.MasterData = {};

                    var pickLists = [
                        {
                            name: 'Blue.Cosacs.Service.ServiceTechReasons',
                            v: 'ServiceTechReasons'
                        },
                        {
                            name: 'Blue.Cosacs.Service.ServiceTechRejectReasons',
                            v: 'ServiceTechRejectReasons'
                        }
                    ];

                    _.each(pickLists, function (item) {
                        pickList.populate(item.name, function (data) {
                            $scope.MasterData[item.v] = data;
                        });
                    });

                    $scope.availableRequestOptions = {
                        minimumInputLength: 2,
                        query: function (query) {
                            calenderSrv.getFreeBookings(query.term).then(function (response) {
                                var data = _.map(response, function (rq) {
                                    return {
                                        id: rq.RequestId,
                                        text: rq.RequestId + ' : ' + Enum.ServiceTypeEnum[rq.Type]
                                    };
                                });

                                query.callback({results: data});
                            }, function () {
                                query.callback({results: []});
                            });

                        }
                    };

                    var rejectLimit = $el.find('.technicianDiary').data('rejectlimit');

                    var permissions = _.map($el.find('.technicianDiary').data('permissions'), function (p) {
                        return permissionList[p];
                    });

                    var checkPermission = $scope.checkPermission = function (permission) {
                        return _.contains(permissions, permission);
                    };

                    var changeHeader = function (text) {
                        $('#page-heading').html(text);
                    };

                    var isMyDiary = function () {
                        return   $('#page-heading').html() === 'My Diary';
                    };

                    var longDateFormat = 'dddd, MMMM Do YYYY';
                    $scope.moment = moment;
                    //$scope.dateFormatShort = 'DD-MMM-YYYY';
                    $scope.dateFormat = 'DD-MMMM-YYYY';
                    $scope.displayWeeks = 2;
                    $scope.holiday = {};
                    $scope.dialogue = {};
                    $scope.text = {};
                    $scope.dialogue.deleteHoliday = {};
                    $scope.dialogue.editBooking = {};
                    $scope.dialogue.deleteBooking = {};

                    var dialogue = $scope.dialogueCommon = {
                        CancelClicked: function (v) {
                            dialogue.show = false;
                            $('#dialogueCommon').modal('hide');
                        }
                    };
                    dialogue.actionButtonDisable = function () {
                        if (dialogue.hideSelect) {
                            return false;
                        }
                        return !dialogue.selected;
                    };
                    $scope.exceptions = $el.find('.technicianDiary').data('exceptions');
                    if ($scope.exceptions) {
                        changeHeader('Diary Exceptions');
                    }
                    var uID = $el.find('.technicianDiary').data('portal');
                    if (uID > 0) {
                        $scope.UserId = uID;
                        $scope.portalUser = true;
                        $scope.text.available = 'Request unavailable from';
                        changeHeader('My Diary');
                    } else {
                        $scope.text.available = 'Mark technician unavailable from';
                        $scope.portalUser = false;

                    }


                    var calender;
                    var displayStartDate;
                    var displayEndDate;
                    $scope.displayStartDate = new Date();


                    var deleteHoliday = function (id, callback) {
                        xhr({
                            url: url.resolve('/Service/TechnicianDiaries/DeleteHoliday/' + id),
                            method: "POST"
                        }).success(function (data, status, headers, config) {
                            calender.removeHoliday(id);
                            update();
                            callback(false);
                        }).error(function () {
                            callback(true);
                        });
                    };

                    var rejectBooking = function (id, reason, callback) {
                        xhr.put(url.resolve('/Service/TechnicianDiaries/RejectBooking/' + id) + '?reason=' + reason)
                            .success(function (data, status, headers, config) {
                                calender.rejectBooking(id);
                                update();
                                callback(false);
                            }).error(function () {
                                callback(true);
                            });
                    };

                    $scope.addHoliday = function () {
                        var newHoliday = {
                            StartDate: moment($scope.holiday.requestStart).clone().toDate(),
                            EndDate: moment($scope.holiday.requestEnd).clone().toDate()
                        };
                        if (calender.addHolidayCheck(newHoliday)) {
                            alert('Selected dates have existing bookings or holidays. Please select new dates.',
                                'Existing bookings');
                        } else {
                            xhr.put(url.resolve('/Service/TechnicianDiaries/AddHoliday'), {
                                UserId: $scope.UserId,
                                from: $scope.holiday.requestStart.toJSON(),
                                to: $scope.holiday.requestEnd.toJSON(),
                                portalUser: $scope.portalUser
                            })
                                .success(function (data, status, headers, config) {
                                    newHoliday = {
                                        StartDate: moment($scope.holiday.requestStart).clone().toDate(),
                                        EndDate: moment($scope.holiday.requestEnd).clone().toDate(),
                                        Id: data,
                                        Approved: !$scope.portalUser
                                    };
                                    calender.addHoliday(newHoliday);
                                    $scope.holiday.requestStart = $scope.holiday.requestEnd = null;
                                    update();
                                });
                        }
                    };

                    $scope.checkHolidayDates = function () {
                        if (!checkPermission('AddHoliday') && !$scope.portalUser) {
                            return true;
                        }

                        var from = moment($scope.holiday.requestStart);
                        var to = moment($scope.holiday.requestEnd);
                        if (!$scope.holiday.requestStart || !$scope.holiday.requestEnd) {
                            return true;
                        } else {
                            return to.diff(from) < 0;
                        }
                    };

                    var update = function () {
                        $scope.weeks = calender.calculateWeeks({
                            date: displayStartDate,
                            techId: $scope.UserId,
                            numberOfWeeks: $scope.displayWeeks,
                            dayOnly: false
                        });
                        $scope.pending = calender.listPending();
                        $scope.rejectBookings = calender.listRejected();

                        digest();
                    };

                    $scope.dialogueShowing = function () {
                        return $scope.dialogue.deleteHoliday.show || $scope.dialogue.editBooking.show || $scope.dialogue.deleteBooking.show;
                    };

                    var dialoguesHideAll = function () {
                        $scope.dialogue.editBooking.show = $scope.dialogue.editBooking.newErrorFill = $scope.dialogue.editBooking.newErrorCanNotSave = $scope.dialogue.editBooking.error = false;
                        $('#dialogueEditBooking').modal('hide');
                    };

                    $scope.preventPopup = function ($event) {
                        $event.stopPropagation();
                    };

                    $scope.slotPopup = function (slot, day) {
                        dialoguesHideAll();
                        var d = $scope.dialogue;
                        if (typeof slot.booking !== 'undefined') {

                            if (slot.booking.rejected) {
                                return;
                            }

                            if ($scope.portalUser) {
                                setDialogueRejectBooking(slot.booking);
                            } else {
                                d.editBooking.dateDisplay = day;
                                d.editBooking.date = day;
                                d.editBooking.Type = slot.booking.type;
                                d.editBooking.allocationType = slot.booking.allocationType;
                                d.editBooking.id = slot.booking.id;
                                d.editBooking.RequestId = slot.booking.requestId;
                                d.editBooking.slots = slot.booking.slotExtend;
                                d.editBooking.slotPosition = slot.booking.slot;
                                d.editBooking.link = url.resolve('Service/Requests/' + slot.booking.requestId);
                                d.editBooking.newDate = day;
                                d.editBooking.newSlot = slot.booking.slot;
                                d.editBooking.info = _.find($scope.data.Bookings, function (booking) {
                                    return booking.Id === slot.booking.id;
                                });
                                $('#dialogueEditBooking').modal();
                                d.editBooking.show = true;
                                d.editBooking.error = false;
                                d.editBooking.newBooking = false;
                            }

                        } else if (typeof slot.publicHoliday !== 'undefined') {
                            return;
                        } else if (typeof slot.holiday !== 'undefined') {
                            if (!$scope.portalUser && !slot.holiday.Approved) {
                                setDialogueConfirmPending(slot.holiday);
                            } else {
                                setDialogueDeleteHoliday(slot.holiday);
                            }
                        } else if (!$scope.portalUser) {
                            if (!checkPermission('AddBooking')) {
                                alert('You do not have permission to add or modify bookings.', 'No Permission.');
                                return;
                            }
                            createBooking(d.editBooking, slot.slot, day);

                        }
                        d.editBooking.newBookingSelect = digest();
                    };

                    $scope.editBookingClickDelete = function (id, requestId, Id, RequestId) {
                        dialoguesHideAll();
                        setDialogueDeleteBooking(id ? id : Id, requestId ? requestId : RequestId);
                    };

                    var createBooking = function (editBooking, slot, date) {
                        editBooking.newBooking = true;
                        editBooking.show = true;
                        $('#dialogueEditBooking').modal();
                        editBooking.newSlot = slot;
                        editBooking.newDate = date;
                        editBooking.allocationType = 'Repair';
                    };

                    var deleteBooking = function (id, reason, callback) {
                        xhr.put(url.resolve('/Service/TechnicianDiaries/DeleteBooking/' + id) + '?reason=' + reason)
                            .success(function (data, status, headers, config) {
                                calender.bookedToFree(id);
                                update();
                                callback(false);
                            }).error(function () {
                                callback(true);
                            });
                    };

                    var approveHoliday = function (id, callback) {
                        xhr.put(url.resolve('/Service/TechnicianDiaries/approveHoliday/' + id))
                            .success(function (data, status, headers, config) {
                                calender.approveHoliday(id);
                                update();
                                callback(false);
                            }).error(function () {
                                callback(true);
                            });
                    };

                    $scope.dialogueCommonCancelClicked = function () {
                        dialogue.show = false;
                        $('#dialogueCommon').modal('hide');
                    };

                    var setDialogueConfirmPending = function (holiday) {
                        var selectedTech = _.find($scope.Technicians, function (tech) {
                            return tech.Id === $scope.UserId;
                        });
                        var day = calender.findPendingHoliday(holiday.Id);

                        dialogue.headerText = 'Confirm or Decline Unavailability ';
                        dialogue.bodyText = 'Please confirm or decline request by user ' + selectedTech.Name + ' for ' + moment(day.StartDate).format(longDateFormat) + ' to ' + moment(day.EndDate).format(longDateFormat);
                        dialogue.alternateButtonClick = function (v) {
                            var m = v;
                            return function () {
                                deleteHoliday(m, function (r) {
                                    dialogue.show = r;
                                    if (r === false) {
                                        $('#dialogueCommon').modal('hide');
                                    }
                                });
                            };
                        }(holiday.Id);
                        dialogue.actionButtonClick = function (v) {
                            var m = v;
                            return function () {
                                approveHoliday(m, function (r) {
                                    dialogue.show = r;
                                    if (r === false) {
                                        $('#dialogueCommon').modal('hide');
                                    }
                                });
                            };
                        }(holiday.Id);
                        dialogue.actionButtonText = 'Confirm';
                        dialogue.alternateButtonText = 'Decline';
                        dialogue.showAlternate = true;
                        dialogue.show = true;
                        $('#dialogueCommon').modal();
                        dialogue.hideSelect = true;

                    };

                    var setDialogueDeleteHoliday = function (holiday) {

                        var holidayRange = calender.findHoliday(holiday.id);
                        dialogue.headerText = 'Delete Unavailability?';
                        dialogue.bodyText = 'Are you sure you wish to remove this period of unavailability starting on ' + moment(holidayRange.StartDate).format(longDateFormat) + ' to ' + moment(holidayRange.EndDate).format(longDateFormat);
                        dialogue.actionButtonClick = function (v) {
                            var m = v;
                            return function () {
                                deleteHoliday(m, function (r) {
                                    dialogue.show = r;
                                    if (r === false) {
                                        $('#dialogueCommon').modal('hide');
                                    }
                                });
                            };
                        }(holiday.Id);
                        dialogue.actionButtonText = 'Delete';
                        dialogue.cancelButtonText = 'Cancel';
                        dialogue.showAlternate = false;
                        dialogue.show = true;
                        $('#dialogueCommon').modal();
                        dialogue.hideSelect = true;
                    };

                    var setDialogueDeleteBooking = function (id, requestId) {
                        dialogue.headerText = 'Delete Booking ' + requestId;
                        dialogue.bodyText = ' Are you sure you wish to remove this booking?';
                        dialogue.selected = null;
                        dialogue.actionButtonClick = function (v) {
                            var m = v;
                            return function () {
                                deleteBooking(m, dialogue.selected, function (r) {
                                    dialogue.show = r;
                                    if (r === false) {
                                        $('#dialogueCommon').modal('hide');
                                    }
                                });
                            };
                        }(id);
                        dialogue.actionButtonText = 'Delete';
                        dialogue.cancelButtonText = 'Cancel';

                        dialogue.showAlternate = false;
                        dialogue.show = true;
                        $('#dialogueCommon').modal();
                        dialogue.hideSelect = false;
                        dialogue.placeholder = 'Select Reason for deleting';
                        dialogue.options = _.values($scope.MasterData.ServiceTechReasons);
                    };

                    var setDialogueRejectBooking = function (booking) {

                        var fBooking = _.find($scope.data.Bookings, function (b) {
                            return b.Id === booking.id;
                        });
                        var dateTooClose = moment(fBooking.Date).diff(serverDate.toDate(), 'hours') < rejectLimit * 24;
                        if (dateTooClose) {
                            notification.show('This job is within ' + rejectLimit + ' days and cannot be rejected');
                            return;
                        }

                        dialogue.options = _.values($scope.MasterData.ServiceTechRejectReasons);
                        dialogue.errorText = '';
                        dialogue.headerText = 'Reject Booking ' + booking.requestId;
                        dialogue.bodyText = 'Are you sure you wish to reject this booking?';

                        dialogue.actionButtonClick = function (v) {
                            var m = v;
                            return function () {
                                rejectBooking(m, dialogue.selected, function (r) {
                                    dialogue.show = r;
                                    if (r === false) {
                                        $('#dialogueCommon').modal('hide');
                                    }
                                });
                            };
                        }(booking.id);
                        dialogue.actionButtonText = 'Reject';
                        dialogue.cancelButtonText = 'Cancel';
                        dialogue.showAlternate = false;
                        dialogue.show = true;
                        dialogue.CancelClicked = function () {
                            dialogue.show = false;
                            $('#dialogueCommon').modal('hide');
                        };
                        $('#dialogueCommon').modal();
                        dialogue.hideSelect = false;
                        dialogue.selected = null;
                        dialogue.placeholder = 'Select Reason for rejecting';
                    };

                    $scope.$watch("dialogue.editBooking.bookingRequestId", function (newval, oldval) {
                        if (!newval || newval === oldval) {
                            $scope.dialogue.editBooking.newBookingSelect = null;
                            return;
                        }

                        calenderSrv.getFreeBooking(newval.id).then(function (result) {
                            var item = result.data;
                            //item['Date'] = new Date(parseInt(item['Date'].substr(6), 10));
                            item.CreatedOn = new Date(parseInt(item.CreatedOn.substr(6), 10));

                            $scope.dialogue.editBooking.newBookingSelect = item;
                        });
                    });

                    var saveNew = function (newDate, newSlot) {
                        if (!$scope.dialogue.editBooking.newBookingSelect) {
                            $scope.dialogue.editBooking.newErrorFill = true;
                            return;
                        }

                        var booking = $scope.dialogue.editBooking.newBookingSelect;
                        var slotExtend = parseInt($scope.dialogue.editBooking.newExtendSlots, 10);
                        newSlot = parseInt(newSlot, 10);
                        if (!booking || !newDate || isNaN(newSlot) || isNaN(slotExtend)) {
                            $scope.dialogue.editBooking.newErrorFill = true;
                            return;
                        }
                        if (calender.isSlotTaken(newDate, newSlot, slotExtend, booking.Id)) {
                            $scope.dialogue.editBooking.error = true;
                            return;
                        }
                        if (!calender.isSlotValid(newSlot, slotExtend, $scope.UserId)) {
                            $scope.dialogue.editBooking.error = true;
                            return;
                        }
                        xhr.put(url.resolve('/Service/TechnicianDiaries/AddBooking'), {
                            UserId: $scope.UserId,
                            requestId: booking.RequestId,
                            bookingDate: newDate,
                            slot: newSlot,
                            slotExtend: slotExtend,
                            allocationType: $scope.dialogue.editBooking.allocationType
                        })
                            .success(function (data) {
                                if (data.error) {
                                    alert('Another user has made conflicting changes. Please try reloading the page.', 'Changes not saved!');
                                } else {
                                    var id = parseInt(data.id, 10);
                                    
                                    var freeBooking = $scope.dialogue.editBooking.newBookingSelect;
                                    freeBooking.Date = newDate;
                                    freeBooking.Slot = newSlot;
                                    freeBooking.SlotExtend = slotExtend;
                                    freeBooking.Id = id;
                                    calender.addFreeToBooked(freeBooking);

                                    $scope.dialogue.editBooking.show = false;
                                    $('#dialogueEditBooking').modal('hide');
                                    update();
                                    $('#availableRequest').select2('text', '');

                                }
                            });
                    };

                    $scope.assignRescheduleBookingEdit = function () {
                        var newSlot = parseInt($scope.dialogue.editBooking.newSlot, 10);
                        var slotExtend = parseInt($scope.dialogue.editBooking.newExtendSlots, 10);
                        var newDate = $scope.dialogue.editBooking.newDate;
                        var id = $scope.dialogue.editBooking.Id || $scope.dialogue.editBooking.id; //Fix for rescheduling

                        if ($scope.dialogue.editBooking.newBooking) {
                            saveNew(newDate, newSlot);
                            return;
                        }
                        if (calender.isSlotTaken(newDate, newSlot, slotExtend, $scope.dialogue.editBooking.id)) {
                            $scope.dialogue.editBooking.error = true;
                            return;
                        }
                        if (!calender.isSlotValid(newSlot, slotExtend, $scope.UserId)) {
                            $scope.dialogue.editBooking.error = true;
                            return;
                        }
                        $scope.dialogue.editBooking.error = false;
                        updateBooking(id, newDate, newSlot, slotExtend, $scope.dialogue.editBooking.allocationType);
                        $scope.dialogue.editBooking.show = false;
                        $('#dialogueEditBooking').modal('hide');
                    };

                    $scope.cancelEditBooking = function () {
                        $scope.dialogue.editBooking.show = false;
                        $('#dialogueEditBooking').modal('hide');
                    };

                    var updateBooking = function (id, newDate, newSlot, slotExtend, allocationType) {
                        var booking = _.find($scope.data.Bookings, function (booking) {
                            return (booking.Id) === (id);
                        });
                        xhr.put(url.resolve('/Service/TechnicianDiaries/AddBooking'), {
                            UserId: $scope.UserId,
                            requestId: booking.RequestId,
                            bookingDate: newDate,
                            slot: newSlot,
                            slotExtend: slotExtend,
                            allocationType: allocationType
                        })
                            .success(function (data, status, headers, config) {
                                if (data.error) {
                                    alert('Another user has made conflicting changes. Please try reloading the page.', 'Changes not saved!');
                                } else {
                                    booking.Date = newDate;
                                    booking.Slot = newSlot;
                                    booking.SlotExtend = slotExtend;
                                    booking.Reject = false;
                                    if (data.id !== undefined && data.id !== null && !isNaN(data.id)) {
                                        // Fix for rescheduling - update booking
                                        booking.Id = data.id;
                                    }
                                    update();
                                }
                            });
                    };

                    var digest = function () {
                        if (!$scope.$$phase) {
                            $scope.$digest();
                        }
                    };

                    var loadAll = function () {
                        if ($scope.UserId !== 0 || typeof $scope.UserId !== 'undefined') {
                            var myDiary = isMyDiary();

                            $scope.data = Diary.get({
                                id: $scope.UserId,
                                start: displayStartDate.toDate().toJSON(),
                                end: displayEndDate.toDate().toJSON(),
                                myDiary: myDiary
                            }, function () {
                                if ($scope.data.Found) {
                                    if (typeof $scope.data.Bookings === 'undefined') {
                                        $scope.data.Bookings = [];
                                    }
                                    if (typeof $scope.data.Holidays === 'undefined') {
                                        $scope.data.Holidays = [];
                                    }
                                    calender = calendarBase.init($scope.data.Technician, $scope.data.Bookings, $scope.data.Holidays,
                                        $scope.data.PublicHolidays, $scope.data.PendingHolidays, true);

                                    $scope.slotClass = calender.slotClass;
                                    $scope.slotTextReqId = calender.slotTextReqId;
                                    $scope.slotUrl = calender.slotUrl;
                                    $scope.slotTimes = calender.calculateSlotsTimes($scope.UserId);
                                    $scope.slotNumbers = calender.slotNumbers($scope.UserId);
                                    $scope.formatHeader = calender.formatHeader;
                                    $scope.convertType = calender.convertType;
                                    update();
                                }
                            });
                        }
                    };

                    dialoguesHideAll();

                    $scope.SetupChange = function (callback) {
                        if ($scope.UserId) {
                            $scope.UserId = parseInt($scope.UserId, 10);
                            if (!$scope.portalUser) {
                                $location.path(url.resolve('/Service/TechnicianDiaries/Diary/') + $scope.UserId);
                                changeHeader('Technician Diary');
                            }

                            var d = moment($scope.displayStartDate);
                            displayStartDate = d.add('days', -d.day()).hours(0).minutes(0).seconds(0).milliseconds(0);
                            displayEndDate = displayStartDate.clone().add('days', 7 * $scope.displayWeeks);
                            loadAll();
                            if (callback) {
                                callback();
                            }
                        }
                    };

                    $scope.linkDiary = function (startDate, userId, booking) {
                        if (checkPermission('ViewTechDiary') && !($scope.portalUser && booking)) {
                            $scope.displayStartDate = moment(startDate).clone().toDate();
                            if (userId) {
                                $scope.UserId = userId;
                            }
                            $scope.exceptions = null;
                            $location.path(url.resolve('/Service/TechnicianDiaries/Diary'));
                            var callback = function () {
                            };
                            if (booking) {
                                var d = $scope.dialogue.editBooking = booking;
                                callback = function () {
                                    d.newBooking = false;
                                    d.show = true;
                                    $('#dialogueEditBooking').modal();
                                    d.newDate = moment(startDate).clone().toDate();
                                    d.dateDisplay = startDate;
                                    d.date = startDate;
                                    d.link = url.resolve('Service/Requests/' + booking.RequestId);
                                    d.info = booking;
                                };
                            }

                            $scope.SetupChange(callback);
                        }
                    };

                    if (!$scope.portalUser) {
                        xhr.get(url.resolve('/Service/TechnicianDiaries/GetTechnicians'))
                            .success(function (data, status, headers, config) {
                                $scope.Technicians = data;
                                var user = $el.find('.technicianDiary').data('user');
                                if (user) {
                                    $scope.UserId = user;
                                }
                            });
                    }

                    if ($scope.portalUser) {
                        $scope.SetupChange();
                    }

                    if ($scope.exceptions) {
                        xhr.get(url.resolve('/Service/TechnicianDiaries/GetExceptions'))
                            .success(function (data, status, headers, config) {
                                $scope.pending = data.PendingHolidays;
                                $scope.rejectBookings = data.RejectBookings;
                            });
                    }

                    $scope.portalClick = function () {
                        if (checkPermission('ViewTechDiary')) {
                            return $scope.portalUser ? '' : 'click';
                        } else {
                            return '';
                        }

                    };
                };

                var dairyResource = function ($resource) {
                    return $resource(url.resolve('/Service/TechnicianDiaries/GetDiary/:id?start=:start&end=:end&myDiary=:myDiary'));
                };

                diaryCtrl.$inject = ['$scope', 'Diary', 'xhr', '$location', 'calenderSrv', 'Enum'];

                app().factory('Diary', ['$resource', dairyResource])
                    .factory('calenderSrv', calenderSrv)
                    .controller('DiaryCtrl', diaryCtrl);


                return angular.bootstrap($el, ['myApp']);
            }
        };
    });