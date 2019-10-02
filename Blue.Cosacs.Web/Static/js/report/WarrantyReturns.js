/*global define*/
define(['underscore', 'angular', 'angularShared/app', 'notification', 'moment', 'angularShared/interceptor',
        'angularShared/loader', 'jquery.pickList', 'report/GenericReportResult', 'report/GenericService', 'url',
        'angular.ui', 'angular.bootstrap', 'lib/select2', 'jquery.ui'],

    function (_, angular, app, notification, moment, interceptor, loader, pickList, GenericReportResult, genericService, url) {
        'use strict';
        return {
            init: function ($el) {
                var WarrantyReturnsController = function ($scope, GenericResultService, $location, xhr) {
                    $scope.moment = moment;
                    $scope.dateFromLabel = 'Cancelled/Repossessed from';
                    $scope.dateToLabel = 'Cancelled/Repossessed to';
                    $scope.fasciaLabel = 'Fascia';
                    $scope.branchLabel = 'Branch Name';
                    $scope.returnTypeLabel = 'Return Type';
                    $scope.warrantyTypeLabel = 'Warranty Type';
                    $scope.templatePath = "/Static/js/report/GenericTemplate.html";

                    $scope.linkDatePicker = {
                        dateFormat: "D, d MM, yy",
                        changeMonth: true,
                        changeYear: true
                    };

                    var getBranchData = function() {
                        // the $http API is based on the deferred/promise APIs exposed by the $q service
                        // so it returns a promise for us by default
                        return xhr
                            .get(url.resolve('PickLists/Load?ids=BRANCH'))
                            .then(function(data) {
                                return data.data.BRANCH.rows;
                            });
                    };
                    $scope.branches = getBranchData();

                    _.extend(GenericResultService.ServerParameters, $location.search(), {PageIndex: 0, PageSize: 250, PageCount: 0, ReportId: 'WarrantyReturns'});
                    $scope.filterParameters = GenericResultService.ServerParameters;

                    $scope.hasPagination = true;

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
                        $scope.filterParameters.dateFrom = null;
                        $scope.filterParameters.dateTo = null;
                        $scope.filterParameters.fascia = null;
                        $scope.filterParameters.branch = null;
                        $scope.filterParameters.returnType = null;
                        $scope.filterParameters.warrantyType = null;
                    });

                    function getFileName() {
                        var fileName = moment().format('YYYYMMDD');
                        var fromDate = $scope.moment($scope.filterParameters.dateFrom);
                        var toDate = $scope.moment($scope.filterParameters.dateTo);

                        fileName += '_' + 'WarrantyReturnsReport';
                        fileName += '_from-' + fromDate.format('YYYYMMDD');
                        fileName += '_to-' + toDate.format('YYYYMMDD');

                        
                        if ($scope.filterParameters.returnType)
                            fileName += '_returnType-' + $scope.filterParameters.returnType;

                        if ($scope.filterParameters.fascia)
                            fileName += '_fascia-' + $scope.filterParameters.fascia;

                        if ($scope.filterParameters.branch)
                            fileName += '_branchName-' + $scope.filterParameters.branch;

                        if ($scope.filterParameters.warrantyType)
                            fileName += '_warrantyType-' + $scope.filterParameters.warrantyType;



                        fileName += '.csv';

                        return fileName;
                    }

                    function validatePost() {
                        //remove moment from scope
                        var fromDate = !$scope.filterParameters.dateFrom ? null : $scope.moment($scope.filterParameters.dateFrom);
                        var toDate = !$scope.filterParameters.dateTo ? null : $scope.moment($scope.filterParameters.dateTo);

                        var fascia = $scope.filterParameters.fascia;
                        var branch = $scope.filterParameters.branch;
                        var returnType = $scope.filterParameters.returnType;
                        var warrantyType = $scope.filterParameters.warrantyType;

                        var msg = validateDate(fromDate, $scope.dateFromLabel);
                        msg += validateDate(toDate, $scope.dateToLabel);

                        if (msg) {
                            notification.show(msg);
                            return { isValid: false };
                        }

                        return {
                            isValid: true,
                            fromDate: fromDate,
                            toDate: toDate,
                            fascia: fascia,
                            branch: branch,
                            returnType: returnType,
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
                            branchVal = parseInt(validationResult.branch, 10);
                        }

                        GenericResultService.ServerParameters.Filter = {
                            "dateFrom": validationResult.fromDate.format('YYYYMMDD'),
                            "dateTo": validationResult.toDate.format('YYYYMMDD'),
                            "fascia": validationResult.fascia,
                            "branch": branchVal,
                            "returnType": validationResult.returnType,
                            "warrantyType": validationResult.warrantyType
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

                WarrantyReturnsController.$inject = ['$scope', 'GenericResultService', '$location', 'xhr'];

                app().factory('GenericResultService',['$rootScope', function ($rootScope) {
                    return genericService($rootScope);
                }])
                    .controller('WarrantyReturnsController',  WarrantyReturnsController)
                    .controller('GenericReportController', GenericReportResult);

                return angular.bootstrap($el, ['myApp']);
            }
        };
    });