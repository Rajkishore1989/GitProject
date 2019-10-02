/*global define*/
define(['angular', 'angularShared/app', 'notification', 'moment', 'angularShared/interceptor', 'angularShared/loader',
    'report/GenericReportResult', 'report/GenericService', 'angular.ui', 'angular.bootstrap', 'lib/select2', 'jquery.ui'],

    function (angular, app, notification, moment, interceptor, loader, GenericReportResult, GenericService) {
        'use strict';
        return {
            init: function ($el) {
                var OutstandingServiceRequestsController = function ($scope, GenericResultService) {

                    //                    $scope.MasterData = {};
                    //                    $scope.MasterData.productGroupSource = JSON.parse($attrs.productGroupSource);
                    $scope.dateLoggedFrom = null;
                    $scope.dateLoggedTo = null;
                    $scope.dateAllocatedFrom = null;
                    $scope.dateAllocatedTo = null;
                    $scope.supplier = null;
                    $scope.technician = null;
                    $scope.status = null;
                    $scope.warrantyType = null;
                    $scope.moment = moment;
                    $scope.dateLoggedFromLabel = 'Date Logged from';
                    $scope.dateLoggedToLabel = 'Date Logged to';
                    $scope.dateAllocatedFromLabel = 'Date Allocated from';
                    $scope.dateAllocatedToLabel = 'Date Allocated to';
                    $scope.technicianLabel = 'Technician';
                    $scope.supplierLabel = 'Supplier';
                    $scope.statusLabel = 'Status';
                    $scope.warrantyTypeLabel = 'Warranty Type';
                    $scope.templatePath = "/Static/js/report/GenericTemplate.html";

                    $scope.linkDatePicker = {
                        dateFormat: "D, d MM, yy",
                        changeMonth: true,
                        changeYear: true
                    };

                    //                    $scope.setupProducts = function () {
                    //                        return {
                    //                            placeholder: "Select report type",
                    //                            allowClear: true,
                    //                            data: $scope.MasterData.productGroupSource
                    //                        };
                    //                    };

                    $scope.$on(GenericResultService.EventsNames.onSearch, function (e, callBack) {
                        var values = {
                            ReportId: '',
                            Filter: ''
                        };

                        if (post(values)) {
                            return callBack(false, values);
                        }
                        else {
                            return callBack(true, null);
                        }
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
                        else {
                            return callBack(true, null);
                        }
                    });

                    $scope.$on(GenericResultService.EventsNames.onClear, function () {
                        $scope.dateLoggedFrom = null;
                        $scope.dateLoggedTo = null;
                    });

                    function getFileName() {
                        var fileName = moment().format('YYYYMMDD');
                        var fromDate = $scope.moment($scope.dateLoggedFrom);
                        var toDate = $scope.moment($scope.dateLoggedTo);

                        fileName += '_' + 'OutstandingServiceRequestsReport';
                        fileName += '_from-' + fromDate.format('YYYYMMDD');
                        fileName += '_to-' + toDate.format('YYYYMMDD');
                        // reinstate - inspections "missing/unnecessary semicolon
                        //                        if ($scope.purchaseBranch !== null) { fileName += '_Brn-' + $scope.purchaseBranch };
                        //                        if ($scope.department !== null) { fileName += '_Dept-' + $scope.department };
                        //                        if ($scope.fascia !== null) { fileName += '_Fascia-' + $scope.fascia };
                        //                        if ($scope.technician !== null) { fileName += '_Tech-' + $scope.technician };
                        fileName += '.csv';

                        return fileName;
                    }

                    function validatePost() {
                        //remove moment from scope
                        var fromDate = $scope.moment($scope.dateLoggedFrom);
                        if (fromDate === null || !fromDate.isValid()) {
                            notification.show('Invalid ' + $scope.dateLoggedFromLabel);
                            return { isValid: false };
                        }

                        var toDate = $scope.moment($scope.dateLoggedTo);
                        if (toDate === null || !toDate.isValid()) {
                            notification.show('Invalid ' + $scope.dateLoggedToLabel);
                            return { isValid: false };
                        }

                        var purchaseBranch = $scope.purchaseBranch;
                        var department = $scope.department;
                        var fascia = $scope.fascia;
                        var technician = $scope.technician;

                        return {
                            isValid: true,
                            fromDate: fromDate,
                            toDate: toDate,
                            purchaseBranch: purchaseBranch,
                            department: department,
                            fascia: fascia,
                            technician: technician
                        };
                    }

                    function post(values) {
                        var validationResult = validatePost();

                        if (!validationResult.isValid) {
                            return false;
                        }

                        values.ReportId = 'OutstandingServiceRequests';
                        values.Filter = {
                            "@dateLoggedFrom": validationResult.fromDate.format('YYYYMMDD'),
                            "@dateLoggedTo": validationResult.toDate.format('YYYYMMDD'),
                            "@technicianName": validationResult.technician

                        };

                        return true;
                    }
                };

                OutstandingServiceRequestsController.$inject = ['$scope', 'GenericResultService'];

                app().service('GenericResultService', ['$rootScope', function ($rootScope) {
                    return GenericService($rootScope);
                } ])
                .controller('OutstandingServiceRequestsController', OutstandingServiceRequestsController)
                .controller('GenericReportController', GenericReportResult);

                return angular.bootstrap($el, ['myApp']);
            }
        };
    });