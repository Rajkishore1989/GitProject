define([
    'angular',
    'underscore',
    'url'
],
function (angular, _, url) {
    'use strict';

    return function ($scope, $timeout, pageHelper, stockRequisitionRepo, locationResourceProvider) {
        $scope.searching = false;
        $scope.dateFormat = pageHelper.dateFormat;
        $scope.statusOptions = {
            0: 'Pending',
            1: 'Cancelled',
            2: 'Completed'
        };
        $scope.pageCount = 0;
        $scope.pageSize = 10;
        $scope.pageNumber = 1;

        function configureDatePicker() {
            $timeout(function () {
                $('.date').datepicker('option', 'maxDate', new Date());
            }, 0);
        }

        function initializePageData() {
            pageHelper.setTitle('Stock Requisition Search');

            locationResourceProvider.getList().then(function (locations) {
                $scope.locations = locations;
            });

            locationResourceProvider.getList(true).then(function (warehouses) {
                $scope.warehouses = warehouses;
            });


            configureDatePicker();
        }
        function updateStatus() {
            if ($scope.statusId !== null) {
                var stat = $scope.statusOptions[$scope.statusId];
                $scope.query.status = stat;
            } else {
                $scope.query.status = null;
            }
        }

        function clear() {
            $scope.statusId = null;
            return {};
        }

        $scope.updateStatus = updateStatus;
        $scope.clear = clear;
        $scope.resolve = url.resolve;
        $scope.search = stockRequisitionRepo.search;

        initializePageData();
    };
});
