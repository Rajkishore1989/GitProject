define([
    'angular',
    'underscore',
    'url'
],
function (angular, _, url) {
    'use strict';

    return function ($scope, $location, pageHelper, reportHelper) {
        $scope.dateFormat = pageHelper.dateFormat;
        $scope.vm = {
            columns: []
        };
       
        $scope.gridTemplate = url.resolve('/static/js/merchandising/reports/stockValue/templates/stockValuePrint.html');
        $scope.$watch('result', function (result) {
           
            // Get levels and generate grid columns
            $scope.vm.columns = reportHelper.initialiseColumns($scope.vm.columns, ['Stock On Hand Qty.', 'Stock On Hand Value', 'Stock On Hand Sales Value']);

            //Restrict by cols passed in querystring
            reportHelper.restrict($scope.vm.columns, result.query);

            $scope.vm.results = result.results;
            $scope.vm.query = result.query;
            $scope.vm.query.location = result.query.location || 'Any';
            $scope.vm.query.fascia = result.query.fascia || 'Any';
            $scope.vm.query.isGrouped = (result.query.isGrouped ? 'Grouped by location' : 'No groupings');
            $scope.vm.query.tags = result.query.tags || 'None';
            $scope.vm.query.divisionName = result.query.divisionName || 'None';
            $scope.vm.query.departmentName = result.query.departmentName || 'None';
            $scope.vm.query.className = result.query.className || 'None';
        });

        $scope.isDisplayed = function(index) {
            return $scope.vm.columns[index] && $scope.vm.columns[index].selected === true ? "" : "none";
        };
    };
});
