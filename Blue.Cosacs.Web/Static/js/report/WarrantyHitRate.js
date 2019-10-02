/*global define*/
define([
        'underscore', 'angular', 'angularShared/app', 'notification', 'moment', 'report/GenericReportResult', 'report/GenericService',
        'url', 'angular.ui', 'angular.bootstrap', 'lib/select2'
    ],
    function (_, angular, app, notification, moment, GenericReportResult, GenericService, url) {
        'use strict';
        return {
            init: function ($el) {

                var warrantyHitRateController = function ($scope, $anchorScroll, $location, GenericResultService, xhr) {

                    $scope.hasPagination = true;
                    _.extend(GenericResultService.ServerParameters, $location.search(), { PageIndex: 0, PageSize: 250, PageCount: 0, ReportId: 'WarrantyHitRate' });
                    $scope.filterParameters = GenericResultService.ServerParameters;

                    $scope.dateDeliveredFrom = null;
                    $scope.dateDeliveredTo = null;
                    $scope.dateDeliveredFromLabel = 'Delivered Date from';
                    $scope.dateDeliveredToLabel = 'Delivered Date to';
                    $scope.branchLabel = 'Branch';
                    $scope.chainLabel = 'Store Type';
                    $scope.salesPersonLabel = 'Sales Person';

                    $scope.chains = { "C": "Courts", "N": "Lucky Dollar" };

                    $scope.linkDatePicker = {
                        dateFormat: "D, d MM, yy",
                        changeMonth: true,
                        changeYear: true
                    };

                    $scope.filterParameters = $location.search();
                    if (_.isEmpty($scope.filterParameters)) {
                        $scope.filterParameters = {};
                    }

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
                        $scope.filterParameters.branch = null;
                        $scope.filterParameters.chain = null;
                        $scope.filterParameters.salesPerson = null;
                        $scope.filterParameters.includeReprocessedCancelled = false;
                    });

                    function getFileName() {
                        var validationResult = validatePost();

                        if (!validationResult.isValid) {
                            return '';
                        }

                        var fileName = moment().format('YYYYMMDD');

                        fileName += '_' + 'WarrantyHitRate';
                        fileName += '_from-' + validationResult.dateFrom.format('YYYYMMDD');
                        fileName += '_to-' + validationResult.dateTo.format('YYYYMMDD');

                        if (validationResult.branch) {
                            fileName += '_branch-' + validationResult.branch;
                        }
                        if (validationResult.chain) {
                            fileName += '_chain-' + validationResult.chain;
                        }
                        if (validationResult.salesPerson) {
                            fileName += '_salesPerson-' + validationResult.salesPerson;
                        }

                        
                        if (validationResult.includeReprocessedCancelled) {
                            fileName += '_includeReprocessedOrCancelled-' + validationResult.includeReprocessedCancelled;
                        }
                        

                        fileName += '.csv';

                        return fileName;
                    }

                    function validatePost() {
                        var msg = validateDate($scope.filterParameters.dateDeliveredFrom, $scope.dateDeliveredFromLabel);
                        msg += validateDate($scope.filterParameters.dateDeliveredTo, $scope.dateDeliveredToLabel);

                        if ((+$scope.filterParameters.dateDeliveredFrom) > (+$scope.filterParameters.dateDeliveredTo)) {
                            msg += $scope.dateDeliveredFromLabel + ' cannot be after ' + $scope.dateDeliveredToLabel + '.';
                        }

                        if (msg) {
                            notification.show(msg);
                            return { isValid: false };
                        }

                        return {
                            isValid: true,
                            dateFrom: moment($scope.filterParameters.dateDeliveredFrom),
                            dateTo: moment($scope.filterParameters.dateDeliveredTo),
                            branch: $scope.filterParameters.branch,
                            chain: $scope.filterParameters.chain,
                            salesPerson: $scope.filterParameters.salesPerson,
                            includeReprocessedCancelled: $scope.filterParameters.includeReprocessedCancelled
                        };
                    }

                    function post() {
                        var validationResult = validatePost();

                        if (!validationResult.isValid) {
                            return false;
                        }

                        //values.ReportId = 'WarrantyHitRate';

                        GenericResultService.ServerParameters.Filter = {
                            "DateFrom": validationResult.dateFrom.format('YYYYMMDD'),
                            "DateTo": validationResult.dateTo.format('YYYYMMDD'),
                            "BranchNumber": validationResult.branch,
                            "StoreType": validationResult.chain,
                            "SalesPersonId": validationResult.salesPerson,
                            "IncludeReprocessedCancelled": validationResult.includeReprocessedCancelled ? 1 : 0
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

                };

                warrantyHitRateController.$inject = ['$scope', '$anchorScroll', '$location', 'GenericResultService', 'xhr'];

                app().service('GenericResultService',['$rootScope', function ($rootScope) {
                    return GenericService($rootScope);
                }])
                .controller('warrantyHitRateController', warrantyHitRateController)
                .controller('GenericReportController', GenericReportResult);

                return angular.bootstrap($el, ['myApp']);
            }
        };
    });