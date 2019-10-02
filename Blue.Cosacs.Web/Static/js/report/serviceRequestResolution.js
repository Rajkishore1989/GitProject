/*global define*/
define(['underscore', 'angular', 'angularShared/app', 'notification', 'moment', 'report/GenericReportResult', 'report/GenericService',
        'd3', 'd3charts/ResolutionReportBarChart','angular.ui', 'angular.bootstrap'],

    function (_, angular, app, notification, moment, GenericReportResult, GenericService, d3, chart) {
        'use strict';

        return {
            init: function ($el) {
                var resolutionController = function ($scope, $anchorScroll, $location, GenericResultService, xhr, padFilter, $q, productHierarchySrv) {

                    $scope.hasPagination = true;
                    _.extend(GenericResultService.ServerParameters, $location.search(), { PageIndex: 0, PageCount: 0, ReportId: 'Resolution' });
                    $scope.filterParameters = GenericResultService.ServerParameters;
                    $scope.financialYearLabel = 'Financial Year';
                    $scope.weekNoFromLabel = 'Week No. from';
                    $scope.weekNoToLabel = 'Week No. to';
                    $scope.resolutionLabel = 'Resolution';
                    $scope.CategoryLabel = "Department";

                    $scope.CharData = null;
                    $scope.chartVisible = false;
                    $scope.numberOfEmptyElementsFoundInChart = 0;

                    moment.lang('en-GB', {
                        week: {
                            dow: 1 // Monday is the first day of the week
                        }
                    });

                    $scope.categories = productHierarchySrv.getHierarchyLevel(2);

                    $scope.sources = function () {
                        return { 'Installation': 'Installations', 'Service Request': 'Service Request', 'Sales Order': 'Sales Order' };
                    };

                    $scope.filterParameters = $location.search();

                    var hideEmptyCategory =  function (data) {
                        $scope.numberOfEmptyElementsFoundInChart = 0;
                        for (var i = 0 ; i < data.length; i++) {
                            if (data[i].name.length === 0) {
                                $scope.numberOfEmptyElementsFoundInChart = data[i].value;
                                data.splice(i, 1);
                                break;
                            }
                        }
                        return data;
                    };
                    
                    var createChart = function (scope, data) {
                        if (!data){return;}
                        data = hideEmptyCategory(data);
                        chart(data, scope.filterParameters.resolution); // create chart
                        scope.CharData = data; // save chart data
                    };

                    var deleteChart = function (scope) {
                        d3.select("svg").remove(); // clean chart svg
                        scope.CharData = null; // clean chart data
                    };

                    $scope.$on(GenericResultService.EventsNames.onAfterDisplay, function (e, args) {
                        if ($scope.filterParameters.resolution) {
                            args.ChartData = args.ChartData || {};
                            createChart($scope, args.ChartData);
                        } else {
                            deleteChart($scope);
                        }
                    });

                    var safeApply = function (fn) {
                        var phase = $scope.$root.$$phase;
                        if (phase === '$apply' || phase === '$digest') {
                            $scope.$eval(fn);
                        } else {
                            $scope.$apply(fn);
                        }
                    };

                    $scope.$watch(function (scope) {
                        return scope.filterParameters.resolution;
                    }, function () {
                        safeApply(function () {
                            deleteChart($scope);
                        });
                    });

                    $scope.$on(GenericResultService.EventsNames.onSearch, function (e, callBack) {

                        var values = {
                            ReportId: '',
                            Filter: ''
                        };

                        if (post(values)) {
                            GenericResultService.ServerParameters.Filter = values.Filter;
                            return callBack(false);
                        }

                        return callBack(true, null);
                    });

                    $scope.$on(GenericResultService.EventsNames.onExport, function (e, callBack) {
                        var values = {
                            ReportId: '',
                            Filter: '',
                            FileName: ''
                        };

                        if (post(values)) {
                            values.FileName = getFileName();
                            return callBack(false, values);
                        }

                        return callBack(true, null);
                    });

                    $scope.$on(GenericResultService.EventsNames.onClear, function () {
                        $scope.filterParameters.financialYear = null;
                        $scope.filterParameters.financialYear = null;
                        $scope.filterParameters.weekNoFrom = null;
                        $scope.filterParameters.weekNoTo = null;
                        $scope.filterParameters.resolution = null;
                        $scope.filterParameters.category = null;
                    });

                    function getFileName() {
                        var validationResult = validatePost();
                        var fileName = moment().format('YYYYMMDD');

                        if (!validationResult.isValid) {
                            return '';
                        }

                        fileName += '_' + 'Resolution';
                        fileName += '_year-' + validationResult.year;
                        fileName += '_weekFrom-' + validationResult.fromWeek;
                        fileName += '_weekTo-' + validationResult.toWeek;

                        if (validationResult.category) {
                            fileName += '_category-' + validationResult.category;
                        }
                        if (validationResult.resolution) {
                            fileName += '_resolution-' + validationResult.resolution;
                        }

                        fileName += '.csv';

                        return fileName;
                    }

                    function validatePost() {
                        var weekNoFrom = $scope.filterParameters.weekNoFrom || -1;
                        var weekNoTo = $scope.filterParameters.weekNoTo || -1;

                        var msg = validateYear($scope.filterParameters.financialYear, $scope.financialYearLabel);
                        msg += validateWeekNo(weekNoFrom, $scope.weekNoFromLabel);
                        msg += validateWeekNo(weekNoTo, $scope.weekNoToLabel);

                        if (msg) {
                            notification.show(msg);
                            return { isValid: false };
                        }

                        return {
                            isValid: true,
                            year: $scope.filterParameters.financialYear,
                            fromWeek: $scope.filterParameters.weekNoFrom ,
                            toWeek: $scope.filterParameters.weekNoTo,
                            resolution: $scope.filterParameters.resolution,
                            category: $scope.filterParameters.category
                        };
                    }

                    function post(values) {
                        var validationResult = validatePost();

                        if (!validationResult.isValid) {
                            return false;
                        }

                        values.ReportId = 'Resolution';

                        values.Filter = {
                            "@Year": validationResult.year,
                            "@FromWeekNo": validationResult.fromWeek,
                            "@ToWeekNo": validationResult.toWeek,
                            "@Resolution": validationResult.resolution || null,
                            "@Category": validationResult.category || null
                        };

                        return true;
                    }

                    function validateWeekNo(weekNo, lbl) {
                        if (weekNo < 1 || weekNo > 52) {
                            return 'Invalid ' + lbl + ', Week No. should be in the range of 1 to 52<br>';
                        }

                        return '';
                    }

                    function validateYear(year, lbl) {
                        var firstDate = moment(year);
                        if (firstDate === null || !firstDate.isValid() || !(year)) {
                            return 'Invalid ' + lbl + '<br>';
                        }

                        return '';
                    }

                };

                resolutionController.$inject = ['$scope', '$anchorScroll', '$location', 'GenericResultService', 'xhr', 'padFilter', '$q', 'productHierarchySrv'];

                app().service('GenericResultService',['$rootScope', function ($rootScope) {
                    return GenericService($rootScope);
                }])
                .service('controllerRouting', function () {
                    return {
                        exportUrl: '/Report/ServiceRequestResolution/GenericReportExport',
                        reportUrl: '/Report/ServiceRequestResolution/GenericReport'
                    };
                })
                .controller('resolutionController', resolutionController)
                .controller('GenericReportController', GenericReportResult);

                return angular.bootstrap($el, ['myApp']);
            }

        };
    });