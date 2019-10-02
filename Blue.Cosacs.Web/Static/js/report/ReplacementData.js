/*global define*/
define(['underscore', 'angular', 'url', 'angularShared/app', 'notification', 'moment', 'angularShared/interceptor', 'angularShared/loader', 'jquery.pickList',
    'report/GenericReportResult', 'report/GenericService', 'angular.ui', 'angular.bootstrap', 'lib/select2', 'jquery.ui'],

    function (_, angular, url, app, notification, moment, interceptor, loader, pickList, GenericReportResult, GenericService) {
        'use strict';
        return {
            init: function ($el) {
                var ReplacementDataController = function ($scope, GenericResultService, xhr, $location) {

                    $scope.MasterData = {};
                    $scope.Totals = {};
                    $scope.displayTotals = false;
                    $scope.hasPagination = true;
                    _.extend(GenericResultService.ServerParameters, $location.search(), { PageIndex: 0, PageSize: 250, PageCount: 0, ReportId: 'ReplacementData' });
                    $scope.filterParameters = GenericResultService.ServerParameters;

                    $scope.dateFrom = null;
                    $scope.dateTo = null;
                    $scope.warrantyType = null;
                    $scope.supplier = null;
                    $scope.exchangeReason = null;

                    $scope.moment = moment;

                    $scope.dateFromLabel = 'Date From';
                    $scope.dateToLabel = 'Date To';
                    $scope.warrantyTypeLabel = 'Warranty Type';
                    $scope.supplierLabel = 'Supplier';
                    $scope.exchangeReasonLabel = 'Reason For Exchange';

                    $scope.fywChargeAmount = null;
                    $scope.supplierChargeAmount = null;
                    $scope.ewChargeAmount = null;
                    $scope.internalChargeAmount = null;

                    $scope.fywExchangeCount = null;
                    $scope.supplierExchangeCount = null;
                    $scope.ewExchangeCount = null;
                    $scope.internalExchangeCount = null;

                    $scope.totalCharges = null;
                    $scope.totalExchanges = null;

                    $scope.MasterData.GrtProcesses = {
                        '1': 'No ', /*If you take the space out of the description test it because the list control has an error*/
                        '2': 'Yes',
                        '3': 'All'
                    };

                    $scope.grtProcess = '3';

                    var safeApply = function (fn) {
                        var phase = $scope.$root.$$phase;
                        if (phase == '$apply' || phase == '$digest')
                            $scope.$eval(fn);
                        else
                            $scope.$apply(fn);
                    };

                    $scope.linkDatePicker = {
                        dateFormat: "D, d MM, yy",
                        changeMonth: true,
                        changeYear: true
                    };

                    $scope.select2Options = {
                        allowClear: true
                    };

                    $scope.$on(GenericResultService.EventsNames.onSearch, function (e, callBack) {
                        $scope.displayTotals = false;
                        if (post()) {
                            return callBack(false);
                        }

                        return callBack(true, null);
                    });

                    $scope.$on(GenericResultService.EventsNames.onExport, function (e, callBack) {
                        var values = $scope.filterParameters;
                        if (post()) {
                            values.FileName = getFileName();
                            return callBack(false, values); // no errors
                        } else {
                            return callBack(true, null); // signal error
                        }
                    });

                    $scope.$on(GenericResultService.EventsNames.onClear, function () {
                        $scope.dateFrom = null;
                        $scope.dateTo = null;
                        $scope.warrantyType = null;
                        $scope.supplier = null;
                        $scope.exchangeReason = null;
                        $scope.displayTotals = false;
                    });

                    $scope.$on(GenericResultService.EventsNames.onAfterDisplay, function (e, args) {

                        if (args.Data.length > 1) {
                            var fywChargeIndex = args.Data[0].indexOf("Remove FYW Charge");
                            var supplierChargeIndex = args.Data[0].indexOf("Remove Supplier Charge");
                            var ewChargeIndex = args.Data[0].indexOf("Remove EW Charge");
                            var internalChargeIndex = args.Data[0].indexOf("Remove Internal Charge");

                            $scope.fywChargeAmount = args.Data[1][fywChargeIndex];
                            $scope.supplierChargeAmount = args.Data[1][supplierChargeIndex];
                            $scope.ewChargeAmount = args.Data[1][ewChargeIndex];
                            $scope.internalChargeAmount = args.Data[1][internalChargeIndex];

                            var fywCountIndex = args.Data[0].indexOf("Remove FYW Exchange Count");
                            var supplierCountIndex = args.Data[0].indexOf("Remove Supplier Exchange Count");
                            var ewCountIndex = args.Data[0].indexOf("Remove EW Exchange Count");
                            var internalCountIndex = args.Data[0].indexOf("Remove Internal Exchange Count");

                            $scope.fywExchangeCount = args.Data[1][fywCountIndex];
                            $scope.supplierExchangeCount = args.Data[1][supplierCountIndex];
                            $scope.ewExchangeCount = args.Data[1][ewCountIndex];
                            $scope.internalExchangeCount = args.Data[1][internalCountIndex];

                            var TotalChargesIndex = args.Data[0].indexOf("Remove Total Charges");

                            $scope.totalCharges = args.Data[1][TotalChargesIndex];

                            var TotalExchangesIndex = args.Data[0].indexOf("Remove Total Exchanges");

                            $scope.totalExchanges = args.Data[1][TotalExchangesIndex];

                            removeColumn($("table thead tr th:contains('Remove FYW Charge')").index());
                            removeColumn($("table thead tr th:contains('Remove Supplier Charge')").index());
                            removeColumn($("table thead tr th:contains('Remove EW Charge')").index());
                            removeColumn($("table thead tr th:contains('Remove Internal Charge')").index());
                            removeColumn($("table thead tr th:contains('Remove Total Charges')").index());
                            removeColumn($("table thead tr th:contains('Remove FYW Exchange Count')").index());
                            removeColumn($("table thead tr th:contains('Remove Supplier Exchange Count')").index());
                            removeColumn($("table thead tr th:contains('Remove EW Exchange Count')").index());
                            removeColumn($("table thead tr th:contains('Remove Internal Exchange Count')").index());
                            removeColumn($("table thead tr th:contains('Remove Total Exchanges')").index());

                            $scope.displayTotals = true;

                        } else {
                            $scope.fywChargeAmount = null;
                            $scope.supplierChargeAmount = null;
                            $scope.ewChargeAmount = null;
                            $scope.internalChargeAmount = null;
                            $scope.fywExchangeCount = null;
                            $scope.supplierExchangeCount = null;
                            $scope.ewExchangeCount = null;
                            $scope.internalExchangeCount = null;
                            $scope.totalCharges = null;
                            $scope.totalExchanges = null;
                            $scope.displayTotals = false;
                        }
                    });

                    function getFileName() {

                        
                        var validationResult = validatePost();

                        if (!validationResult.isValid) {
                            return '';
                        }

                        var fileName = moment().format('YYYYMMDD');

                        fileName += '_' + 'ReplacementDataReport';
                        fileName += '_dateFrom-' + validationResult.dateFrom.format('YYYYMMDD');
                        fileName += '_dateTo-' + validationResult.dateTo.format('YYYYMMDD');

                        if (validationResult.warrantyType)
                            fileName += '_warrantyType-' + validationResult.warrantyType;

                        if (validationResult.supplier)
                            fileName += '_supplier-' + validationResult.supplier;

                        if (validationResult.exchangeReason)
                            fileName += '_reasonForExchange-' + validationResult.exchangeReason;

                        fileName += '.csv';

                        return fileName;
                    }

                    function removeColumn(index) {
                        if (index != -1) {
                            $('table tr').find('td:eq("' + index + '"),th:eq("' + index + '")').hide();

                        }
                    }

                    function validatePost() {
                        //remove moment from scope

                        var dateFrom = $scope.moment($scope.dateFrom);
                        var dateTo = $scope.moment($scope.dateTo);
                        var warrantyType = $scope.warrantyType;
                        var supplier = $scope.supplier;
                        var exchangeReason = $scope.exchangeReason;

                        var msg = validateDate(dateFrom, $scope.dateFromLabel);
                        msg += validateDate(dateTo, $scope.dateToLabel);

                        if (msg) {
                            notification.show(msg);
                            return { isValid: false };
                        }

                        return {
                            isValid: true,
                            dateFrom: dateFrom,
                            dateTo: dateTo,
                            warrantyType: warrantyType,
                            supplier: supplier,
                            exchangeReason: exchangeReason
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

                        values = {
                            "DateFrom": validationResult.dateFrom,
                            "DateTo": validationResult.dateTo
                        };

                        if ($scope.supplier) {
                            values.Supplier = validationResult.supplier;
                        }

                        if ($scope.warrantyType) {
                            values.WarrantyType = validationResult.warrantyType;
                        }

                        if ($scope.exchangeReason) {
                            values.ExchangeReason = validationResult.exchangeReason;
                        }

                        var grtProcessedResult = (_.isUndefined($scope.grtProcess) || _.isNull($scope.grtProcess)) ? '3' : $scope.grtProcess;
                        values.IsGrtProcessed = parseInt(grtProcessedResult, 10);

                        GenericResultService.ServerParameters.Filter = values;
                        return true;
                    }

                    pickList.populate('ServiceSupplier', function (data) {
                        safeApply(function () {
                            $scope.MasterData.ServiceSuppliers = _.keys(data);
                        });
                    });

                    pickList.populate('Blue.Cosacs.Service.ServiceReasonForExchange', function (data) {
                        safeApply(function () {
                            $scope.MasterData.ExchangeReasons = _.keys(data);
                        });
                    });

                };

                ReplacementDataController.$inject = ['$scope', 'GenericResultService', 'xhr', '$location'];

                app().service('GenericResultService', ['$rootScope', function ($rootScope) {
                    return GenericService($rootScope);
                } ])
                .service('controllerRouting', function () {
                    return {
                        exportUrl: '/Report/ReplacementData/GenericReportExport',
                        reportUrl: '/Report/ReplacementData/GenericReport'
                    };
                })
                .controller('ReplacementDataController', ReplacementDataController)
                .controller('GenericReportController', GenericReportResult);

                return angular.bootstrap($el, ['myApp']);
            }
        };
    });