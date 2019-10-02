define(["url"],
    function (url) {
        "use strict";
        return function (user) {
            return {
                restrict: "AE",
                replace: true,
                templateUrl: url.resolve("/Static/js/merchandising/goodsreceipt/templates/editGoodsReceipt.html"),
                link: function (scope) {}
            };
        };
    });
 
