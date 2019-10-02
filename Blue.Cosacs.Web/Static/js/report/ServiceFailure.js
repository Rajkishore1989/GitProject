/*global define*/
define(['underscore', 'angular', 'angularShared/app', 'notification', 'moment', 'angularShared/interceptor', 'angularShared/loader',
    'report/GenericReportResult', 'report/GenericService', 'jquery.pickList',
    'lib/select2', 'angular.ui', 'angular.bootstrap'],

    function (_, angular, app, notification, moment, interceptor, loader, GenericReportResult, GenericService) {
        'use strict';
        return {
            init: function ($el) {
                var serviceFailuresController = function ($scope, $anchorScroll, $location, GenericResultService, xhr, productHierarchySrv) {

                    $scope.categories = productHierarchySrv.getHierarchyLevel(2).then(function (a) {
                        return _.pairs(a);
                    });

                    $scope.dateDeliveredFrom = null;
                    $scope.dateDeliveredTo = null;
                    $scope.dateDeliveredFromLabel = 'Products sold from';
                    $scope.dateDeliveredToLabel = 'Products sold to';
                    $scope.qtrDeliveredFromLabel = 'Delivered in Qtr from:';
                    $scope.qtrDeliveredToLabel = 'Delivered in Qtr to:';
                    $scope.departmentLabel = 'Department:';
                    $scope.categoryLabel = 'Category:';
                    $scope.classLabel = 'Class';
                    $scope.faultLabel = 'Fault:';
                    $scope.failRateLabel = 'Failure Rate % >=:';
                    $scope.branchLabel = 'Purchase Branch:';

                    $scope.hasPagination = true;
                    _.extend(GenericResultService.ServerParameters, $location.search(), {PageIndex: 0, PageSize: 250, PageCount: 0, ReportId: 'ServiceFailure' });
                    $scope.filterParameters = GenericResultService.ServerParameters;

                    $scope.linkDatePicker = {
                        dateFormat: "D, d MM, yy",
                        changeMonth: true,
                        changeYear: true
                    };

                    $scope.failRate = 10;

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
                        $scope.filterParameters.year = '';
                        $scope.filterParameters.firstQtr = '';
                        $scope.filterParameters.lastQtr = '';
                        $scope.filterParameters.categories = '';
                        $scope.filterParameters.failureRate = '';
                        $scope.filterParameters.branch = '';
                    });

                    function getFileName() {
                        var validationResult = validatePost();

                        if (!validationResult.isValid) {
                            return '';
                        }

                        var fileName = moment().format('YYYYMMDD');

                        fileName += '_' + 'ServiceFailure';
                        fileName += '_year-' + validationResult.year;
                        fileName += '_Qtrfrom-' + validationResult.firstQtr;
                        fileName += '_Qtrto-' + validationResult.lastQtr;
                        fileName += '_failureRate-' + validationResult.failureRate;

                        if(validationResult.department)
                            fileName += '_department-' + validationResult.department;

                        if (validationResult.category)
                            fileName += '_category-' + validationResult.category;

                        if (validationResult.branch)
                            fileName += '_branch-' + validationResult.branch;

                        fileName += '.csv';

                        return fileName;
                    }

                    function validatePost() {
                        var msg = '';
                        var year = parseInt($scope.filterParameters.year, 10);
                        var w1 = parseInt($scope.filterParameters.firstQtr, 10);
                        var w2 = parseInt($scope.filterParameters.lastQtr, 10);

                        if (isNaN(year)) {
                            msg = 'Invalid Year.<br>';
                        }

                        if (isNaN(w1)) {
                            msg +='Invalid First quarter.<br>';
                        }

                        if (isNaN(w2)) {
                            msg += 'Invalid Last quarter.<br>';
                        }

                        if (w1 > w2) {
                            msg += 'Last quarter must be greater or equal than First quarter<br>';
                           }

                        if (!$scope.filterParameters.failureRate) {
                            msg += 'Invalid ' + $scope.failRateLabel + '<br>';
                        }

                        if (msg) {
                            notification.show(msg);
                            return { isValid: false };
                        }

                        return {
                            isValid: true,
                            year: $scope.filterParameters.year,
                            firstQtr: $scope.filterParameters.firstQtr,
                            lastQtr: $scope.filterParameters.lastQtr,
                            category: $scope.filterParameters.categories.toString(),
                            branch: $scope.filterParameters.branch,
                            failureRate: $scope.filterParameters.failureRate
                        };
                    }

                    function post() {
                        var validationResult = validatePost();

                        if (!validationResult.isValid) {
                            return false;
                        }

                        GenericResultService.ServerParameters.Filter = {
                            "Year": validationResult.year,
                            "QtrFrom": validationResult.firstQtr,
                            "QtrTo": validationResult.lastQtr,
                            "Category": validationResult.category,
                            "Branch": validationResult.branch,
                            "FailureRate": validationResult.failureRate
                        };

                        return true;
                    }
                };

                serviceFailuresController.$inject = ['$scope', '$anchorScroll', '$location', 'GenericResultService', 'xhr', 'productHierarchySrv'];

                app().service('GenericResultService', ['$rootScope', function ($rootScope) {
                    return GenericService($rootScope);
                } ])
                    .controller('serviceFailuresController', serviceFailuresController)
                    .controller('GenericReportController', GenericReportResult);

                return angular.bootstrap($el, ['myApp']);
            }
        };
    });
