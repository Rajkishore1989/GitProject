define([
    'angular',
    'underscore'
],
function (angular, _) {
    'use strict';

    return function ($scope, $timeout, $filter, $location, pageHelper, reportHelper) {
        $scope.dateFormat = pageHelper.dateFormat;
        $scope.rh = reportHelper;
        $scope.vm = {
            query: {},
            columns: []
        };

        $scope.$watch('result', function (result) {
            $scope.vm.query = result.query;
            $scope.vm.query.kpi = result.query.kpi;
            $scope.vm.query.location = result.query.location || 'Any';
            $scope.vm.query.fascia = result.query.fascia || 'Any';
            $scope.vm.query.productType = result.query.productType || 'Any';

            if (!$.isEmptyObject($scope.vm.query.hierarchy)) {
                $scope.vm.query.hierarchyString = _.map(result.query.hierarchy, function (value, key) {
                    return value;
                }).join(", ");
            } else {
                $scope.vm.query.hierarchyString = "None";
            }

            // Build columns
            reportHelper.initialiseColumns($scope.vm.columns, ['Sku', 'Description', 'Brand', 'Vendor', 'Stock On Order', 'Stock On Hand', 'Average Weighted Cost', 'Stock On Hand Cost', 'Cash Price', 'Year', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March', 'Year to Date']);
            
            //Restrict by cols passed in querystring
            reportHelper.restrict($scope.vm.columns, result.query);
            $scope.vm.pages = reportHelper.pages(result.products, 10, 15);
        });

        $scope.yesOrNo = function (m) {
            if (m) {
                return "Yes";
            } else {
                return "No";
            }
        };

        $scope.vm.utils = {
            chooseFilter: function () {
                var result;
                switch ($scope.vm.query.kpi) {
                    case "Sales Value":
                        result = "Currency";
                        break;
                    case "Margin Value":
                        result = "Currency";
                        break;
                    case "Sales Volume":
                        result = "";
                        break;
                    default:
                        result = "Percentage";
                }
                return result;
            }
        };
    };
});
