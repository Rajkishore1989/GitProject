/*global define*/
define(['angular', 'underscore', 'url', 'angularShared/app', 'notification', 'moment', 'angularShared/interceptor', 'angularShared/loader',
        'report/GenericReportResult', 'report/GenericService', 'angular.ui', 'angular.bootstrap'],

    function (angular, _, url, app, notification, moment, interceptor, loader, GenericReportResult, GenericService) {
        'use strict';
        return {
            init: function ($el) {
                var serviceRequestFinancialController = function ($scope, $anchorScroll, $location, xhr, GenericResultService, productHierarchySrv) {
                    $scope.hasPagination = true;
                    _.extend(GenericResultService.ServerParameters, $location.search(), { PageIndex: 0, PageSize: 250, PageCount: 0, ReportId: 'ServiceRequestFinancial' });
                    $scope.filterParameters = GenericResultService.ServerParameters;

                    $scope.productCategory = productHierarchySrv.getHierarchyLevel(2);

                    $scope.dateInterfaceTransactionFromLabel = 'Interface Transaction Date from';
                    $scope.dateInterfaceTransactionToLabel = 'Interface Transaction Date to';

                    $scope.linkDatePicker = {
                        dateFormat: "D, d MM, yy",
                        changeMonth: true,
                        changeYear: true
                    };

                    var getChargeTo = function() {
                        return xhr.get(url.resolve('/Service/Requests/PrimaryGetChargeTo'))
                            .then(function(response) {
                                if (typeof response.data === 'object') {
                                    var array = {};
                                    _.each(response.data, function(singleVal) {
                                        array[singleVal.ResolutionPrimaryCharge] = singleVal.ResolutionPrimaryCharge;
                                    });
                                    return array;
                                }
                            });
                    };

                    $scope.ChargeTo = getChargeTo();

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

                        if($scope.filterParameters.productCategory){
                            fileName += '_productCategory-' + $scope.filterParameters.productCategory;
                        }

                        if($scope.filterParameters.chargeTo){
                            fileName += '_chargeTo-' + $scope.filterParameters.chargeTo;
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
                        $scope.filterParameters.productCategory = null;
                        $scope.filterParameters.chargeTo = null;
                    });

                    function validatePost() {
                        var dateFrom = moment($scope.filterParameters.dateFrom);

                        if (!$scope.filterParameters.dateFrom || !dateFrom.isValid()) {
                            notification.show('Invalid ' + $scope.dateInterfaceTransactionFromLabel);
                            return false;
                        }

                        var dateTo = moment($scope.filterParameters.dateTo);
                        if (!$scope.filterParameters.dateTo || !dateTo.isValid()) {
                            notification.show('Invalid ' + $scope.dateInterfaceTransactionToLabel);
                            return false;
                        }

                        return true;
                    }

                    function getPostValues() {
                        if (!validatePost()) {
                            return false;
                        }

                        GenericResultService.ServerParameters.Filter = {
                            DateFrom: moment($scope.filterParameters.dateFrom).format('YYYYMMDD'),
                            DateTo : moment($scope.filterParameters.dateTo).format('YYYYMMDD'),
                            Department: $scope.filterParameters.department,
                            ProductCategory: $scope.filterParameters.productCategory,
                            ChargeTo: $scope.filterParameters.chargeTo
                        };

                        return true;
                    }
                };

                serviceRequestFinancialController.$inject = ['$scope', '$anchorScroll', '$location', 'xhr', 'GenericResultService', 'productHierarchySrv'];

                app().service('GenericResultService',['$rootScope', function ($rootScope) {
                    return GenericService($rootScope);
                }])
                .controller('serviceRequestFinancialController', serviceRequestFinancialController)
                .controller('GenericReportController', GenericReportResult);

                return angular.bootstrap($el, ['myApp']);
            }
        };
    });