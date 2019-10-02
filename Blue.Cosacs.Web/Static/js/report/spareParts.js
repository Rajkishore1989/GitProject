/*global define*/
define(['underscore', 'angular', 'angularShared/app', 'notification', 'moment', 'angularShared/interceptor', 'angularShared/loader',
        'report/GenericReportResult', 'report/GenericService', 'angular.ui', 'angular.bootstrap'],

    function (_, angular, app, notification, moment, interceptor, loader, GenericReportResult, GenericService) {
        'use strict';
        return {
            init: function ($el) {
                var sparePartsController = function ($scope, $anchorScroll, $location, GenericResultService) {

                    $scope.dateDeliveredFrom = null;
                    $scope.dateDeliveredTo = null;
                    $scope.dateDeliveredFromLabel = 'Delivered Date from';
                    $scope.dateDeliveredToLabel = 'Delivered Date to';
                    $scope.branchLabel = 'Branch';

                    $scope.linkDatePicker = {
                        dateFormat: "D, d MM, yy",
                        changeMonth: true,
                        changeYear: true
                    };

                    $scope.hasPagination = true;
                    _.extend(GenericResultService.ServerParameters, $location.search(), {PageIndex: 0, PageSize: 250, PageCount: 0, ReportId: 'SpareParts' });
                    $scope.filterParameters = GenericResultService.ServerParameters;

                    $scope.SparePartUsage = { 'Installation': 'Installations', 'Service Request': 'Service Request', 'Sales Order': 'Sales Order' };
                    $scope.PartSource = { 'Internal': 'Internal', 'External': 'External', 'Salvaged': 'Salvaged' };

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
                        $scope.filterParameters.dateDeliveredFrom = null;
                        $scope.filterParameters.dateDeliveredTo = null;
                        $scope.filterParameters.branch = '';
                        $scope.filterParameters.sparePartUsage = '';
                        $scope.filterParameters.partSource = '';
                    });

                    function getFileName() {
                        var fileName = moment().format('YYYYMMDD');
                        var firstDate = moment($scope.filterParameters.dateDeliveredFrom);
                        var endDate = moment($scope.filterParameters.dateDeliveredTo);

                        fileName += '_' + 'SpareParts';
                        fileName += '_from-' + firstDate.format('YYYYMMDD');
                        fileName += '_to-' + endDate.format('YYYYMMDD');

                        if ($scope.filterParameters.branch) {
                            fileName += '_branch-' + $scope.filterParameters.branch;
                        }

                        if ($scope.filterParameters.sparePartUsage) {
                            fileName += '_sparePartUsage-' + $scope.filterParameters.sparePartUsage;
                        }

                        if ($scope.filterParameters.partSource) {
                            fileName += '_partSource-' + $scope.filterParameters.partSource;
                        }

                        fileName += '.csv';

                        return fileName;
                    }

                    function validatePost() {
                        var firstDate = moment($scope.filterParameters.dateDeliveredFrom);
                        if (firstDate === null || !firstDate.isValid() || !($scope.filterParameters.dateDeliveredFrom)) {
                            notification.show('Invalid ' + $scope.dateDeliveredFromLabel);
                            return { isValid: false };
                        }

                        var endDate = moment($scope.filterParameters.dateDeliveredTo);
                        if (endDate === null || !endDate.isValid() || !($scope.filterParameters.dateDeliveredTo)) {
                            notification.show('Invalid ' + $scope.dateDeliveredToLabel);
                            return { isValid: false };
                        }

                        return {
                            isValid: true,
                            firstDate: firstDate,
                            endDate: endDate,
                            branch: $scope.filterParameters.branch,
                            sparePartUsage: $scope.filterParameters.sparePartUsage,
                            partSource: $scope.filterParameters.partSource
                        };
                    }

                    function post() {
                        var validationResult = validatePost();

                        if (!validationResult.isValid) {
                            return false;
                        }
                         // values.ReportId = 'SpareParts';
                        GenericResultService.ServerParameters.Filter = {
                            "DateFrom": validationResult.firstDate.format('YYYYMMDD'),
                            "DateTo": validationResult.endDate.format('YYYYMMDD'),
                            "Branch": validationResult.branch,
                            "SparePartUsage": validationResult.sparePartUsage,
                            "PartSource": validationResult.partSource
                        };

                        return true;
                    }
                };

                sparePartsController.$inject = ['$scope', '$anchorScroll', '$location', 'GenericResultService'];

                app().service('GenericResultService', ['$rootScope', function ($rootScope) {
                    return GenericService($rootScope);
                }])
                    .controller('sparePartsController', sparePartsController)
                    .controller('GenericReportController', GenericReportResult);

                return angular.bootstrap($el, ['myApp']);
            }
        };
    });
