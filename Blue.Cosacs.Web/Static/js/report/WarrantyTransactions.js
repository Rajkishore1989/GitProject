/*global define*/
define(['underscore', 'angular', 'url', 'notification', 'angularShared/app', 'moment', 'angularShared/interceptor', 'angularShared/loader',
    'report/GenericReportResult', 'report/GenericService', 'angular.ui', 'angular.bootstrap', 'lib/select2', 'jquery.ui'],

    function (_, angular, url, notification, app, moment, interceptor, loader, GenericReportResult, GenericService) {
        'use strict';
        return {
            init: function ($el) {
                var WarrantyTransactionsController = function ($scope, GenericResultService, xhr, $location) {

                    $scope.hasPagination = true;
                    _.extend(GenericResultService.ServerParameters, $location.search(), {PageIndex: 0, PageSize: 250, PageCount: 0, ReportId: 'WarrantyTransactions'});
                    $scope.filterParameters = GenericResultService.ServerParameters;

                    $scope.runNo = null;
                    $scope.runNoLabel = 'Run Number';
                    $scope.templatePath = "/Static/js/report/GenericTemplate.html";

                    $scope.select2Options = {
                        allowClear: true
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
                        $scope.runNo = null;
                    });

                    function getFileName() {
                        var fileName = moment().format('YYYYMMDD');

                        fileName += '_' + 'WarrantyTransactionsReport';
                        fileName += '.csv';

                        return fileName;
                    }

                    function post(values) {
                        values.ReportId = 'WarrantyTransactions';
                        values.Filter = {
                            "@runNo": $scope.runNo
                        };

                        if (_.isNaN($scope.runNo) || _.isNull($scope.runNo)) {
                            notification.show('Invalid Run Number entered');
                            return false;
                        }

                        return true;
                    }
                };

                WarrantyTransactionsController.$inject = ['$scope', 'GenericResultService', 'xhr', '$location'];

                app().service('GenericResultService',['$rootScope', function ($rootScope) {
                        return GenericService($rootScope);
                    }])
                .controller('WarrantyTransactionsController', WarrantyTransactionsController)
                .controller('GenericReportController',  GenericReportResult);

                return angular.bootstrap($el, ['myApp']);
            }
        };
    });