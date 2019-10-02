/*global define*/
define(['underscore', 'angular', 'url', 'angularShared/app', 'notification', 'moment', 'jquery.pickList',
        'report/GenericReportResult', 'report/GenericService', 'angular.ui', 'angular.bootstrap', 'lib/select2', 'jquery.ui'],

    function (_, angular, url, app, notification, moment, pickList, GenericReportResult, GenericService) {
        'use strict';
        return {
            init: function ($el) {
                var WarrantySalesController = function ($scope, GenericResultService, xhr, $location) {

                    $scope.hasPagination = true;
                    _.extend(GenericResultService.ServerParameters, $location.search(), { PageIndex: 0, PageSize: 250, PageCount: 0, ReportId: 'WarrantySales' });
                    $scope.filterParameters = GenericResultService.ServerParameters;

                    $scope.SalesTypes = { "A": "All", "R": "Renewals", "F": "First Effort Solicitation", "S": "Second Effort Solicitation" };

                    $scope.dateWarrantyDeliveredFrom = null;
                    $scope.dateWarrantyDeliveredTo = null;
                    $scope.salesType = null;
                    $scope.fascia = null;
                    $scope.branch = null;
                    $scope.warrantyType = null;
                    $scope.moment = moment;
                    $scope.dateWarrantyDeliveredFromLabel = 'Delivered from';
                    $scope.dateWarrantyDeliveredToLabel = 'Delivered to';
                    $scope.salesTypeLabel = 'Sales Type';
                    $scope.fasciaLabel = 'Fascia';
                    $scope.branchLabel = 'Branch Name';
                    $scope.warrantyTypeLabel = 'Warranty Type';
                    $scope.templatePath = "/Static/js/report/GenericTemplate.html";
                    $scope.branches = {};

                    $scope.linkDatePicker = {
                        dateFormat: "D, d MM, yy",
                        changeMonth: true,
                        changeYear: true
                    };

                    $scope.branches = getBranchData();

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
                        $scope.dateWarrantyDeliveredFrom = null;
                        $scope.dateWarrantyDeliveredTo = null;
                        $scope.salesType = null;
                        $scope.fascia = null;
                        $scope.branch = null;
                        $scope.warrantyType = null;
                    });

                    $scope.$watch('branch', function (newVal) {
                        if (newVal) {
                            $scope.fascia = null;
                        }
                    });

                    $scope.$watch('fascia', function (newVal) {
                        if (newVal) {
                            $scope.branch = null;
                        }
                    });

                    function getFileName() {
                        var validationResult = validatePost();

                        if (!validationResult.isValid) {
                            return '';
                        }

                        var fileName = moment().format('YYYYMMDD');

                        fileName += '_' + 'WarrantySalesReport';
                        fileName += '_from-' + validationResult.fromDate.format('YYYYMMDD');
                        fileName += '_to-' + validationResult.toDate.format('YYYYMMDD');
                        
                        if ($scope.salesType)
                            fileName += 'salesType-' + $scope.salesType;

                        if ($scope.fascia)
                            fileName += '_fascia-' + $scope.fascia;

                        if ($scope.branch)
                            fileName += '_branchName-' + $scope.branch;

                        if ($scope.warrantyType)
                            fileName += '_warrantyType-' + $scope.warrantyType;


                        fileName += '.csv';

                        return fileName;
                    }

                    function validatePost() {
                        //remove moment from scope
                        var fromDate = !$scope.dateWarrantyDeliveredFrom ? null : $scope.moment($scope.dateWarrantyDeliveredFrom);
                        var toDate = !$scope.dateWarrantyDeliveredTo ? null : $scope.moment($scope.dateWarrantyDeliveredTo);

                        var salesType = $scope.salesType;
                        var fascia = $scope.fascia;
                        var branch = $scope.branch;
                        var warrantyType = $scope.warrantyType;

                        var msg = validateDate(fromDate, $scope.dateWarrantyDeliveredFromLabel);
                        msg += validateDate(toDate, $scope.dateWarrantyDeliveredToLabel);

                        if (msg) {
                            notification.show(msg);
                            return { isValid: false };
                        }

                        return {
                            isValid: true,
                            fromDate: fromDate,
                            toDate: toDate,
                            salesType: salesType,
                            fascia: fascia,
                            branch: branch,
                            warrantyType: warrantyType
                        };
                    }

                    function post() {
                        var validationResult = validatePost();

                        if (!validationResult.isValid) {
                            return false;
                        }

                        var branchVal = null;

                        if (validationResult.branch) {
                            branchVal = validationResult.branch;
                        }

                        //values.ReportId = 'WarrantySales';
                        GenericResultService.ServerParameters.Filter = {
                            "@dateWarrantyDeliveredFrom": validationResult.fromDate.format('YYYYMMDD'),
                            "@dateWarrantyDeliveredTo": validationResult.toDate.format('YYYYMMDD'),
                            "@salesType": validationResult.salesType,
                            "@fascia": validationResult.fascia,
                            "@branch": branchVal,
                            "@warrantyType": validationResult.warrantyType
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

                    function getBranchData() {
                        // the $http API is based on the deferred/promise APIs exposed by the $q service
                        // so it returns a promise for us by default
                        return xhr
                            .get(url.resolve('PickLists/Load?ids=BRANCH'))
                            .then(function (data) {
                                return data.data.BRANCH.rows;
                            });
                    }

                };

                WarrantySalesController.$inject = ['$scope', 'GenericResultService', 'xhr', '$location'];

                app().service('GenericResultService',['$rootScope', function ($rootScope) {
                    return GenericService($rootScope);
                }])
                    .controller('WarrantySalesController', WarrantySalesController)
                    .controller('GenericReportController', GenericReportResult);
                return angular.bootstrap($el, ['myApp']);
            }
        };
    });