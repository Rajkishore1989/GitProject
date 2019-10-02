define([
    'angular',
    'underscore',
    'url'
],
function (angular, _, url) {
    'use strict';

    return function ($scope, $timeout, $filter, $location, pageHelper, adjustmentRepo, locationResourceProvider) {

        $scope.orderItemsResult = [];
        $scope.searching = false;
        $scope.dataAvailable = false;
        $scope.dateFormat = pageHelper.dateFormat;


        $scope.pageCount = 0;
        $scope.pageSize = 10;
        $scope.pageIndex = 1;

        $scope.statusOptions = {
            0: 'Pending Approval',
            1: 'Approved'
        };

        $scope.param = {
            primaryReasonId: null,
            secondaryReasonId: null,
            locationId: null,
            minStockAdjustmentId: null,
            maxStockAdjustmentId: null,
            minCreatedDate: null,
            maxCreatedDate: null,
            approved: null
        };

        function configureDatePicker() {
            $timeout(function () {
                $('.date').datepicker('option', 'maxDate', new Date());
            }, 0);
        }

        function updateTitle() {
            pageHelper.setTitle('Stock Adjustment Search');
        }

        function generateUrl(link) {
            return url.resolve(link);
        }

        function initializePageData() {

            adjustmentRepo.getReasons().then(function (reasons) {
                $scope.reasons = reasons;
                $scope.primaryReasons = _.map(reasons, function (r) {
                    return { k: r.id, v: r.primaryReason };
                });
            });

            locationResourceProvider.getList().then(function (locations) {
                $scope.locations = locations;
            });

            configureDatePicker();
        }
        function newSearch() {
            if ($scope.searching) {
                return;
            }

            $scope.pageIndex = 1;
            search();
        }

        function search() {

            $scope.searching = true;

            adjustmentRepo
                        .search($scope.param, $scope.pageSize, $scope.pageIndex)
                        .then(function (model) {
                            $scope.data = model;
                            $scope.searching = false;
                        }, function (err) {
                            $scope.searching = false;
                            if (err && err.message) {
                                pageHelper.notification.show(err.message);
                            }
                        });

        }

        function clear() {

            $scope.param = {
                primaryReasonId: null,
                secondaryReasonId: null,
                locationId: null,
                minStockAdjustmentId: null,
                maxStockAdjustmentId: null,
                minCreatedDate: null,
                maxCreatedDate: null,
                approved: null
            };

            search();
        }

        function canSearch() {
            return !$scope.searching;
        }


        function selectPage (pageNumber) {
            $scope.pageIndex = pageNumber;
            return search();
        }

        $scope.$watch('param.primaryReasonId', function (primaryId) {
            var prim = _.find($scope.reasons, function (r) {
                return r.id === primaryId;
            });

            if (prim) {
                $scope.secondaryReasons = _.map(prim.secondaryReasons, function (r) {
                    return { k: r.id, v: r.secondaryReason };
                });
            } else {
                $scope.secondaryReasons = undefined;
            }
        });

        $scope.$watch('data', function (data) {

            if (data.results.length > 0) {
                $scope.orderItemsResult = data.results;
                $scope.dataAvailable = true;

                $scope.pageCount = Math.ceil(data.totalResults / $scope.pageSize);
            }
            else {
                $scope.orderItemsResult = {};
                $scope.dataAvailable = false;
            }

            updateTitle();
        });

        $scope.newSearch = newSearch;
        $scope.clear = clear;
        $scope.canSearch = canSearch;
        $scope.generateUrl = generateUrl;
        $scope.selectPage = selectPage;

        initializePageData();
    };
});
