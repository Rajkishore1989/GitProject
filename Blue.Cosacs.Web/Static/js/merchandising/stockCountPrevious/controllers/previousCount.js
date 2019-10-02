define([
    'angular',
    'underscore',
    'url'],

function (angular,_,url) {
    'use strict';

    return function ($scope, previousCountRepo) {
        $scope.$watch('stockCount', function (stockCount) {
            if (stockCount) {
                $scope.sku = stockCount.sku;
                $scope.description = stockCount.longDescription;
                $scope.defaultParams = function() { return { id: $scope.stockCount.id }; };
            }
        });

        $scope.$watch('paginator', function(paginator) {
            if (paginator) {
                paginator.get();
            }
        });

        $scope.resolve = url.resolve;
        $scope.search = previousCountRepo.search;
    };
});
