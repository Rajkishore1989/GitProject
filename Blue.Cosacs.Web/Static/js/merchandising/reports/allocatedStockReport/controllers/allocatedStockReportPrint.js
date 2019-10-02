define([
    'angular'
],
function (angular) {
    'use strict';

    return function ($scope, $location, pageHelper, reportHelper) {
        $scope.dateFormat = pageHelper.dateFormat;
        $scope.vm = {
            searching: false,
            columns: []
        };

        $scope.$watch('result', function (result) {
            $scope.vm.query = result.query;
            $scope.vm.query.locationName = result.query.locationName || 'Any';
            $scope.vm.query.fascia = result.query.fascia || 'Any';
            $scope.vm.query.sku = result.query.sku || 'Any';
            $scope.vm.query.tagList = ($scope.vm.query.tags ? $scope.vm.query.tags.join() : "Any");
             
            // Build columns
            reportHelper.initialiseColumns($scope.vm.columns, ['SKU', 'Description', 'Location', 'Stock On Hand Quantity', 'Stock On Hand Value', 'Stock Available Quantity', 'Stock Available Value', 'Stock Allocated Quantity', 'Stock Allocated Value', 'Reference Number', 'Date Allocated']);
            
            //Restrict by cols passed in querystring
            reportHelper.restrict($scope.vm.columns, result.query);

            $scope.vm.pages = reportHelper.pages(result.results, 1, 1);
        });
    };
});
