/*global define*/
define(['underscore', 'angular', 'url', 'angularShared/app', 'notification', 'lookup'],
    function (_, angular, url, app, notification) {
        'use strict';

        return {
            init: function ($el) {
                var monthlyClaimsSummary = function ($scope, $anchorScroll, $location, lookup, xhr) {
                    $scope.yearLabel = "Financial Year";
                    $scope.monthLabel = "Month";
                    $scope.suppliersLbl = "Supplier";

                    $scope.months = lookup.getMonths();
                    // $scope.ServiceSuppliers = lookup.populate('ServiceSupplier');
                    lookup.populate('ServiceSupplier').then(function (data) {

                        $scope.ServiceSuppliers = _.extend({"Any": "All Suppliers"}, data);
                    });

                    $scope.filterParameters = $location.search();
                    if (_.isEmpty($scope.filterParameters)) {
                        $scope.filterParameters = {};
                    }


                    function validatePost() {
                        var msg = validateYear($scope.year, $scope.yearLabel);

                        msg += validateEmpty($scope.month, $scope.monthLabel);
                        msg += validateEmpty($scope.supplier, $scope.suppliersLbl);

                        if (msg) {
                            notification.show(msg);
                            return { isValid: false };
                        }

                        return {
                            isValid: true,
                            year: $scope.year,
                            month: $scope.month,
                            supplier: $scope.supplier
                        };
                    }

                    $scope.search = function () {
                        var validationResult = validatePost();

                        if (!validationResult.isValid) {
                            return false;
                        }

                      var  values = {
                            "finYear": validationResult.year,
                            "month": validationResult.month,
                            "supplier": validationResult.supplier
                        };

                        xhr({
                            method: 'GET',
                            url: url.resolve('Report/ServiceMonthlyClaims/Filter'),
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

                        var urlToFile = 'Report/ServiceMonthlyClaims/Export?finYear=' +
                            validationResult.year +
                            '&month=' +
                            validationResult.month +
                            '&supplier=' +
                            validationResult.supplier;

                        return url.open(urlToFile);
                    };

                    $scope.clear = function () {
                        $scope.queryResults = null;
                        $scope.resultsVisible = "hidden";

                        $scope.year = null;
                        $scope.month = null;
                        $scope.supplier = null;
                    };

                    function validateYear(year, lbl) {

                        /*years from 1900 to 2050*/
                        if (!/\b(19[0-9]{2}|20[01][0-9]|2050)\b/.test(year)) {
                            return 'Invalid ' + lbl + '<br>';
                        }

                        return '';
                    }

                    function validateEmpty(para, lbl) {
                        if (!para) {
                            return 'Invalid ' + lbl + '<br>';
                        }

                        return '';
                    }

                    $scope.clear();

                };

                monthlyClaimsSummary.$inject = ['$scope', '$anchorScroll', '$location', 'lookup', 'xhr'];

                app().controller('MonthlyClaimsSummaryController', monthlyClaimsSummary);

                return angular.bootstrap($el, ['myApp']);
            }
        };
    });