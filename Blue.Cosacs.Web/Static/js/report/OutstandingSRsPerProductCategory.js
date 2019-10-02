/*global define*/
define(['underscore', 'angular', 'url', 'angularShared/app', 'notification', 'moment', 'angularShared/interceptor',
        'angular.ui', 'angular.bootstrap', 'lib/select2', 'jquery.ui'],

    function (_, angular, url, app, notification, moment) {
        'use strict';
        return {
            init: function ($el) {
                var OutstandingSRsPerProductCategoryController = function ($scope, xhr) {
                    $scope.MasterData = {};

                    $scope.dateFromLabel = 'Date Logged From';
                    $scope.dateToLabel = 'Date Logged To';
                    $scope.statusLabel = 'Status';
                    $scope.supplierLabel = 'Supplier';
                    $scope.technicianLabel = 'Technician';
                    $scope.warrantyTypeLabel = 'Warranty Type';

                    var getTechnicians = function () {
                        return xhr.get(url.resolve('/Service/TechnicianDiaries/GetTechnicians'))
                            .then(function (response) {
                                if (typeof response.data === 'object') {
                                    var array = {};
                                    _.each(response.data, function (singleVal) {
                                        array[singleVal.Id] = singleVal.Name;
                                    });
                                    return array;
                                }
                            });
                    };

                    $scope.WarrantyTypes = { 'F': 'Free',
                        'E': 'Extended',
                        'I': 'Instant Replacement' };

                    $scope.Status = {
                        'All Outstanding': 'All Outstanding',
                        'Unallocated': 'Unallocated',
                        'Allocated': 'Allocated'
                    };

                    $scope.Technicians = getTechnicians();

                    $scope.linkDatePicker = {
                        dateFormat: "D, d MM, yy",
                        changeMonth: true,
                        changeYear: true
                    };

                    $scope.$watch('status', function (newVal) {
                        $scope.queryResults = null;

                        if (!newVal) {
                            return;
                        }

                        if (newVal === "All Outstanding" || newVal === "Unallocated") {
                            $scope.headerLbl = "Outstanding";
                            $scope.dateFromLabel = "Date Logged From";
                            $scope.dateToLabel = "Date Logged To";
                        } else {
                            $scope.headerLbl = "Allocated";
                            $scope.dateFromLabel = "Date Allocated From";
                            $scope.dateToLabel = "Date Allocated To";
                        }
                    });

                    function validatePost() {
                        var dateFrom = moment($scope.dateFrom);
                        var dateTo = moment($scope.dateTo);
                        var status = $scope.status;
                        var currentDate = moment(new Date());

                        var msg = validateDate(dateFrom, $scope.dateFromLabel);
                        msg += validateDate(dateTo, $scope.dateToLabel);

                        if (!$scope.status) {
                            msg += 'Invalid ' + $scope.statusLabel;
                        }

                        if (msg) {
                            notification.show(msg);
                            return { isValid: false };
                        }

                        return {
                            isValid: true,
                            dateFrom: dateFrom,
                            dateTo: dateTo,
                            status: status,
                            supplier: $scope.supplier,
                            technician: $scope.technician,
                            warrantyType: $scope.warrantyType,
                            currentDate: currentDate
                        };
                    }

                    function validateDate(date, lbl) {
                        var inputDate = moment(date);

                        if (inputDate === null || !inputDate.isValid() || !(date)) {
                            return 'Invalid ' + lbl + '<br>';
                        }

                        return '';
                    }

                    $scope.search = function () {
                        var validationResult = validatePost();

                        if (!validationResult.isValid) {
                            return false;
                        }

                        var values = {
                            "DateFrom": validationResult.dateFrom.format("YYYY/MM/DD"),
                            "DateTo": validationResult.dateTo.format("YYYY/MM/DD"),
                            "CurrentDate": validationResult.currentDate.format("YYYY/MM/DD"),
                            "Status": validationResult.status
                        };

                        if ($scope.supplier) {
                            values.Supplier = validationResult.supplier;
                        }

                        if ($scope.technician) {
                            values.technician = validationResult.technician;
                        }

                        if ($scope.warrantyType) {
                            values.WarrantyType = validationResult.warrantyType;
                        }

                        xhr({
                            method: 'GET',
                            url: url.resolve('Report/OutstandingSRsPerProductCategory/Filter'),
                            params: values
                        }).success(function (data) {
                            if (data.Result === "ok") {
                                $scope.queryResults = data.data;
                                $scope.resultsVisible = "visible";
                            }
                            else {
                                $scope.resultsVisible = "hidden";
                                notification.show(data.Message);
                            }
                        });

                        return null;
                    };

                    $scope.exportResults = function () {
                        var validationResult = validatePost();

                        if (!validationResult.isValid) {
                            return false;
                        }

                        var urlToFile = 'Report/OutstandingSRsPerProductCategory/Export?DateFrom=' +
                            validationResult.dateFrom.format('YYYY/MM/DD') +
                            '&DateTo=' + validationResult.dateTo.format('YYYY/MM/DD') +
                            '&CurrentDate=' + validationResult.currentDate.format('YYYY/MM/DD') +
                            '&Status=' + validationResult.status;

                        if (validationResult.supplier)
                            urlToFile +='&supplier=' + validationResult.supplier;

                        if (validationResult.technician)
                            urlToFile +='&Technician='+ validationResult.technician;

                        if (validationResult.warrantyType)
                                urlToFile +='&WarrantyType='+ validationResult.warrantyType;

                        return url.open(encodeURI(urlToFile));
                    };

                    $scope.clear = function () {
                        $scope.dateFrom = null;
                        $scope.dateTo = null;
                        $scope.status = null;
                        $scope.supplier = null;
                        $scope.technician = null;
                        $scope.warrantyType = null;
                        $scope.currentDate = null;
                        $scope.resultsVisible = "hidden";
                        $scope.moment = moment;
                        $scope.headerLbl = "Outstanding";

                        $scope.queryResults = null;
                    };

                    $scope.clear();
                };

                OutstandingSRsPerProductCategoryController.$inject = ['$scope', 'xhr'];

                app().controller('OutstandingSRsPerProductCategory', OutstandingSRsPerProductCategoryController);

                return angular.bootstrap($el, ['myApp']);
            }
        };
    });