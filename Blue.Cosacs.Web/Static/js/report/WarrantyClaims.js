/*global define*/
define(['underscore', 'angular', 'moment', 'angularShared/app', 'notification', 'angularShared/interceptor', 'angularShared/loader',
    'report/GenericReportResult', 'report/GenericService', 'url', 'merchandising/hierarchy/controllers/productHierarchy', 'angular.ui', 'angular.bootstrap'],

    function (_, angular, moment, app, notification, interceptor, loader, GenericReportResult, GenericService, url) {
        'use strict';
        return {
            init: function ($el) {
                var WarrantyClaimsController = function ($scope, $location, GenericResultService, xhr, productHierarchySrv) {

                    $scope.hasPagination = true;
                    _.extend(GenericResultService.ServerParameters, $location.search(), { PageIndex: 1, PageSize: 250, PageCount: 0, ReportId: 'WarrantyClaims' });
                    $scope.filterParameters = GenericResultService.ServerParameters;

                    $scope.yearLabel = 'Year';
                    $scope.categoryLabel = 'Department';

                    GenericResultService.onTransform = function (data) {
                        var regExp = /\(([^)]+)\)/;
                        for (var i = 0; i < data.headers[0].length; i++) {
                            data.headers[0][i].title = regExp.exec(data.headers[0][i].title) === null ? data.headers[0][i].title : regExp.exec(data.headers[0][i].title)[1];
                        }
                        return data;
                    };

                    $scope.productCategories = productHierarchySrv.getHierarchyLevel(2);

                    $scope.selectPage = function (page) {
                        $scope.filter.PageIndex = page;
                        $scope.search();
                    };

                    $scope.filterParameters = $location.search();
                    if (_.isEmpty($scope.filterParameters)) {
                        $scope.filterParameters = {};
                    }

                    $scope.$on(GenericResultService.EventsNames.onSearch, function (e, callBack) {

                        if (post()) {
                            return callBack(false);
                        }
                        else {
                            return callBack(true);
                        }
                    });

                    $scope.$on(GenericResultService.EventsNames.onExport, function (e, callBack) {

                        if (post()) {
                            GenericResultService.ServerParameters.FileName = getFileName();
                            return callBack(false);
                        }
                        else {
                            return callBack(true);
                        }
                    });

                    $scope.$on(GenericResultService.EventsNames.onClear, function () {
                        $scope.filterParameters.year = null;
                        $scope.filterParameters.category = null;
                    });

                    function getFileName() {
                        var fileName = moment().format('YYYYMMDD');

                        fileName += '_' + 'WarrantyClaimsReport';
                        fileName += '_year-' + $scope.filterParameters.year;
                        fileName += '_Department-' + $scope.filterParameters.category;
                        fileName += '.csv';

                        return fileName;
                    }

                    function validatePost() {
                        /*years from 1900 to 2020*/
                        if (!/\b(19[0-9]{2}|20[01][0-9]|2020)\b/.test($scope.filterParameters.year)) {
                            notification.show('Invalid ' + $scope.yearLabel);
                            return { isValid: false };
                        }

                        if (!$scope.filterParameters.category) {
                            notification.show('Invalid ' + $scope.categoryLabel);
                            return { isValid: false };
                        }

                        return {
                            isValid: true,
                            Year: parseInt($scope.filterParameters.year, 10) + '-04-01T00:00:00',
                            Category: $scope.filterParameters.category
                        };
                    }

                    function post() {
                        var validationResult = validatePost();

                        if (!validationResult.isValid) {
                            return false;
                        }

                        GenericResultService.ServerParameters.ReportId = 'WarrantyClaims';
                        GenericResultService.ServerParameters.Filter = {
                            "Year": validationResult.Year,
                            "Category": validationResult.Category === '0' ? 'ALLMEMBERS' : validationResult.Category
                        };

                        return true;
                    }
                };

                WarrantyClaimsController.$inject = ['$scope', '$location', 'GenericResultService', 'xhr', 'productHierarchySrv'];

                app()
                    .service('GenericResultService',['$rootScope', function ($rootScope) {
                        return GenericService($rootScope);
                    }])
                    .service('controllerRouting', function () {
                        return {
                            exportUrl: '/Report/WarrantyClaims/GenericReportExport',
                            reportUrl: '/Report/WarrantyClaims/GenericReport'
                        };
                    })
                    .controller('WarrantyClaimsController', WarrantyClaimsController)
                    .controller('GenericReportController', GenericReportResult);

                return angular.bootstrap($el, ['myApp']);
            }
        };
    });