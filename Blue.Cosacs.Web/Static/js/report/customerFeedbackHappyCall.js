/*global define*/
define(['underscore', 'url', 'angular', 'angularShared/app', 'notification', 'moment', 'angularShared/interceptor', 'angularShared/loader',
    'report/GenericReportResult', 'report/GenericService', 'angular.ui', 'angular.bootstrap', 'lib/select2'],

    function (_, url, angular, app, notification, moment, interceptor, loader, GenericReportResult, GenericService) {
        'use strict';
        return {
            init: function ($el) {
                var customerFeedbackHappyCallController = function ($scope, $anchorScroll, $location, xhr, GenericResultService, productHierarchySrv) {

                    $scope.dateResolvedFrom = null;
                    $scope.dateResolvedTo = null;
                    $scope.dateResolvedFromLabel = 'Date Resolved from';
                    $scope.dateResolvedToLabel = 'Date Resolved to';
                    $scope.technicians = [];

                    $scope.linkDatePicker = {
                        dateFormat: "D, d MM, yy",
                        changeMonth: true,
                        changeYear: true
                    };

                    $scope.hasPagination = true;
                    _.extend(GenericResultService.ServerParameters, $location.search(), {PageIndex: 0, PageSize: 250, PageCount: 0, ReportId: 'CustomerFeedbackHappyCall' });
                    $scope.filterParameters = GenericResultService.ServerParameters;

                    xhr.get(url.resolve('/Service/TechnicianDiaries/GetTechnicians'))
                        .success(function (data) {
                            $scope.technicians = data;
                        });

                    $scope.departments = productHierarchySrv.getHierarchyLevel(1);

                    $scope.$on(GenericResultService.EventsNames.onSearch, function (e, callBack) {
                        if (post()) {
                            return callBack(false);
                        }

                        return callBack(true);

                    });

                    $scope.$on(GenericResultService.EventsNames.onExport, function (e, callBack) {
                        if (post()) {
                            GenericResultService.ServerParameters.FileName = getFileName();

                            return callBack(false);
                        }

                        return callBack(true);
                    });

                    $scope.$on(GenericResultService.EventsNames.onClear, function () {
                        $scope.filterParameters.dateResolvedFrom = null;
                        $scope.filterParameters.dateResolvedTo = null;
                        $scope.filterParameters.branch = null;
                        $scope.filterParameters.storeType = null;
                        $scope.filterParameters.department = null;
                        $scope.filterParameters.TechnicianId = null;
                        
                    });

                    function getFileName() {
                        var fileName = moment().format('YYYYMMDD');
                        var firstDate = moment($scope.filterParameters.dateResolvedFrom);
                        var endDate = moment($scope.filterParameters.dateResolvedTo);

                        fileName += '_' + 'CustomerFeedback';
                        fileName += '_from-' + firstDate.format('YYYYMMDD');
                        fileName += '_to-' + endDate.format('YYYYMMDD');

                        if ($scope.filterParameters.branch) {
                            fileName += '_Branch-' + $scope.filterParameters.branch;
                        }

                        if ($scope.filterParameters.storeType) {
                            fileName += '_StoreType-' + $scope.filterParameters.storeType;
                        }

                        if ($scope.filterParameters.department) {
                            fileName += '_Department-' + $scope.filterParameters.department;
                        }

                        if ($scope.filterParameters.TechnicianId && $scope.filterParameters.TechnicianId !== '') {
                            fileName += '_technicianId-' + $scope.filterParameters.TechnicianId;
                        }

                        fileName += '.csv';

                        return fileName;
                    }

                    function validatePost() {
                        var msg = '';
                        var firstDate = moment($scope.filterParameters.dateResolvedFrom);
                        if (firstDate === null || !firstDate.isValid() || !($scope.filterParameters.dateResolvedFrom)) {
                            msg = 'Invalid ' + $scope.dateResolvedFromLabel + '<br>';                            
                        }

                        var endDate = moment($scope.filterParameters.dateResolvedTo);
                        if (endDate === null || !endDate.isValid() || !($scope.filterParameters.dateResolvedTo)) {
                            msg = msg + 'Invalid ' + $scope.dateResolvedToLabel;                           
                        }
                        
                        if (msg) {
                            notification.show(msg);
                            return { isValid: false };
                        }

                        return {
                            isValid: true,
                            firstDate: firstDate,
                            endDate: endDate,
                            branch: $scope.filterParameters.branch,
                            storeType: $scope.filterParameters.storeType,
                            department: $scope.filterParameters.department,
                            technicianId: ($scope.filterParameters.TechnicianId && $scope.filterParameters.TechnicianId !== '' ? $scope.filterParameters.TechnicianId : null)
                        };
                    }

                    function post() {
                        var validationResult = validatePost();

                        if (!validationResult.isValid) {
                            return false;
                        }

                        GenericResultService.ServerParameters.Filter = {
                            "DateFrom": validationResult.firstDate.format('YYYYMMDD'),
                            "DateTo": validationResult.endDate.format('YYYYMMDD'),
                            "StoreType": validationResult.storeType,
                            "Branch": validationResult.branch,
                            "Department": validationResult.department,
                            "TechnicianId": validationResult.technicianId
                        };

                        return true;
                    }
                };

                customerFeedbackHappyCallController.$inject = ['$scope', '$anchorScroll', '$location', 'xhr', 'GenericResultService', 'productHierarchySrv'];

                app().service('GenericResultService',['$rootScope', function ($rootScope) {
                    return GenericService($rootScope);
                }])
                    .controller('customerFeedbackHappyCallController', customerFeedbackHappyCallController)
                    .controller('GenericReportController', GenericReportResult);

                return angular.bootstrap($el, ['myApp']);
            }
        };
    });
