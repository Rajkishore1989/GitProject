/*global define*/
define(['jquery', 'underscore', 'url', 'text!service/Templates/technicianProfile.htm', 'jquery.pickList', 'moment',
    'alert', 'notification', 'lib/events', 'lib/select2'],
    function ($, _, url, techProfileTemplate, pickList, moment, alert, notification, events) {
        "use strict";

        return {
            init: function ($el) {
                var zonesList = [];
                var hours = _.map(_.range(0, 24, 1), function (x) {
                    return { id: x, text: String(x).length === 1 ? '0' + x : x };
                });

                var mins = _.map(_.range(0, 59, 5), function (x) {
                    return { id: x, text: String(x).length === 1 ? '0' + x : x };
                });

                var zoneTemplate = '<% _.each(activeList, function (row) { %> <div class="form-control-static"> &nbsp; ' +
                    '                                                            <div class="pull-left"> <%- row.text %> </div>' +
                    '                                                            <div class="glyphicons bin zoneDelete pull-right"  data-id="<%= row.id %>" title="Delete Category"></div> ' +
                    '                                                          </div><% }) %>';
                var hourTemplate = '<div> Shift length <%- workTimeHours %> hours, Slot size: <%- slotSizeHour %> mins.</div>';


                var format = function (item) {
                    if (item !== null) {
                        return item.text;
                    }
                };

                var UserId = $el.data('userid');

                var checkListForValue = function (list, value) {
                    if (list.length === 0) {
                        return false;
                    }
                    else {
                        return typeof (_.find(list, function (row) {
                            return value === row;
                        })) !== 'undefined';
                    }
                };


                var notActive = function (list) {
                    return _.filter(list, function (p) {
                        return !p.Active;
                    });
                };

                var isActive = function (list) {
                    return _.filter(list, function (p) {
                        return p.Active;
                    });
                };

                var displaySelector = function () {
                    $el.find('#zoneAdd').select2({
                        placeholder: "Select to add a category",
                        data: { results: notActive(zonesList), text: 'text' },
                        formatSelection: format,
                        formatResult: format
                    });

                    $el.find('#zones').html(_.template(zoneTemplate, { activeList: isActive(zonesList) }));
                };


                var updateSummary = function () {
                    var startHour = $el.find('#startHour').select2("val");
                    var startMinutes = $el.find('#startMinute').select2("val");
                    var endHour = $el.find('#endHour').select2("val");
                    var endMinutes = $el.find('#endMinute').select2("val");
                    var slots = $el.find('#slots').val();
                    // Added as part of Gurpreet - CR2018-010 - 31/10/18 - Setting of max no. of Jobs & Validation with allocated jobs for a technician.
                    var maxJobs = $el.find('#maxjobs').val();
                    //CR2018-010 Changes End

                    var baseDate = new Date(2000, 1, 2);
                    if (startHour && startMinutes && endHour && endMinutes && slots) {
                        var startDate = moment(new Date(baseDate.getTime()).setHours(startHour, startMinutes, 0, 0));
                        var endDate = moment(new Date(baseDate.getTime()).setHours(endHour, endMinutes, 0, 0));
                        if (parseInt(endHour, 10) < parseInt(startHour, 10) || (startHour === endHour && parseInt(endMinutes, 10) < parseInt(startMinutes, 10))) {
                            startDate = startDate.subtract('days', 1);
                        }
                        var hoursDiff = endDate.diff(startDate, 'minutes') / 60;
                        $el.find('#hourSummary').html(_.template(hourTemplate, { workTimeHours: Math.round(hoursDiff * 100) / 100, slots: slots, slotSizeHour: Math.round(((hoursDiff * 60) / slots) * 100) / 100 }));
                    }
                };

                var hookEvents = function (techProfile) {

                    pickList.populate('Blue.Cosacs.Service.ServiceZone', function (masterZones) {

                        _.each(_.values(masterZones), function (zone, i) {
                            zonesList.push({ id: i, text: zone, Active: checkListForValue(techProfile.Zones, zone) });
                        });
                        _.each(techProfile.Zones, function (zone) {
                            var found = _.find(zonesList, function (row) {
                                return zone === row.text;
                            });
                            if (found !== undefined && found !== null) {
                                found.Active = true;
                            }
                        });
                        displaySelector();
                    });

                    $el.find('.hour').select2({
                        placeholder: "Hour",
                        data: { results: hours, text: 'text' },
                        formatSelection: format,
                        formatResult: format
                    });

                    $el.find('.minute').select2({
                        placeholder: "Minute",
                        data: { results: mins, text: 'text' },
                        formatSelection: format,
                        formatResult: format
                    });

                    $el.on('change', '.hour', updateSummary);
                    $el.on('change', '.minute', updateSummary);
                    $el.on('change', '#slots', updateSummary);

                    $el.find('#startMinute').select2("data", { id: techProfile.startMinute, text: techProfile.startMinute });
                    $el.find('#endMinute').select2("data", { id: techProfile.endMinute, text: techProfile.endMinute });
                    $el.find('#startHour').select2("data", { id: techProfile.startHour, text: techProfile.startHour });
                    $el.find('#endHour').select2("data", { id: techProfile.endHour, text: techProfile.endHour });
                    $el.find('#slots').val(techProfile.slots);
                    // Below code added by Gurpreet
                    $el.find('#maxjobs').val(techProfile.maxJobs);
                    updateSummary();

                    $el.on('click', '.zoneDelete', function () {
                        var id = $(this).data('id');
                        _.find(zonesList, function (row) {
                            return id === row.id;
                        }).Active = false;
                        displaySelector();
                    });

                    // Technician Type
                    $el.on('change', '#zoneAdd', function (e) {
                        var newZone = _.find(notActive(zonesList), function (p) {
                            return String(p.id) === e.val;
                        });
                        newZone.UserId = UserId;
                        newZone.Active = true;
                        displaySelector();
                    });

                    $el.on('click', '#techSave:not(".ban")', function () {
                        var techProfile = {
                            startHour: $el.find('#startHour').select2("val"),
                            startMinute: $el.find('#startMinute').select2("val"),
                            endHour: $el.find('#endHour').select2("val"),
                            endMinute: $el.find('#endMinute').select2("val"),
                            slots: $el.find('#slots').val(),
                            maxJobs: $el.find('#maxjobs').val(), // Added By Gurpreet
                            Internal: $el.find('input[name=type]:checked').val(),
                            Zones: _.map(isActive(zonesList), function (x) {
                                return x.text;
                            }),
                            UserId: UserId
                        };
                        $.ajax({
                            type: 'POST',
                            contentType: 'application/json',
                            url: url.resolve("/Service/TechnicianDiaries/Save"),
                            data: JSON.stringify(techProfile),
                            success: function () {
                                notification.show('Technician Profile changes saved', 'Changes Saved');
                            },
                            error: function () {
                                alert('There was an error while saving.', 'Save Failed');
                            }
                        });
                    });
                };

                events.on('Admin.User.Profile.Remove', function (profileId, UserId, profileRemoved) {
                    var userProfile = { UserId: UserId, ProfileId: profileId };
                    $.ajax({
                        type: 'POST',
                        contentType: 'application/json',
                        url: url.resolve("/Service/TechnicianDiaries/RemoveProfile"),
                        data: JSON.stringify(userProfile),
                        success: function (data) {
                            if (!data.removeProfile) {
                                alert('Unable to remove profile due to open Requests', 'Remove Profile');
                                profileRemoved(false);

                            } else {
                                profileRemoved(true);
                            }
                        }
                    });
                });

                $.ajax({
                    type: 'POST',
                    url: url.resolve("/Service/TechnicianDiaries/Get/" + UserId),
                    success: function (techProfile) {
                        if (techProfile !== null) {
                            techProfile.edit = $el.data('edit');
                            $el.html(_.template(techProfileTemplate, techProfile));
                            hookEvents(techProfile);
                        }
                    }
                });

            }
        };
    });

