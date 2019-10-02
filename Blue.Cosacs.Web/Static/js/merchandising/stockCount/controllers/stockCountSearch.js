define([
    'angular',
    'underscore',
    'url'
],
function (angular, _, url) {
    'use strict';

    return function ($scope, $timeout, $filter, $location, pageHelper, stockCountRepo, locationResourceProvider, helpers) {
        $scope.orderItemsResult = [];
        $scope.searching = false;
        $scope.dataAvailable = false;
        $scope.dateFormat = pageHelper.dateFormat;
        $scope.pageCount = 0;
        $scope.pageSize = 10;
        $scope.pageNumber = 1;

        $scope.statusOptions = {
            0: 'Scheduled',
            1: 'In Progress',
            2: 'Cancelled',
            3: 'Closed'
        };

        $scope.typeOptions = {
            0: 'Perpetual',
            1: 'Quarterly'
        };

        function configureDatePicker() {
            $timeout(function () {
                $('.date').datepicker('option', 'maxDate', new Date());
            }, 0);
        }

        function generateUrl(link) {
            return url.resolve(link);
        }

        function initializePageData() {
            locationResourceProvider.getList().then(function (locations) {
                $scope.locations = locations;
            });

            configureDatePicker();
            $scope.param = {};
            pageHelper.setTitle('Stock Count Search');
        }

        function canSearch() {
            return !$scope.searching;
        }

        function updateStatus() {
            if ($scope.statusId !== null) {
                var stat = $scope.statusOptions[$scope.statusId];
                $scope.param.status = stat === 'Scheduled' ? 'Pending' : stat;
            } else {
                $scope.param.status = null;
            }
        }

        function updateType() {
            if ($scope.typeId !== null) {
                $scope.param.type = $scope.typeOptions[$scope.typeId];
            } else {
                $scope.param.type = null;
            }
        }

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
        });

        function search(pageSize, pageNumber) {
            if ($scope.searching) {
                return;
            }

            $scope.searching = true;

            if (!pageSize) {
                pageSize = $scope.pageSize;
                pageNumber = $scope.pageNumber;
            }

            stockCountRepo
                .search(helpers.cleanse($scope.param || {}), pageSize, pageNumber)
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

        function selectPage(pageNumber) {
            $scope.pageNumber = pageNumber;
            return search();
        }

        function newSearch() {
            if ($scope.searching) {
                return;
            }

            $scope.pageNumber = 1;
            search();
        }

        function clear() {
            $scope.param = {};
            $scope.statusId = null;
            $scope.typeId = null;

            search();
        }
        
        function getStatus(status) {
            return status === 'Pending' ? 'Scheduled' : status;
        }

        $scope.newSearch = newSearch;
        $scope.clear = clear;
        $scope.canSearch = canSearch;
        $scope.generateUrl = generateUrl;
        $scope.selectPage = selectPage;
        $scope.updateStatus = updateStatus;
        $scope.updateType = updateType;
        $scope.getStatus = getStatus;

        initializePageData();
    };
});
