define([
    'angular',
    'underscore',
    'url'
],
function (angular, _, url) {
    'use strict';

    return function ($scope, $timeout, pageHelper, stockTransferRepo, locationResourceProvider) {
        $scope.dateFormat = pageHelper.dateFormat;

        function configureDatePicker() {
            $timeout(function () {
                $('.date').datepicker('option', 'maxDate', new Date());
            }, 0);
        }

        function initializePageData() {
            pageHelper.setTitle('Stock Transfer Search');

            locationResourceProvider.getList().then(function (locations) {
                $scope.locations = locations;
            });

            $scope.types = ['Direct', 'Via'];

            configureDatePicker();
        }
        
        $scope.resolve = url.resolve;
        $scope.search = stockTransferRepo.search;

        initializePageData();
    };
});
