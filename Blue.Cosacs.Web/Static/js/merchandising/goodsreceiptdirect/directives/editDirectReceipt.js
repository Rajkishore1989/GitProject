define(["url"],
    function (url) {
        "use strict";
        return function (user) {
            return {
                restrict: "AE",
                replace: true,
                templateUrl: url.resolve("/Static/js/merchandising/goodsreceiptdirect/templates/editDirectReceipt.html"),
                link: function (scope) {}
            };
        };
    });
 
