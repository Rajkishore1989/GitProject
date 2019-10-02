define(['url'],
    function (url) {
        'use strict';
        return function () {
            return {
                restrict: 'AE',
                replace: true,
                templateUrl: url.resolve('/Static/js/merchandising/goodsreceipt/templates/viewItems.html')
            };
        };
    });
 
