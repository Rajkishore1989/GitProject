/*global define*/
define(['underscore', 'angular', 'url', 'moment', 'alert', 'angularShared/app', 'jquery.pickList',
    'service/technicianPaymentsDisplayController', 'localisation', 'angular.ui', 'angular-resource', 'lib/select2'],
    function (_, angular, url, moment, alert, app, pickList, technicianPaymentsDisplayController, localisation) {
        'use strict';

        return {
            init: function ($el) {

                var myPaymentsController = function ($scope, $rootScope, $timeout) {

                    $scope.defaultDateFrom = new Date(moment().add('days', -30).format('DD MMM YYYY'));
                    $scope.dateFrom = $scope.defaultDateFrom;
                    $scope.defaultType = '';//matching Pending
                    $scope.type = $scope.defaultType;
                    $scope.culture = localisation.getSettings();

                    $scope.datePicker = {
                        defaultDate: "+0",
                        maxDate: "+0",
                        dateFormat: "d M yy",
                        changeMonth: true,
                        changeYear: true
                    };

                    $scope.clear = function () {
                        $scope.dateFrom = $scope.defaultDateFrom;
                        $scope.dateTo = null;
                        $scope.type = $scope.defaultType;
                        $scope.requestFilters = null;

                        $rootScope.$broadcast('myPayment.clear', '');
                        $scope.search();
                    };

                    $scope.search = function () {
                        if ($scope.canSearch) {
                            $rootScope.$broadcast('myPayment.search', {
                                technician: $scope.User,
                                dateFrom: $scope.dateFrom,
                                dateTo: $scope.dateTo,
                                type: $scope.type,
                                sr: $scope.requestFilters
                            });
                        }
                    };

                    var hasNonEmptyValue = function (val) {
                        return val !== undefined && val !== null && val !== "";
                    };

                    $scope.canSearch = function () {
                        //one of the filters have to be filled
                        return hasNonEmptyValue($scope.dateFrom) ||
                                hasNonEmptyValue($scope.dateTo) ||
                                hasNonEmptyValue($scope.requestFilters) ||
                                $scope.type !== 'Pending';
                    };

                    $scope.exportCsv = function () {
                        $rootScope.$broadcast('myPayment.export');
                    };

                    $scope.print = function () {
                        $rootScope.$broadcast('myPayment.print', {
                            technician: '',
                            dateFrom: $scope.dateFrom,
                            dateTo: $scope.dateTo,
                            type: $scope.type,
                            sr: $scope.requestFilters,
                            technicianId: $scope.User
                        });
                    };
                };

                myPaymentsController.$inject = ['$scope', '$rootScope', '$timeout', 'xhr'];

                app().controller('technicianPaymentsDisplayController', technicianPaymentsDisplayController)
                 .controller('myPaymentsController', myPaymentsController);

                return angular.bootstrap($el, ['myApp']);
            }
        };
    });