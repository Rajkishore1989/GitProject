define([
        'angular',
        'underscore',
        'url'
    ],
    function(angular, _, url) {
        'use strict';

        return function($scope) {

            function generateUrl(movement) {

                var path = '';

                switch(movement.type) {
                    case 'GoodsReceipt':
                        path = 'Merchandising/GoodsReceipt/Detail/' + movement.id;
                        break;
                    case 'DirectGoodsReceipt':
                        path = 'Merchandising/GoodsReceiptDirect/Detail/' + movement.id;
                        break;
                    case 'VendorReturn':
                        path = 'Merchandising/VendorReturn' + (movement.isDirect ? 'Direct' : '') + '/Detail/' + movement.id;
                        break;
                    case 'Adjustment':
                        path = 'Merchandising/StockAdjustment/Detail/' + movement.id;
                        break;
                    case 'Transfer':
                        path = 'Merchandising/StockTransfer/Detail/' + movement.id;
                        break;
                }

                if (path.length > 0)
                    return url.resolve(path);

                return '';
            }

            $scope.generateUrl = generateUrl;
            $scope.resolve = url.resolve;
        };
    });
