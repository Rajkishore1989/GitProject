/* global define */
define(['angular', 'underscore', 'jquery', 'url', 'd3charts/d3LineChart', 'notification', 'angularShared/app',
    'angular.ui', 'angular.bootstrap', 'lib/select2', 'jquery.ui', 'lib/jquery.containsCaseInsensitive', 'tooltip'],
    function (angular, _, $, url, lineChart, notification, app) {
        "use strict";
        return {
            init: function ($el) {
                var WeeklySummaryController = function ($scope, $attrs, $dialog, xhr, productHierarchySrv) {
                    $scope.MasterData = {};
                    $scope.MasterData.productGroupSource = JSON.parse($attrs.productGroupSource);
                    $scope.MasterData.defaultYear = parseInt($attrs.year, 10);

                    var currentWeek = parseInt($attrs.week, 10);
                    currentWeek = (currentWeek < 1) ? 1 : currentWeek;
                    var previousWeek = (currentWeek < 2) ? 1 : currentWeek - 1;

                    $scope.department = '';
                    $scope.firstWeek = previousWeek;
                    $scope.lastWeek = currentWeek;
                    $scope.year = $scope.MasterData.defaultYear;
                    $scope.queryResults = null;
                    $scope.resultsVisible = "hidden";
                    $scope.Math = window.Math;

                    var othersChart = lineChart({
                        xAxisProperty: 'Week',
                        yAxisLabel: 'Number of SR',
                        parentSelector: "#chart1",
                        chartTitle: "Number of Service Requests per Week"
                    });

                    var sevenDaysChart = lineChart({
                        xAxisProperty: 'Week',
                        yAxisLabel: '7 Day %',
                        parentSelector: "#chart2",
                        chartTitle: "% Service Requests closed within 7 days"
                    });

                    var more20DaysCharDataChart = lineChart({
                        xAxisProperty: 'Week',
                        yAxisLabel: 'JOBS > 20 DAYS',
                        parentSelector: "#chart3",
                        chartTitle: "Number of Jobs that took more than 20 Days per Week"
                    });

                    var tatChart = lineChart({
                        xAxisProperty: 'Week',
                        yAxisLabel: 'Average TAT (days)',
                        parentSelector: "#chart4",
                        chartTitle: "Average TAT (days) per Week"
                    });

                    $scope.setupProducts = function () {
                        return {
                            placeholder: "Select report type",
                            allowClear: true,
                            data: $scope.MasterData.productGroupSource
                        };
                    };

                    $scope.departments = productHierarchySrv.getHierarchyLevel(1);

                    $scope.fisrtWeekChange = function () {
                        if ($scope.lastWeek < $scope.firstWeek) {
                            $scope.lastWeek = $scope.firstWeek;
                        }
                    };

                    $scope.queryHasValue = function (ctrl) {

                        var hasValue = !($scope.queryResults === undefined || $scope.queryResults === null ||
                            $scope.queryResults.length === 0);
                        if (ctrl === 'table') {
                            if (hasValue) {
                                return "visible";
                            }
                            return "hidden";
                        }

                        if (hasValue || $scope.resultsVisible === "hidden") {
                            return "hidden";
                        }
                        return "visible";
                    };

                    $scope.clear = function () {
                        $scope.resultsVisible = "hidden";
                        $scope.year = $scope.MasterData.defaultYear;
                        $scope.department = '';
                        $scope.firstWeek = 1;
                        $scope.lastWeek = 1;
                        $scope.queryResults = null;

                        clearCharts();
                    };

                    function clearCharts() {
                        othersChart.clear();
                        sevenDaysChart.clear();
                        more20DaysCharDataChart.clear();
                        tatChart.clear();
                    }

                    $scope.exportResults = function () {
                        if (!validatePost()) {
                            return false;
                        }

                        var urlToFile = 'Report/WeeklySummary/Export?firstWeek=' +
                            $scope.firstWeek +
                            '&lastWeek=' +
                            $scope.lastWeek +
                            '&year=' +
                            $scope.year +
                            '&productgroup=' +
                            encodeURIComponent($scope.department === null ? '' : $scope.department);

                        return url.open(urlToFile);
                    };

                    function validatePost() {

                        var year = parseInt($scope.year, 10);
                        var w1 = parseInt($scope.firstWeek, 10);
                        var w2 = parseInt($scope.lastWeek, 10);

                        if (isNaN(year)) {
                            notification.show('Invalid Year.');
                            return false;
                        }

                        if (isNaN(w1)) {
                            notification.show('Invalid Initial Week.');
                            return false;
                        }
                        if (isNaN(w2)) {
                            notification.show('Invalid Final Week.');
                            return false;
                        }

                        if (w1 > w2) {
                            notification.show('Final Week must be greater or equal than Initial Week');
                            return false;
                        }

                        return true;
                    }

                    $scope.search = function () {
                        var values;

                        if (!validatePost()) {
                            $scope.queryResults = null;
                            return false;
                        }

                        values = {
                            year: $scope.year,
                            firstWeek: $scope.firstWeek,
                            lastWeek: $scope.lastWeek,
                            productgroup: $scope.department === null ? '' : $scope.department
                        };

                        function drawPreditionLine(){

                            _.each($('.chartContainer'), function(current){
                                var id = '#' + $(current).attr('id');
                                var div = $( id + ' #thesvg .x.axis g line')[$(id + ' #thesvg .x.axis g line').length - 3];

                                $(div).attr("y1", "-450");
                                $(div).attr("style", "stroke:rgb(255,0,0);stroke-width:4");
                            });
                        }

                        xhr({
                            method: 'GET',
                            url: url.resolve('Report/WeeklySummary/Filter'),
                            params: values
                        }).success(function (data) {

                                clearCharts();

                                if (data.Result === "ok") {
                                    $scope.queryResults = data.data;
                                    $scope.resultsVisible = "visible";

                                    if (_.size(data.data) > 0) {
                                        othersChart.render(data.CharData.Others);
                                        sevenDaysChart.render(data.CharData.SevenDays);
                                        more20DaysCharDataChart.render(data.CharData.More20Days);
                                        tatChart.render(data.CharData.Tat);

                                        if(data.DisplayPreditions){
                                            drawPreditionLine();
                                        }
                                    }
                                }
                                else {
                                    $scope.resultsVisible = "hidden";
                                    notification.show(data.Message);
                                }
                            });

                        return null;
                    };

                };

                WeeklySummaryController.$inject = ['$scope', '$attrs', '$dialog', 'xhr', 'productHierarchySrv'];

                app().controller('WeeklySummaryController', WeeklySummaryController);

                return angular.bootstrap($el, ['myApp']);
            }
        };
    });