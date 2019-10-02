define([
    'angular',
    'underscore',
    'url'
],
function (angular, _, url) {
    'use strict';

    return function ($scope, $timeout, pageHelper, financialQueryRepo, locationResourceProvider) {
        $scope.dateFormat = pageHelper.dateFormat;

        function configureDatePicker() {
            $timeout(function () {
                $('.date').datepicker('option', 'maxDate', new Date());
            }, 0);
        }

        function initializePageData() {
            pageHelper.setTitle('Financial Query Report');

            locationResourceProvider.getList(false).then(function (locations) {
                $scope.locations = locations;
            });

            configureDatePicker();
        }
       
        $scope.resolve = url.resolve;
        $scope.search = financialQueryRepo.search;

        $scope.getExport = function() {
            url.open('/Financial/FinancialQueryReport/Export?' + $.param($scope.query));
        };

        $scope.print = function () {
            url.open('/Financial/FinancialQueryReport/Print?' + $.param($scope.query));
        };

        initializePageData();
    };
});
