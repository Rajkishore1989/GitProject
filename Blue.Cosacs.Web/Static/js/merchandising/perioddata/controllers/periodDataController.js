/*global define*/
define(['angular', 'jquery', 'underscore', 'url', 'pjax', 'alert', 'moment', 'notification'],
    function (angular, $, _, url, pjax, alert, moment, notification) {
        'use strict';

        function nextSunday(date) {
            return date.isoWeekday(7);
        }

        function lastDayOfMonth(date) {
            return date.endOf("month");
        }

        function firstofnextmonth(date) {
            return date.endOf("month").add(1, 'days');
        }

        function addPeriod(array, period, week, start, end) {
            array.push({
                PeriodNo: period,
                Week: week,
                StartDate: start.clone().format(moment.ISO_8601),
                EndDate: end.clone().format(moment.ISO_8601)
            });
            return array;
        }

        function generatePeriodData(year) {

            var period = 1,
                weekCount = 1,
                week = 1,
                startdate = moment(year + '-04-01'),
                enddate = startdate.clone(),
                sunday = startdate.clone(),
                lastDay = startdate.clone(),
                periodData = [];

            while (period < 13) {

                weekCount = 1;

                if (period === 1 || period === 4 || period === 7 || period === 10) {

                    while (weekCount < 6) {

                        sunday = nextSunday(startdate.clone());
                        lastDay = lastDayOfMonth(startdate.clone());

                        if (sunday.isAfter(lastDay) || weekCount === 5) {
                            enddate = lastDay.clone();
                        } else {
                            enddate = sunday.clone();
                        }

                        periodData = addPeriod(periodData, period, week, startdate, enddate);

                        if (enddate.add(1, 'days').isAfter(lastDay) || weekCount === 5) {
                            startdate = firstofnextmonth(startdate);
                        } else {
                            startdate = enddate;
                        }

                        week = week + 1;
                        weekCount = weekCount + 1;

                    }
                } else {

                    while (weekCount < 5) {

                        sunday = nextSunday(startdate.clone());
                        lastDay = lastDayOfMonth(startdate.clone());

                        if (sunday.isAfter(lastDay) || weekCount === 4) {
                            enddate = lastDay.clone();
                        } else {
                            enddate = sunday.clone();
                        }

                        periodData = addPeriod(periodData, period, week, startdate, enddate);

                        if (enddate.add(1, 'days').isAfter(lastDay) || weekCount === 4) {
                            startdate = firstofnextmonth(startdate);
                        } else {
                            startdate = enddate;
                        }

                        week = week + 1;
                        weekCount = weekCount + 1;
                    }

                }
                period = period + 1;
            }

            return periodData;
        }

        var periodDataController = function ($scope, $location, pageHelper, $http, $attrs, user) {

            //datepicker set format
            $scope.dateFormat = pageHelper.dateFormat;
            $scope.mytest = moment(new Date()).format("YYYY-MM-DD");
            //track errors to disable save button
            $scope.error = false;

            var generatedYears = [];

            $scope.readonly = !user.hasPermission('PeriodDataEdit');

            //Get the Current Years
            var thisYear = new Date().getMonth() < 3 ? new Date().getFullYear() - 1 : new Date().getFullYear(),
                nextYear = thisYear + 1,
                lastYear = thisYear - 1;

            $scope.Years = [lastYear, thisYear, nextYear];

            //Years returned from Model
            var allYearsData = JSON.parse($attrs.merchandisingData || '{ "year": 0, "periods": [] }');

            //populate years
            _.each(allYearsData, function (current) {
                if (current.periods.length < 1) {
                    current.periods = generatePeriodData(current.year);
                    generatedYears.push(current.year);
                }
                _.each(current.periods, function (p) {
                    p.StartDate = moment(p.StartDate).format("YYYY-MM-DD");
                    p.EndDate = moment(p.EndDate).format("YYYY-MM-DD");
                });
            });

            //split years
            var thisYearsData = $.grep(allYearsData, function (e) {
                    return e.year == thisYear;
                })[0],
                nextYearsData = $.grep(allYearsData, function (e) {
                    return e.year == nextYear;
                })[0],
                lastYearsData = $.grep(allYearsData, function (e) {
                    return e.year == lastYear;
                })[0];

            //Set scope to current year
            $scope.periodData = thisYearsData;
            $scope.Year = $scope.periodData.year;


            //Watch for changes to drop down and update model to reflect year
            $scope.$watch('Year', function (val) {

                if (val != $scope.periodData.year) {
                    if (val == thisYear) {
                        $scope.periodData = thisYearsData;
                    }
                    if (val == nextYear) {
                        $scope.periodData = nextYearsData;
                    }
                    if (val == lastYear) {
                        $scope.periodData = lastYearsData;
                    }
                    $scope.Year = $scope.periodData.year;
                }
            });


            $scope.$watch('periodData.periods', function (val) {

                $scope.error = false;

                var p;

                for (p in $scope.periodData.periods) {
                    var thisFrom = moment($scope.periodData.periods[parseInt(p, 10)].StartDate).startOf('day'),
                        thisTo = moment($scope.periodData.periods[parseInt(p, 10)].EndDate).startOf('day'),
                        prevTo,
                        nextFrom;
                    //need to handle last period
                    if (p < $scope.periodData.periods.length - 1) {
                        nextFrom = moment($scope.periodData.periods[parseInt(p, 10) + 1].StartDate).startOf('day');
                    } else {
                        nextFrom = moment(thisTo).startOf('day');
                        nextFrom.add(1, 'days');
                    }
                    //handle first period
                    if (p > 0) {
                        prevTo = moment($scope.periodData.periods[parseInt(p, 10) - 1].EndDate).startOf('day');
                    } else {
                        prevTo = moment(thisFrom).startOf('day');
                        prevTo.add(-1, 'days');
                    }

                    //End date before Start Date
                    if (thisTo.diff(thisFrom, 'days') < 0) {
                        $scope.error = true;
                        $("#week_" + p + "_EndDate").addClass("has-error");

                    } else {
                        if ($("#week_" + p + "_EndDate").hasClass("has-error")) {
                            $("#week_" + p + "_EndDate").removeClass("has-error");
                        }

                    }

                    //Next start date does not follow on from this end date
                    if (thisFrom.diff(prevTo, 'days') !== 1) {
                        $scope.error = true;
                        $("#week_" + p + "_StartDate").addClass("has-error");

                    } else {
                        if ($("#week_" + p + "_StartDate").hasClass("has-error")) {
                            $("#week_" + p + "_StartDate").removeClass("has-error");
                        }

                    }

                    //First Day of Year
                    if (p === '0') {
                        var firstDay = moment(thisFrom.year() + '-04-01');
                        if (thisFrom.diff(firstDay, 'days') !== 0) {
                            $scope.error = true;
                            $("#week_" + p + "_StartDate").addClass("has-error");

                        } else {
                            if ($("#week_" + p + "_StartDate").hasClass("has-error")) {
                                $("#week_" + p + "_StartDate").removeClass("has-error");
                            }
                        }
                    }

                    //Last Day of year
                    if (p == $scope.periodData.periods.length - 1) {
                        var lastDay = moment(thisFrom.year() + '-03-31');
                        if (thisTo.diff(lastDay, 'days') !== 0) {
                            $scope.error = true;
                            $("#week_" + p + "_EndDate").addClass("has-error");

                        } else {
                            if ($("#week_" + p + "_EndDate").hasClass("has-error")) {
                                $("#week_" + p + "_EndDate").removeClass("has-error");
                            }
                        }
                    }
                }

            }, true);

            $scope.checkErrors = function () {

                return $scope.error;

            };

            $scope.save = function () {

                $http.post(url.resolve('/Merchandising/PeriodData/Save'), $scope.periodData)
                    .success(function (data) {
                        if (data.error) {
                            alert("There was an error saving the period data.");
                        } else {
                            notification.show('Period data saved successfully.');
                            for (var i = 0; i < generatedYears.length; i++) {
                                if (generatedYears[i] === $scope.Year) {
                                    generatedYears.splice(i, 1);
                                }
                            }
                        }
                    });


            };

            $scope.dateGenerated = function () {
                for (var i = 0; i < generatedYears.length; i++) {
                    if (generatedYears[i] === $scope.Year) {
                        return true;
                    }
                }
                return false;
            };
        };
        return periodDataController;
    });