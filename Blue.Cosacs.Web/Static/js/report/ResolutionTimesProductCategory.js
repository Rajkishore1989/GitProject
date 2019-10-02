/*global define*/
define(['jquery', 'underscore', 'url', 'angular', 'angularShared/app', 'notification', 'moment', 'angularShared/interceptor', 'angularShared/loader',
        'report/GenericReportResult', 'report/GenericService', 'angular.ui', 'angular.bootstrap', 'lib/select2'],
    function ($, _, url, angular, app, notification, moment, interceptor, loader, GenericReportResult, GenericService) {
        'use strict';
        return {
            init: function ($el) {
                var resolutionTimesProductCategoryController = function ($scope, $anchorScroll, $location, GenericResultService, xhr, productHierarchySrv) {
                    $scope.hasPagination = true;
                    _.extend(GenericResultService.ServerParameters, $location.search(), { PageIndex: 0, PageSize: 250, PageCount: 0, ReportId: 'ResolutionTimesProductCategory' });
                    $scope.filterParameters = GenericResultService.ServerParameters;
                    $scope.DaysType = { "1": "Days to Resolve", "0": "Days to Complete" };
                    GenericResultService.onTransform = function(data) {
                        data.headers.unshift([
                            { title: '' },
                            { title: $scope.filterType === 'ByDatesLogged' ?
                                'Days to Resolve' : 'Days to Complete', colspan: 8
                            },
                            { title: '' }
                        ]);
                        return data;
                    };

                    $scope.productCategory = productHierarchySrv.getHierarchyLevel(2);

                    var getTechnicians = function() {
                        return xhr.get(url.resolve('/Service/TechnicianDiaries/GetTechnicians'))
                            .then(function(response) {
                                if (typeof response.data === 'object') {
                                    var array = {};
                                    _.each(response.data, function(singleVal) {
                                        array[singleVal.Id] = singleVal.Name;
                                    });
                                    return array;
                                }
                            });
                    };

                    var getChargeTo = function() {
                        return xhr.get(url.resolve('/Service/Requests/GetChargeTo'))
                            .then(function(response) {
                                if (typeof response.data === 'object') {
                                    var array = {};
                                    _.each(response.data, function(singleVal) {
                                        array[singleVal.Type] = singleVal.Type;
                                    });
                                    return array;
                                }
                            });
                    };
                    $scope.ChargeTo = getChargeTo();
                    $scope.Technicians = getTechnicians();

                    $scope.linkDatePicker = {
                        dateFormat: "D, d MM, yy",
                        changeMonth: true,
                        changeYear: true
                    };

                    $scope.filterType = 'ByDatesLogged';

                    $scope.$on(GenericResultService.EventsNames.onSearch, function (e, callBack) {
                        if (getPostValues()) {
                            return callBack(false);
                        }

                        return callBack(true);
                    });

                    $scope.$on(GenericResultService.EventsNames.onExport, function (e, callBack) {

                        if (getPostValues()) {
                            GenericResultService.ServerParameters.FileName = getFileName();
                            return callBack(false);
                        }

                        return callBack(true, null);
                    });

                    $scope.$on(GenericResultService.EventsNames.onClear, function () {
                        $scope.filterType = 'ByDatesLogged';
                        $scope.filterParameters.Days = null;
                        $scope.filterParameters.DateLoggedFrom = null;
                        $scope.filterParameters.DateLoggedTo = null;
                        $scope.filterParameters.DateAllocatedFrom = null;
                        $scope.filterParameters.DateAllocatedTo	= null;
                        $scope.filterParameters.TechnicianId = null;
                        $scope.filterParameters.ProductCategory = null;
                        $scope.filterParameters.ChargeTo = null;
                        $scope.filterParameters.daysType = null;
                    });

                    function getFileName(){
                        var fileName = moment().format('YYYYMMDD');

                        fileName += '_' + GenericResultService.ServerParameters.ReportId;
                        fileName += '_DaysType-' + getResolveOrComplete() === 1 ? 'Days to Resolve' : 'Days to Complete';
                        if ($scope.filterType === 'ByDays'){
                            fileName += '_Days-' + $scope.filterParameters.Days;
                        }
                        if($scope.filterType === 'ByDatesLogged'){
                            fileName += '_DateLoggedFrom-' + moment($scope.filterParameters.DateLoggedFrom).format('YYYYMMDD');
                            fileName += '_DateLoggedTo-' + moment($scope.filterParameters.DateLoggedTo).format('YYYYMMDD');
                        }
                        if($scope.filterType === 'ByDatesAllocated'){
                            fileName += '_DateAllocatedFrom-' + moment($scope.filterParameters.DateAllocatedFrom).format('YYYYMMDD');
                            fileName += '_DateAllocatedTo-' + moment($scope.filterParameters.DateAllocatedTo).format('YYYYMMDD');
                        }
                        if($scope.filterParameters.TechnicianId){
                            fileName += '_TechnicianId-' + $scope.filterParameters.TechnicianId;
                        }
                        if($scope.filterParameters.ProductCategory){
                            fileName += '_ProductCategory-' + $scope.filterParameters.ProductCategory;
                        }
                        if ($scope.filterParameters.ChargeTo){
                            fileName += '_ChargeTo-' + $scope.filterParameters.ChargeTo;
                        }

                        return fileName + '.csv';
                    }

                    function getPostValues() {
                        if(!validatePost()){
                            return false;
                        }
                        GenericResultService.ServerParameters.Filter = {};

                        GenericResultService.ServerParameters.Filter.ResolveOrComplete = getResolveOrComplete();
                        if ($scope.filterType === 'ByDays'){
                            GenericResultService.ServerParameters.Filter.Days =  $scope.filterParameters.Days;
                        }
                        if($scope.filterType === 'ByDatesLogged'){
                            GenericResultService.ServerParameters.Filter.DateLoggedFrom = moment($scope.filterParameters.DateLoggedFrom).format('YYYYMMDD');
                            GenericResultService.ServerParameters.Filter.DateLoggedTo = moment($scope.filterParameters.DateLoggedTo).format('YYYYMMDD');
                        }
                        if($scope.filterType === 'ByDatesAllocated'){
                            GenericResultService.ServerParameters.Filter.DateAllocatedFrom = moment($scope.filterParameters.DateAllocatedFrom).format('YYYYMMDD');
                            GenericResultService.ServerParameters.Filter.DateAllocatedTo = moment($scope.filterParameters.DateAllocatedTo).format('YYYYMMDD');
                        }
                        if($scope.filterParameters.TechnicianId){
                            GenericResultService.ServerParameters.Filter.TechnicianId = $scope.filterParameters.TechnicianId;
                        }
                        if($scope.filterParameters.ProductCategory){
                            GenericResultService.ServerParameters.Filter.ProductCategory = $scope.filterParameters.ProductCategory;
                        }
                        if ($scope.filterParameters.ChargeTo){
                            GenericResultService.ServerParameters.Filter.ChargeTo = $scope.filterParameters.ChargeTo;
                        }

                        return true;
                    }

                    function validatePost(){
                        if ($scope.filterType === 'ByDays' && (!$scope.filterParameters.Days || !$scope.filterParameters.daysType || isNaN(parseInt($scope.filterParameters.Days, 10)))){
                            notification.show('Invalid Number of Days');
                            return false;
                        }

                        if($scope.filterType === 'ByDatesLogged' && (!$scope.filterParameters.DateLoggedFrom || !$scope.filterParameters.DateLoggedTo )){
                            notification.show('Invalid Dates Logged');
                            return false;
                        }

                        if($scope.filterType === 'ByDatesAllocated' && (!$scope.filterParameters.DateAllocatedFrom || !$scope.filterParameters.DateAllocatedTo )){
                            notification.show('Invalid Dates Allocated');
                            return false;
                        }

                        return true;
                    }

                    function getResolveOrComplete(){
                        if($scope.filterType === 'ByDatesLogged'){
                            return 1;
                        }

                        return 0;
                    }
                };

                resolutionTimesProductCategoryController.$inject = ['$scope', '$anchorScroll', '$location', 'GenericResultService', 'xhr', 'productHierarchySrv'];

                app().service('GenericResultService',['$rootScope', function ($rootScope) {
                    return GenericService($rootScope);
                }])
                    .controller('resolutionTimesProductCategoryController', resolutionTimesProductCategoryController)
                    .controller('GenericReportController', GenericReportResult);

                return angular.bootstrap($el, ['myApp']);
            }
        };
    });