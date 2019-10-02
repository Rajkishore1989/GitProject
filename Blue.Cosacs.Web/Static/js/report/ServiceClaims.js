/*global define*/
define(['underscore', 'angular', 'url', 'angularShared/app', 'notification', 'moment', 'angularShared/interceptor', 'angularShared/loader', 'jquery.pickList',
    'report/GenericReportResult', 'report/GenericService', 'angular.ui', 'angular.bootstrap', 'lib/select2', 'jquery.ui'],

    function (_, angular, url, app, notification, moment, interceptor, loader, pickList, GenericReportResult, GenericService) {
        'use strict';
        return {
            init: function ($el) {
                var ServiceClaimsController = function ($scope, GenericResultService, xhr, $location, productHierarchySrv) {

                    $scope.MasterData = {};
                    $scope.hasPagination = true;

                    $scope.emptyResults = true;
                    $scope.hideTableData = true;

                    _.extend(GenericResultService.ServerParameters, $location.search(), { PageIndex: 0, PageSize: 99999, PageCount: 0, ReportId: 'ServiceClaims' });
                    $scope.filterParameters = GenericResultService.ServerParameters;

                    $scope.dateLoggedFrom = null;
                    $scope.dateLoggedTo = null;
                    $scope.dateResolvedFrom = null;
                    $scope.dateResolvedTo = null;
                    $scope.supplier = '';
                    $scope.primaryCharge = '';
                    $scope.department = '';
                    $scope.includeTechnicianReport = false;
                    $scope.fywCharged = false;
                    $scope.supplierCharged = false;
                    $scope.ewCharged = false;
                    $scope.ChargeTo = {};
                    $scope.ShowChild = false;
                    $scope.queryResults = {};
                    $scope.resultsVisible = false;

                    $scope.moment = moment;

                    $scope.dateLoggedFromLabel = 'Date Logged From';
                    $scope.dateLoggedToLabel = 'Date Logged To';
                    $scope.dateResolvedFromLabel = 'Date Resolved From';
                    $scope.dateResolvedToLabel = 'Date Resolved To';
                    $scope.supplierLabel = 'Supplier';
                    $scope.primaryChargeLabel = 'Primary Charge';
                    $scope.departmentLabel = 'Division';
                    $scope.includeTechnicianReportLabel = 'Include Technician Report';
                    $scope.fywChargedLabel = 'FYW Charged';
                    $scope.supplierChargedLabel = 'Supplier Charged';
                    $scope.ewChargedLabel = 'EW Charged';

                    $scope.linkDatePicker = {
                        dateFormat: "D, d MM, yy",
                        changeMonth: true,
                        changeYear: true
                    };

                    $scope.select2Options = {
                        allowClear: true
                    };

                    $scope.PageCount = 0;
                    $scope.PageSize = 250;
                    $scope.PageIndex = 1;

                    $scope.departments = productHierarchySrv.getHierarchyLevel(1);

                    $scope.getSrURL = function (requestId) {
                        return url.resolve('Service/Requests/') + requestId;
                    };

                    $scope.getWarrantyURL = function (requestId) {
                        return url.resolve('Warranty/Warranties/') + requestId;
                    };

                    $scope.clear = function () {
                        $scope.dateLoggedFrom = null;
                        $scope.dateLoggedTo = null;
                        $scope.dateResolvedFrom = null;
                        $scope.dateResolvedTo = null;
                        $scope.supplier = '';
                        $scope.primaryCharge = '';
                        $scope.includeTechnicianReport = false;
                        $scope.fywCharged = false;
                        $scope.supplierCharged = false;
                        $scope.ewCharged = false;
                        $scope.queryResults = null;
                        $scope.productItem.Level_1 = '';
                        $scope.resultsVisible = false;
                        $scope.hideTableData = true;
                        $scope.emptyResults = true;
                        $scope.department = null;
                      
                    };

                    function validatePost() {
                        //remove moment from scope

                        var dateLoggedFrom = $scope.moment($scope.dateLoggedFrom);
                        var dateLoggedTo = $scope.moment($scope.dateLoggedTo);
                        var dateResolvedFrom = $scope.moment($scope.dateResolvedFrom);
                        var dateResolvedTo = $scope.moment($scope.dateResolvedTo);
                        var supplier = $scope.supplier;
                        var primaryCharge = $scope.primaryCharge;
                        var department = $scope.department;
                        var includeTechnicianReport = $scope.includeTechnicianReport;
                        var fywCharged = $scope.fywCharged;
                        var supplierCharged = $scope.supplierCharged;
                        var ewCharged = $scope.ewCharged;

                        var msg = validateDate(dateLoggedFrom, $scope.dateLoggedFromLabel);
                        msg += validateDate(dateLoggedTo, $scope.dateLoggedToLabel);
                        msg += validateDate(dateResolvedFrom, $scope.dateResolvedFromLabel);
                        msg += validateDate(dateResolvedTo, $scope.dateResolvedToLabel);

                        if (msg) {
                            notification.show(msg);
                            return { isValid: false };
                        }

                        return {
                            isValid: true,
                            dateLoggedFrom: moment($scope.dateLoggedFrom).format('YYYYMMDD'),
                            dateLoggedTo: moment($scope.dateLoggedTo).format('YYYYMMDD'),
                            dateResolvedFrom: moment($scope.dateResolvedFrom).format('YYYYMMDD'),
                            dateResolvedTo: moment($scope.dateResolvedTo).format('YYYYMMDD'),
                            supplier: supplier,
                            primaryCharge: primaryCharge,
                            department: department,
                            includeTechnicianReport: includeTechnicianReport,
                            fywCharged: fywCharged,
                            supplierCharged: supplierCharged,
                            ewCharged: ewCharged
                        };
                    }

                    $scope.exportFile = function () {

                        var validationResult = validatePost();

                        if (!validationResult.isValid) {
                            return false;
                        }

                        var qs = 'dateLoggedFrom=' + encodeURIComponent(validationResult.dateLoggedFrom);

                        qs += '&dateLoggedTo=' + encodeURIComponent(validationResult.dateLoggedTo);
                        qs += '&dateResolvedFrom=' + encodeURIComponent(validationResult.dateResolvedFrom);
                        qs += '&dateResolvedTo=' + encodeURIComponent(validationResult.dateResolvedTo);
                        qs += '&supplier=' + encodeURIComponent(validationResult.supplier);
                        qs += '&primaryCharge=' + encodeURIComponent(validationResult.primaryCharge);
                        qs += '&department=' + encodeURIComponent(validationResult.department);
                        qs += '&includeTechnicianReport=' + encodeURIComponent(validationResult.includeTechnicianReport);
                        qs += '&supplierCharged=' + encodeURIComponent(validationResult.supplierCharged);
                        qs += '&fywCharged=' + encodeURIComponent(validationResult.fywCharged);
                        qs += '&ewCharged=' + encodeURIComponent(validationResult.ewCharged);

                        var urlToFile = 'Report/ServiceClaims/Export?' + qs;

                        return url.open(urlToFile);
                    };

                    function search() {
                        var validationResult = validatePost();

                        if (!validationResult.isValid) {
                            return false;
                        }

                        var values = {
                            "dateLoggedFrom": validationResult.dateLoggedFrom,
                            "dateLoggedTo": validationResult.dateLoggedTo,
                            "dateResolvedFrom": validationResult.dateResolvedFrom,
                            "dateResolvedTo": validationResult.dateResolvedTo,
                            "supplier": validationResult.supplier,
                            "primaryCharge": validationResult.primaryCharge,
                            "department": validationResult.department,
                            "includeTechnicianReport": validationResult.includeTechnicianReport,
                            "supplierCharged": validationResult.supplierCharged,
                            "fywCharged": validationResult.fywCharged,
                            "ewCharged": validationResult.ewCharged,
                            "pageNumber": $scope.PageIndex,
                            "pageSize": $scope.PageSize
                        };

                        xhr({
                            method: 'GET',
                            url: url.resolve('Report/ServiceClaims/GetServiceClaims'),
                            params: values
                        }).success(function (data) {

                            if (data.Result === "ok") {
                                $scope.queryResults = data.data;
                                $scope.resultsVisible = true;
                                $scope.PageCount = Math.ceil(data.TotalRows / $scope.PageSize);
                                $scope.hideTableData = false;
                                $scope.emptyResults = false;
                            }
                            else {
                                $scope.hideTableData = true;
                                $scope.emptyResults = true;
                                $scope.resultsVisible = false;
                                notification.show(data.Message);
                            }
                        });

                        return null;
                    }

                    $scope.selectPage = function (pageNumber) {
                        $scope.PageIndex = pageNumber;
                        return search();
                    };

                    $scope.ShowHideChild = function (id) {

                        var row = $('.' + id);

                        if (row !== null) {
                            if (row.is(":visible") === false) {
                                row.show();
                            } else {
                                row.hide();
                            }
                        }
                    };

                    function validateDate(date, lbl) {
                        var inputDate = moment(date);

                        if (!date || !inputDate.isValid()) {
                            return 'Invalid ' + lbl + '<br>';
                        }

                        return '';
                    }

                    pickList.populate('ServiceSupplier', function (data) {
                        $scope.MasterData.ServiceSuppliers = _.keys(data);
                    });

                    pickList.populate('Blue.Cosacs.Service.ServiceChargeTo', function (data) {
                        $scope.MasterData.ChargeTos = _.filter(_.keys(data), function (data) {

                            return (data === "FYW" || data === "Supplier" || data === "EW");

                        });
                    });

                };

                ServiceClaimsController.$inject = ['$scope', 'GenericResultService', 'xhr', '$location', 'productHierarchySrv'];

                app().service('GenericResultService', ['$rootScope', function ($rootScope) {
                    return GenericService($rootScope);
                } ])
                .service('controllerRouting', function () {
                    return {
                        exportUrl: '/Report/ServiceClaims/GenericReportExport',
                        reportUrl: '/Report/ServiceClaims/GenericReport'
                    };
                })
                .controller('ServiceClaimsController', ServiceClaimsController)
                .controller('GenericReportController', GenericReportResult);

                return angular.bootstrap($el, ['myApp']);
            }
        };
    });