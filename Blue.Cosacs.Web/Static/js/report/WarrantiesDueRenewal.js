/*global define*/
define(['underscore', 'angular', 'url', 'angularShared/app', 'notification', 'moment', 'angularShared/interceptor', 'angularShared/loader', 'jquery.pickList',
    'report/GenericReportResult', 'report/GenericService', 'angular.ui', 'angular.bootstrap', 'lib/select2', 'jquery.ui'],

    function (_, angular, url, app, notification, moment, interceptor, loader, pickList, GenericReportResult, GenericService) {
        'use strict';
        return {
            init: function ($el) {
                var WarrantiesDueRenewalController = function ($scope, GenericResultService, xhr, $location) {

                    $scope.hasPagination = true;
                    _.extend(GenericResultService.ServerParameters, $location.search(), {PageIndex: 0, PageSize: 250, PageCount: 0, ReportId: 'WarrantiesDueRenewal'});
                    $scope.filterParameters = GenericResultService.ServerParameters;

                    $scope.fascia = null;
                    $scope.branch = null;
                    $scope.dateFrom = null;
                    $scope.dateTo = null;
                    $scope.moment = moment;

                    $scope.fasciaLabel = 'Fascia';
                    $scope.branchLabel = 'Branch Name';
                    $scope.dateFromLabel = 'Date From';
                    $scope.dateToLabel = 'Date To';

                    $scope.templatePath = "/Static/js/report/GenericTemplate.html";

                    $scope.branches = getBranchData();

                    $scope.linkDatePicker = {
                        dateFormat: "D, d MM, yy",
                        changeMonth: true,
                        changeYear: true
                    };

                    $scope.select2Options = {
                        allowClear: true
                    };

                    $scope.selectPage = function (page) {
                        $scope.filter.PageIndex = page;
                        $scope.search();
                    };

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
                        $scope.fascia = null;
                        $scope.branch = null;
                        $scope.dateFrom = null;
                        $scope.dateTo = null;
                    });

                    $scope.$watch('branch', function (newVal) {
                        if (newVal){
                            $scope.fascia = null;
                        }
                    });

                    $scope.$watch('fascia', function (newVal) {
                        if (newVal){
                            $scope.branch = null;
                        }
                    });

                    function getFileName() {
                        var fileName = moment().format('YYYYMMDD');

                        fileName += '_' + 'WarrantiesDueRenewalReport';

                        

                        fileName += '_fascia-' + $scope.fascia;
                        fileName += '_branchName-' + $scope.branch;                        
                        fileName += '_from-' + $scope.moment($scope.dateFrom).format('YYYYMMDD');
                        fileName += '_to-' + $scope.moment($scope.dateTo).format('YYYYMMDD');
                        fileName += '.csv';

                        return fileName;
                    }

                    function validatePost() {
                        //remove moment from scope

                        var dateFrom = $scope.moment($scope.dateFrom);
                        var dateTo = $scope.moment($scope.dateTo);
                       var fascia = $scope.fascia;
                        var branch = $scope.branch;

                        var msg = validateDate(dateFrom, $scope.dateFromLabel);
                        msg += validateDate(dateTo, $scope.dateToLabel);

                        if (msg) {
                            notification.show(msg);
                            return { isValid: false };
                        }

                        return {
                            isValid: true,
                            fascia: fascia,
                            branch: branch,
                            dateFrom: dateFrom,
                            dateTo: dateTo
                        };
                    }

                    function validateDate(date, lbl) {
                        var inputDate = moment(date);

                        if (inputDate === null || !inputDate.isValid() || !(date)) {
                            return 'Invalid ' + lbl + '<br>';
                        }

                        return '';
                    }

                    function post(values) {
                        var validationResult = validatePost();

                        if (!validationResult.isValid) {
                            return false;
                        }

                        var branchVal = null;

                        if (validationResult.branch) {
                            branchVal = validationResult.branch;
                        }
                        values.ReportId = 'WarrantiesDueRenewal';
                        values.Filter = {
                            "@fascia": validationResult.fascia,
                            "@branch": branchVal,
                            "@dateFrom": validationResult.dateFrom,
                            "@dateTo": validationResult.dateTo
                        };
                        GenericResultService.ServerParameters.Filter = values.Filter;
                        values.PageSize = 250;
                        values.PageIndex = 0;

                        return true;
                    }

                    function getBranchData() {
                        return xhr
                            .get(url.resolve('PickLists/Load?ids=BRANCH'))
                            .then(function (data) {
                                return data.data.BRANCH.rows;
                            });
                    }

                };

                WarrantiesDueRenewalController.$inject = ['$scope', 'GenericResultService', 'xhr', '$location'];

                app().service('GenericResultService',['$rootScope', function ($rootScope) {
                        return GenericService($rootScope);
                    }])
                .controller('WarrantiesDueRenewalController', WarrantiesDueRenewalController)
                .controller('GenericReportController',  GenericReportResult);

                return angular.bootstrap($el, ['myApp']);
            }
        };
    });