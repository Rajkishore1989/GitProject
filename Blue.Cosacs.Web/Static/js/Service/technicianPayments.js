/*global define*/
define(['underscore', 'angular', 'url', 'moment', 'angularShared/app', 'alert', 'jquery.pickList',
    'service/technicianPaymentsDisplayController', 'localisation', 'angular.ui', 'angular-resource', 'lib/select2'],
    function (_, angular, url, moment, app, alert, pickList, technicianPaymentsDisplayController, localisation) {
        'use strict';
        return {
            init: function ($el) {

                var technicianPayments = function ($scope, $rootScope, xhr) {
                    $scope.defaultType = 'All';
                    $scope.type = 'All';
                    $scope.requestFilters = '';
                    $scope.selectedTechnician = null;

                    xhr.get(url.resolve('/Service/TechnicianPayments/GetAllTechnicians'))
                        .success(function (data) {
                            $scope.technicians = data;
                        });

                    $scope.clear = function () {
                        $scope.dateFrom = null;
                        $scope.dateTo = null;
                        $scope.type = $scope.defaultType;
                        $scope.requestFilters = null;

                        $rootScope.$broadcast('myPayment.clear', '');
                    };

                    var search = function () {
                        if ($scope.canSearch()) {
                            $scope.selectedName = "for " + $scope.selectedTechnician.FullName;
                            $rootScope.$broadcast('myPayment.search', {
                                technician: $scope.selectedTechnician.TechnicianId,
                                dateFrom: $scope.dateFrom,
                                dateTo: $scope.dateTo,
                                type: $scope.type,
                                sr: $scope.requestFilters
                            });
                        }
                    };
                    $scope.search = search;

                    $scope.culture = localisation.getSettings();
                    $scope.datePicker = {
                        defaultDate: "+0",
                        maxDate: "+0",
                        dateFormat: "d M yy",
                        changeMonth: true,
                        changeYear: true
                    };

                    var hasNonEmptyValue = function (val) {
                        return val !== undefined && val !== null && val !== "";
                    };

                    $scope.canSearch = function () {
                        //one of the filters have to be filled and selectedTechnician as well
                        return $scope.selectedTechnician !== null &&
                            (hasNonEmptyValue($scope.dateFrom) ||
                                hasNonEmptyValue($scope.dateTo) ||
                                hasNonEmptyValue($scope.requestFilters) ||
                            $scope.type !== 'All');
                    };

                    $scope.goProfile = function (id) {
                        return url.resolve('Admin/Users/Profile/') + id;
                    };

                    $scope.pay = function () {
                        $rootScope.$broadcast('myPayment.pay');
                    };

                    $scope.exportCsv = function () {
                        $rootScope.$broadcast('myPayment.export');
                    };

                    $scope.print = function () {

                        $rootScope.$broadcast('myPayment.print', {
                            technician: $scope.selectedTechnician.FullName,
                            dateFrom: $scope.dateFrom,
                            dateTo: $scope.dateTo,
                            type: $scope.type,
                            sr: $scope.requestFilters,
                            technicianId: null
                        });
                    };

                    $scope.setActive = function (tech) {
                        _.map($scope.technicians, function (t) {
                            if (t.active) {
                                t.active = false;
                            }
                        });
                        tech.active = true;
                        $scope.selectedTechnician = tech;
                    };
                };

                technicianPayments.$inject = ['$scope', '$rootScope', 'xhr'];

                app().controller('technicianPaymentsDisplayController', technicianPaymentsDisplayController)
                     .controller('technicianPayments', technicianPayments);

                return angular.bootstrap($el, ['myApp']);
            }
        };
    });