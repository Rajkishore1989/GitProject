define([
    'angular',
    'underscore',
    'url'
],
function (angular, _, url) {
    'use strict';

    return function ($scope, $location, pageHelper, reportHelper) {
        $scope.pageSize = 15;
        $scope.dateFormat = pageHelper.dateFormat;
        $scope.vm = {
            searching: false,
            columns: [],
            types: ['Units', 'Gross Margin', 'Net Sales'],
            colIndices: ($location.search().c || '').split(',').map(Number)
        };

        $scope.shouldPage = function(locations, location) {
            return locations[locations.length - 1] !== location;
        };

        $scope.$watch('result', function (result) {

            // Get levels and generate grid columns
            $scope.vm.columns = reportHelper.initialiseColumns($scope.vm.columns, [result.levels, ['SKU', 'Description', 'Brand', 'Tags', 'Qty.', 'Sales Value', 'Net Sales Value', 'Contribution Percentage', 'Cumulative Sales Value', 'Cumulative Net Sales Value']]);

            //Restrict by cols passed in querystring
            reportHelper.restrict($scope.vm.columns, $scope.vm);

            $scope.vm.query = result.query;
            $scope.vm.query.fromDate = result.query.fromDate || 'Any';
            $scope.vm.query.toDate = result.query.toDate || 'Any';
            $scope.vm.query.location = result.query.location || 'Any';
            $scope.vm.query.fascia = result.query.fascia || 'Any';
            $scope.vm.query.groupByLocation = (result.query.groupByLocation ? 'Grouped by location' : 'No groupings');
            $scope.vm.query.performanceType = $scope.vm.types[result.query.performanceType-1];
            $scope.vm.query.tags = result.query.tags || 'None';
            $scope.vm.query.hierarchy = result.query.hierarchy || 'None';
            
            _.each(result.locations, function (location) {
                location.pages = reportHelper.pages(location.products, $scope.pageSize, $scope.pageSize);
            });
            $scope.vm.locations = result.locations;
        });
    };
});
