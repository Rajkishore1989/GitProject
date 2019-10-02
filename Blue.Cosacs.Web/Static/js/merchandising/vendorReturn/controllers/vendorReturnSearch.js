define([
    'angular',
    'underscore',
    'url'
],
function (angular, _, url) {
    'use strict';

    return function ($scope, $timeout, $filter, $location, pageHelper, vendorReturnResourceProvider, locationResourceProvider, vendorResourceProvider, user, helpers) {
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

        $scope.typeOptions = {
            0: 'Standard',
            1: 'Direct'
        };

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
            
            updateTitle();
        });

        function configureDatePicker() {
            $timeout(function () {
                $('.date').datepicker('option', 'maxDate', new Date());
            }, 0);
        }

        function updateTitle() {
            pageHelper.setTitle('Vendor Return Search');
        }

        function generateUrl(link) {
            return url.resolve(link);
        }

        function initializePageData() {
            vendorResourceProvider.getList({ includeInactive: true }).then(function (vendors) {
                $scope.vendors = vendors;
            });

            vendorResourceProvider.get().then(function (vendors) {
                $scope.vendorsFull = vendors;
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
            if ($scope.searching) {
                return;
            }

            $scope.searching = true;

            vendorReturnResourceProvider
                .search(helpers.cleanse($scope.param), $scope.pageSize, $scope.pageIndex)
                .then(function (model) {
                    $scope.data = model;
                    $scope.searching = false;
                }, function (err) {
                    $scope.searching = false;
                    if (err && err.message) {
                        pageHelper.notification.showPersistent(err.message);
                    }
                });
        }

        function clear() {
            $scope.param = {
                vendorId: null,
                locationId: null,
                minVendorReturnId: null,
                maxVendorReturnId: null,
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

        $scope.newSearch = newSearch;
        $scope.clear = clear;
        $scope.canSearch = canSearch;
        $scope.generateUrl = generateUrl;
        $scope.selectPage = selectPage;
        $scope.updateType = updateType;

        clear();
        initializePageData();
    };
});
