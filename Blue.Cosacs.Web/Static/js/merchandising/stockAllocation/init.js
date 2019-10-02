define([
        'angular',
        'angularShared/app',
        'merchandising/app',
        'merchandising/stockAllocation/controllers/stockAllocation',
        'merchandising/stockAllocation/controllers/allocationProduct',
        'merchandising/stockAllocation/controllers/stockAllocationSearch',
        'merchandising/stockAllocation/services/stockAllocationResourceProvider'
],
    function (angular, cosacs, merchandising, stockAllocationCtrl, allocationCtrl, searchCtrl, stockAllocationRepo) {
        'use strict';

        return {
            init: function ($el) {
                cosacs();
                angular.module('merchandising')
                    .service('stockAllocationResourceProvider', ['$q', '$resource', 'apiResourceHelper', 'pageHelper', stockAllocationRepo])
                    .controller('StockAllocationCtrl', ['$scope', '$location', 'pageHelper', 'user', 'stockAllocationResourceProvider', 'locationResourceProvider', stockAllocationCtrl])
                    .controller('AllocationProductCtrl', ['$scope', allocationCtrl])
                    .controller('StockAllocationSearchCtrl', ['$scope', '$timeout', 'pageHelper', 'stockAllocationResourceProvider', 'locationResourceProvider', searchCtrl]);
                
                return angular.bootstrap($el, ['myApp', 'merchandising']);
            }
        };
    });