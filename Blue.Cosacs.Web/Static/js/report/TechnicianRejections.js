/*global define*/
define(['angular', 'angularShared/app', 'notification', 'moment', 'angularShared/interceptor', 'angularShared/loader',
    'report/GenericReportResult', 'report/GenericService', 'angular.ui', 'angular.bootstrap'],

    function (angular, app, notification, moment, interceptor, loader, GenericReportResult, GenericService) {
        'use strict';
        return {
            init: function ($el) {
                var technicianRejectionsController = function ($scope, GenericResultService) {

                    $scope.dateLoggedFrom = null;
                    $scope.dateLoggedTo = null;
                    $scope.dateLoggedFromLabel = 'Date logged from';
                    $scope.dateLoggedToLabel = 'Date logged to';
                    $scope.totalRejectionCount = 0;

                    $scope.linkDatePicker = {
                        dateFormat: "D, d MM, yy",
                        changeMonth: true,
                        changeYear: true
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
                        $scope.dateLoggedFrom = null;
                        $scope.dateLoggedTo = null;
                        $scope.totalRejectionCount = 0;
                    });

                    $scope.$on(GenericResultService.EventsNames.onAfterDisplay,function (e, args){
                        $scope.totalRejectionCount = args.Data.length === 0 ? 0 : args.Data.length - 1;
                    });

                    function getFileName() {
                        var fileName = moment().format('YYYYMMDD');
                        var firstDate = moment($scope.dateLoggedFrom);
                        var endDate = moment($scope.dateLoggedTo);

                        fileName += '_' + 'TechnicianRejectionsReport';
                        fileName += '_from-' + firstDate.format('YYYYMMDD');
                        fileName += '_to-' + endDate.format('YYYYMMDD');
                        fileName += '.csv';

                        return fileName;
                    }

                    function validatePost() {
                        var firstDate = !$scope.dateLoggedFrom ? null : moment($scope.dateLoggedFrom);
                        if (firstDate === null || !firstDate.isValid()) {
                            notification.show('Invalid ' + $scope.dateLoggedFromLabel);
                            return { isValid: false };
                        }

                        var endDate = !$scope.dateLoggedTo ? null : moment($scope.dateLoggedTo);
                        if (endDate === null || !endDate.isValid()) {
                            notification.show('Invalid ' + $scope.dateLoggedToLabel);
                            return { isValid: false };
                        }

                        return {
                            isValid: true,
                            firstDate: firstDate,
                            endDate: endDate
                        };
                    }

                    function post(values) {
                        var validationResult = validatePost();

                        if (!validationResult.isValid) {
                            return false;
                        }

                        values.ReportId = 'TechnicianRejections';
                        values.Filter = {
                            "FirstDate": validationResult.firstDate.format('YYYYMMDD'),
                            "LastDate": validationResult.endDate.format('YYYYMMDD')
                        };

                        return true;
                    }
                };

                technicianRejectionsController.$inject = ['$scope', 'GenericResultService'];

                app().service('GenericResultService',['$rootScope', function ($rootScope) {
                    return GenericService($rootScope);
                }])
                .controller('technicianRejectionsController', technicianRejectionsController)
                .controller('GenericReportController', GenericReportResult);

                return angular.bootstrap($el, ['myApp']);
            }
        };
    });