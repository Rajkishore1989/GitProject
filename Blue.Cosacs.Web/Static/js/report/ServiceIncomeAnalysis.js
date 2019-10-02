/*global define*/
define(['angular', 'underscore', 'angularShared/app', 'notification', 'moment', 'angularShared/interceptor', 'angularShared/loader',
    'report/GenericReportResult', 'report/GenericService', 'jquery.pickList',
    'lib/select2', 'angular.ui', 'angular.bootstrap'],

    function (angular, _, app, notification, moment, interceptor, loader, GenericReportResult, GenericService) {
        'use strict';
        return {
            init: function ($el) {
                var serviceIncomeAnalysisController = function ($scope, $anchorScroll, $location, GenericResultService) {

                    _.extend(GenericResultService.ServerParameters, $location.search(), { PageIndex: 0, PageSize: 250, PageCount: 0, ReportId: 'ServiceIncomeAnalysis' });
                    $scope.filterParameters = GenericResultService.ServerParameters;

                    $scope.datePurchaseFrom = null;
                    $scope.datePurchaseTo = null;
                    $scope.month = null;
                    $scope.year = null;
                    $scope.period = "MTD";

                    $scope.purchaseFromLabel = 'Purchase date from:';
                    $scope.purchaseToLabel = 'Purchase date to:';

                    $scope.year = (new Date()).getFullYear();
                    var currentMonth = (new Date()).getMonth() + 1;
                    if (currentMonth <= 3) {
                        $scope.year = $scope.year - 1;
                    }
                    // set financial month dropdown 
                    if (currentMonth > 3) {
                        $scope.month = (currentMonth - 3).toString();
                    }
                    else {
                        $scope.month = (currentMonth + 9).toString();
                    }

                    $scope.linkDatePicker = {
                        dateFormat: "D, d MM, yy",
                        changeMonth: true,
                        changeYear: true
                    };

                    $scope.periods = {
                        "MTD": "Month to Date",
                        "YTD": "Financial Year to Date"
                    };

                    $scope.months = {
                        "1": "April",
                        "2": "May",
                        "3": "June",
                        "4": "July",
                        "5": "August",
                        "6": "September",
                        "7": "October",
                        "8": "November",
                        "9": "December",
                        "10": "January",
                        "11": "February",
                        "12": "March"
                    };

                    function removeColumn(index) {
                        if (index != -1) {
                            $('table tr').find('td:eq("' + index + '"),th:eq("' + index + '")').remove();
                        }
                    }

                    $scope.$on(GenericResultService.EventsNames.onAfterDisplay, function (e, args) {

                        if (args.Data.length > 1) {

                            removeColumn($("table thead tr th:contains('CatOrder')").index());
                            removeColumn($("table thead tr th:contains('PgOrder')").index());
                        }
                    });

                    $scope.$on(GenericResultService.EventsNames.onSearch, function (e, callBack) {
                        if (post()) {
                            return callBack(false);
                        }

                        return callBack(true);
                    });

                    $scope.$on(GenericResultService.EventsNames.onExport, function (e, callBack) {
                        var values = $scope.filterParameters;
                        if (post()) {
                            values.FileName = getFileName();
                            return callBack(false, values); // no errors
                        } else {
                            return callBack(true, null); // signal error
                        }
                    });

                    $scope.$on(GenericResultService.EventsNames.onClear, function () {
                        $scope.period = '';
                        $scope.year = '';
                        $scope.month = '';
                        $scope.datePurchaseFrom = null;
                        $scope.datePurchaseTo = null;
                    });

                    function getFileName() {
                        var fileName = moment().format('YYYYMMDD');
                        var firstDate = moment($scope.datePurchaseFrom);
                        var endDate = moment($scope.datePurchaseTo);

                        fileName += '_' + 'ServiceIncome';
                        fileName += '_Period-' + $scope.period;
                        fileName += '_fy-' + $scope.year;
                        fileName += '_fm-' + $scope.month;
                        if ($scope.datePurchaseFrom !== null && $scope.datePurchaseFrom!== "") {
                            fileName += '_datefrom-' + moment($scope.datePurchaseFrom).format('YYYYMMDD');
                        }
                        if ($scope.datePurchaseTo !== null && $scope.datePurchaseTo !== "") {
                            fileName += '_dateto-' + moment($scope.datePurchaseTo).format('YYYYMMDD');
                        }
                        fileName += '.csv';

                        return fileName;
                    }

                    function validatePost() {

                        var year = parseInt($scope.year, 10);
                        var month = parseInt($scope.month, 10);

                        if ($scope.period === null) {
                            notification.show('Invalid Period');
                            return false;
                        }

                        if (isNaN(year)) {
                            notification.show('Invalid Year.');
                            return false;
                        }

                        if (isNaN(month)) {
                            notification.show('Invalid Month.');
                            return false;
                        }

                        var firstDate = $scope.datePurchaseFrom;
                        var endDate = $scope.datePurchaseTo;

                        return {
                            isValid: true,
                            period: $scope.period,
                            year: $scope.year,
                            month: $scope.month,
                            dateFrom: firstDate,
                            dateTo: endDate
                        };
                    }

                    function post() {
                        var validationResult = validatePost();

                        if (!validationResult.isValid) {
                            return false;
                        }

                        GenericResultService.ServerParameters.Filter = {
                            "Period": validationResult.period,
                            "Year": validationResult.year,
                            "Month": validationResult.month,
                            "DateFrom": validationResult.dateFrom,
                            "DateTo": validationResult.dateTo
                        };
                        return true;
                    }
                };

                serviceIncomeAnalysisController.$inject = ['$scope', '$anchorScroll', '$location', 'GenericResultService'];

                app().service('GenericResultService', ['$rootScope', function ($rootScope) {
                    return GenericService($rootScope);
                } ])
                 .service('controllerRouting', function () {
                     return {
                         exportUrl: '/Report/serviceIncomeAnalysis/GenericReportExport',
                         reportUrl: '/Report/serviceIncomeAnalysis/GenericReport'
                     };
                 })
                    .controller('serviceIncomeAnalysisController', serviceIncomeAnalysisController)
                    .controller('GenericReportController', GenericReportResult);

                return angular.bootstrap($el, ['myApp']);
            }
        };
    });
