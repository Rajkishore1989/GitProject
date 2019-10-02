define([
    'angular',
    'underscore'
],
function (angular, _) {
    'use strict';

    return function ($scope, $location, pageHelper, reportHelper) {

        $scope.dateFormat = pageHelper.dateFormat;
        $scope.vm = {
            columns: [],
            query: {}
        };
      
        $scope.$watch('result', function (result) {
            
            $scope.vm.query.promotionIds = result.query.promotionIds || 'All';
            $scope.vm.query.locationId = result.query.locationId || 'Any';
            $scope.vm.query.fascia = result.query.fascia || 'Any';
            $scope.vm.query.locationName = result.query.locationName;

            if (result.query.promotions) {
                $scope.vm.query.promotions = result.query.promotions.join(', ');
            } else {
                $scope.vm.query.promotions = "None";
            }
           
            // Build columns
            reportHelper.initialiseColumns($scope.vm.columns, ['Location', 'Sku', 'Item Description', 'Quantity Sold', 'AWC', 'Promotion', 'Promotional Cash Price', 'Total Promo Cash Value', 'Promotional Margin', 'Total Promo Margin Value', 'Cash Price', 'Cash Margin']);

            //Restrict by cols passed in querystring
            reportHelper.restrict($scope.vm.columns, result.query);

            $scope.vm.pages = reportHelper.pages(result.results.page, 9, 11);
        });
    };
});
