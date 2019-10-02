/*global define*/
define(['underscore', 'angular', 'angularShared/app', 'notification', 'moment', 'angularShared/interceptor',
        'angularShared/loader', 'jquery.pickList', 'report/GenericReportResult', 'report/GenericService', 'url',
        'angular.ui', 'angular.bootstrap', 'lib/select2', 'jquery.ui'],

    function (_, angular, app, notification, moment, interceptor, loader, pickList, GenericReportResult, genericService, url) {
        'use strict';
        return {
            init: function ($el) {
                var DeliveryPerformanceSummaryController = function ($scope, GenericResultService, $location, xhr) {
                    $scope.moment = moment;
                    $scope.pivotLabel = 'Pivot';
                    $scope.deliveryTypeLabel = 'Delivery Type';
                    $scope.dateTypeLabel = 'Date Type';
                    $scope.dateFromLabel = 'Ordered/Delivered from';
                    $scope.dateToLabel = 'Ordered/Delivered to';
                    $scope.templatePath = "/Static/js/report/GenericTemplate.html";

                    $scope.linkDatePicker = {
                        dateFormat: "D, d MM, yy",
                        changeMonth: true,
                        changeYear: true
                    };

                    _.extend(GenericResultService.ServerParameters, $location.search(), { PageIndex: 0, PageSize: 250, PageCount: 0, ReportId: 'DeliveryPerformanceSummary'});
                    $scope.filterParameters = GenericResultService.ServerParameters;

                    $scope.hasPagination = false;

                    $scope.filterParameters.pivot = null;
                    $scope.filterParameters.deliveryType = null;
                    $scope.filterParameters.dateType = null;
                    $scope.filterParameters.dateFrom = null;
                    $scope.filterParameters.dateTo = null;

                    var safeApply = function (fn) {
                        var phase = $scope.$root.$$phase;
                        if (phase === '$apply' || phase === '$digest') {
                            $scope.$eval(fn);
                        } else {
                            $scope.$apply(fn);
                        }
                    };

                    $scope.select2Options = {
                        allowClear: true
                    };

                    $scope.$on(GenericResultService.EventsNames.onSearch, function (e, callBack) {
                        if (post()) {
                            return callBack(false);
                        }
                        else {
                            return callBack(true);
                        }
                    });

                    $scope.$on(GenericResultService.EventsNames.onExport, function (e, callBack) {

                        if (post()) {
                            GenericResultService.ServerParameters.FileName = getFileName();
                            return callBack(false);
                        }
                        else {
                            return callBack(true);
                        }
                    });

                    $scope.$on(GenericResultService.EventsNames.onClear, function () {
                        $scope.filterParameters.pivot = null;
                        $scope.filterParameters.deliveryType = null;
                        $scope.filterParameters.dateType = null;
                        $scope.filterParameters.dateFrom = null;
                        $scope.filterParameters.dateTo = null;
                    });

                    function getFileName() {
                        var fileName = moment().format('YYYYMMDD');
                        var pivot = $scope.filterParameters.pivot;
                        var deliveryType = $scope.filterParameters.deliveryType;
                        var dateType = $scope.filterParameters.dateType;
                        var fromDate = $scope.moment($scope.filterParameters.dateFrom);
                        var toDate = $scope.moment($scope.filterParameters.dateTo);

                        
                        fileName += '_' + 'DeliveryPerformanceSummaryReport';
                        fileName += '_pivot-' + pivot;
                        fileName += '_deliveryType-' + deliveryType;
                        fileName += '_dateType-' + dateType;
                        fileName += '_from-' + fromDate.format('YYYYMMDD');
                        fileName += '_to-' + toDate.format('YYYYMMDD');
                        fileName += '.csv';

                        return fileName;
                    }

                    function validatePost() {
                        //remove moment from scope
                        var pivot = $scope.filterParameters.pivot;
                        var deliveryType = $scope.filterParameters.deliveryType;
                        var dateType = $scope.filterParameters.dateType;
                        var fromDate = !$scope.filterParameters.dateFrom ? null : $scope.moment($scope.filterParameters.dateFrom);
                        var toDate = !$scope.filterParameters.dateTo ? null : $scope.moment($scope.filterParameters.dateTo);

                        var msg = validateField(pivot, $scope.pivotLabel);
                        msg += validateField(deliveryType, $scope.deliveryTypeLabel);
                        msg += validateField(dateType, $scope.dateTypeLabel);
                        msg += validateDate(fromDate, $scope.dateFromLabel);
                        msg += validateDate(toDate, $scope.dateToLabel);

                        if (msg) {
                            notification.show(msg);
                            return { isValid: false };
                        }

                        return {
                            isValid: true,
                            pivot: pivot,
                            deliveryType: deliveryType,
                            dateType: dateType,
                            fromDate: fromDate,
                            toDate: toDate
                        };
                    }

                    function post() {
                        var validationResult = validatePost();

                        if (!validationResult.isValid) {
                            return false;
                        }

                        GenericResultService.ServerParameters.Filter = {
                            "pivot": validationResult.pivot,
                            "deliveryType": validationResult.deliveryType,
                            "dateType": validationResult.dateType,
                            "dateFrom": validationResult.fromDate.format('YYYYMMDD'),
                            "dateTo": validationResult.toDate.format('YYYYMMDD')
                        };

                        return true;
                    }

                    function validateDate(date, lbl) {
                        var inputDate = moment(date);

                        if (inputDate === null || !inputDate.isValid() || !(date)) {
                            return 'Invalid ' + lbl + '<br>';
                        }

                        return '';
                    }

                    function validateField(field, lbl) {

                        if (field === null) {

                            return 'Invalid ' + lbl + '<br>';
                        }

                        return '';
                    }

                };

                DeliveryPerformanceSummaryController.$inject = ['$scope', 'GenericResultService', '$location', 'xhr'];

                app().factory('GenericResultService', ['$rootScope', function ($rootScope) {
                    return genericService($rootScope);
                } ])
                    .controller('DeliveryPerformanceSummaryController', DeliveryPerformanceSummaryController)
                    .controller('GenericReportController', GenericReportResult);

                return angular.bootstrap($el, ['myApp']);
            }
        };
    });