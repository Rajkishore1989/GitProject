define([
    'angular'
],
function (angular) {
    'use strict';

    return function($scope, $timeout, $filter, $location, pageHelper, reportHelper) {
        $scope.dateFormat = pageHelper.dateFormat;
        $scope.vm = {
            columns: [],
            types: ['Units','Gross Margin','Net Sales']
        };

        $scope.$watch('result', function (result) {
            $scope.vm.query = result.query;
            $scope.vm.query.warehouse = result.query.warehouse || 'Any';
            $scope.vm.query.fascia = result.query.fascia || 'Any';
            $scope.vm.query.tagString = result.query.tagString || 'None';
            $scope.vm.query.hierarchyString = result.query.hierarchyString || 'None';

            // Build columns
            reportHelper.initialiseColumns($scope.vm.columns,[ result.levels, ['SKU', 'Description', 'Stock on Hand (Warehouse)', 'Locations Assigned', 'Location (Without Stock)', 'Date Last Received', 'Requisition Pending']]);
            
            //Restrict by cols passed in querystring
            reportHelper.restrict($scope.vm.columns, result.query);
           
            $scope.vm.pages = reportHelper.pages(result.products, 9, 14);
        });

        $scope.yesOrNo = function (m) {
            if (m) {
                return "Yes";
            } else {
                return "No";
            }
        };
    };
});
