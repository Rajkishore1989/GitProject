define([
    'angular',
    'underscore',
    'url'
],
function (angular, _, url) {
    'use strict';

    return function ($scope, $timeout, pageHelper, goodsOnLoanRepo, locationResourceProvider) {
        $scope.searching = false;
        $scope.dateFormat = pageHelper.dateFormat;

        function initializePageData() {
            pageHelper.setTitle('Goods on Loan Search');

            locationResourceProvider.getList().then(function (locations) {
                $scope.locations = locations;
            });

            $scope.statuses = {
                'In Progress': 'In Progress',
                'Awaiting Collection': 'Awaiting Collection',
                'Completed': 'Completed'
            };

            $scope.types = {
                'Business': 'Business',
                'Customer': 'Customer'
            };
        }
        
        $scope.resolve = url.resolve;
        $scope.search = goodsOnLoanRepo.search;

        initializePageData();
    };
});
