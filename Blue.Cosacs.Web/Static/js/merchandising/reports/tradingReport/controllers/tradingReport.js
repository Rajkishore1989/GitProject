define([
    'angular',
    'underscore',
    'url'
],
function (angular, _, url) {
    'use strict';

    return function ($scope, $timeout, pageHelper, repo) {
        $scope.run = function () {
            repo.get($scope.query)
                .then(function(reports) {
                    $scope.reports = reports;
                });
        };

        $scope.csv = function () {
            url.open('/Merchandising/TradingReport/csv');
        };

        $scope.print = function () {
            url.open('/Merchandising/TradingReport/Print');
        };

        function initializePage() {
            pageHelper.setTitle('Trading Report');
            $scope.run();
        }

        initializePage();
    };
});
