/*global define*/
define(['url', 'underscore', 'angular', 'angularShared/app', 'notification', 'moment', 'angularShared/interceptor', 'angularShared/loader',
    'report/GenericReportResult', 'report/GenericService', 'angular.ui', 'angular.bootstrap'],

    function (url, _, angular, app, notification, moment, interceptor, loader, GenericReportResult, GenericService) {
        'use strict';
        return {
            init: function ($el) {
                var installationHitRateController = function ($scope, $anchorScroll, $location, GenericResultService, xhr, productHierarchySrv) {
                    $scope.hasPagination = true;
                    _.extend(GenericResultService.ServerParameters, $location.search(), { PageIndex: 0, PageSize: 250, PageCount: 0, ReportId: 'InstallationHitRate' });
                    $scope.filterParameters = GenericResultService.ServerParameters;

                    $scope.datePurchaseFromLabel = 'Date of Purchase from';
                    $scope.datePurchaseToLabel = 'Date of Purchase to';

                    $scope.linkDatePicker = {
                        dateFormat: "D, d MM, yy",
                        changeMonth: true,
                        changeYear: true
                    };

                    $scope.departmentList = productHierarchySrv.getHierarchyLevel(1);
                    $scope.categoryList = productHierarchySrv.getHierarchyLevel(2);

                    $scope.$on(GenericResultService.EventsNames.onSearch, function (e, callBack) {
                        if (getPostValues()) {
                            return callBack(false);
                        }

                        return callBack(true);
                    });

                    var getExportFileName = function () {
                        var fileName = moment().format('YYYYMMDD');
                        var dateFrom = moment($scope.filterParameters.dateFrom);
                        var dateTo = moment($scope.filterParameters.dateTo);

                        fileName += '_' + GenericResultService.ServerParameters.ReportId;
                        fileName += '_from-' + dateFrom.format('YYYYMMDD');
                        fileName += '_to-' + dateTo.format('YYYYMMDD');

                        if ($scope.filterParameters.branch) {
                            fileName += '_branch-' + $scope.filterParameters.branch;
                        }

                        if ($scope.filterParameters.department) {
                            fileName += '_department-' + $scope.filterParameters.department;
                        }

                        if ($scope.filterParameters.productCategory) {
                            fileName += '_productCategory-' + $scope.filterParameters.productCategory;
                        }


                        if ($scope.filterParameters.CSR) {
                            fileName += '_salesPerson-' + $scope.filterParameters.CSR;
                        }

                        fileName += '.csv';

                        return fileName;
                    };

                    $scope.$on(GenericResultService.EventsNames.onExport, function (e, callBack) {
                        if (getPostValues()) {
                            GenericResultService.ServerParameters.FileName = getExportFileName();
                            return callBack(false);
                        }

                        return callBack(true, null);
                    });

                    $scope.$on(GenericResultService.EventsNames.onClear, function () {
                        $scope.filterParameters.dateFrom = null;
                        $scope.filterParameters.dateTo = null;
                        $scope.filterParameters.branch = null;
                        $scope.filterParameters.department = null;
                        $scope.filterParameters.productCategory = null;
                        $scope.filterParameters.CSR = null;
                    });

                    function validatePost() {
                        var msg = '';
                        var dateFrom = moment($scope.filterParameters.dateFrom);
                        if (dateFrom === null || !dateFrom.isValid() || !($scope.filterParameters.dateFrom)) {
                            msg = msg + 'Invalid ' + $scope.datePurchaseFromLabel + '<br>';
                        }

                        var dateTo = moment($scope.filterParameters.dateTo);
                        if (dateTo === null || !dateTo.isValid() || !($scope.filterParameters.dateTo)) {
                            msg = msg + 'Invalid ' + $scope.datePurchaseToLabel;
                        }

                        if (msg) {
                            notification.show(msg);
                            return { isValid: false };
                        }

                        return {
                            isValid: true,
                            dateFrom: dateFrom,
                            dateTo: dateTo,
                            branch: $scope.filterParameters.branch,
                            department: $scope.filterParameters.department,
                            productCategory: $scope.filterParameters.productCategory,
                            CSR: $scope.filterParameters.CSR
                        };
                    }

                    function getPostValues() {
                        var validationResult = validatePost();
                        if (!validationResult.isValid) {
                            return false;
                        }

                        GenericResultService.ServerParameters.Filter = {
                            DateFrom: moment($scope.filterParameters.dateFrom).format('YYYYMMDD'),
                            DateTo: moment($scope.filterParameters.dateTo).format('YYYYMMDD'),
                            Branch: $scope.filterParameters.branch,
                            DepartmentId: $scope.filterParameters.department,
                            ProductCategoryId: $scope.filterParameters.productCategory,
                            CSR: $scope.filterParameters.CSR
                        };

                        return true;
                    }
                };

                installationHitRateController.$inject = ['$scope', '$anchorScroll', '$location', 'GenericResultService', 'xhr', 'productHierarchySrv'];

                app().service('GenericResultService', ['$rootScope', function ($rootScope) {
                    return GenericService($rootScope);
                }])
                .controller('installationHitRateController', installationHitRateController)
                .controller('GenericReportController', GenericReportResult);

                return angular.bootstrap($el, ['myApp']);
            }
        };
    });
