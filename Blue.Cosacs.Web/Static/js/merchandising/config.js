define(['angular'],
    function (angular) {
        'use strict';

        return angular.module('merchandising.config', [])
            .value('refLinkConfig', [
                {
                    route: "/Merchandising/Products/ref?sku=",
                    signature: /sku#/,
                    ref: /\w+/
                }, {
                    route: "/Merchandising/Locations/ref?locationid=",
                    signature: /loc#/,
                    ref: /\w+/
                }, {
                    route: "/Merchandising/GoodsReceipt/Detail/",
                    signature: /grn#/,
                    ref: /[0-9]+/
                }, {
                    route: "/Merchandising/Purchase/Detail/",
                    signature: /po#/,
                    ref: /[0-9]+/
                }, {
                    route: "/Merchandising/GoodsReceiptDirect/Detail/",
                    signature: /grd#/,
                    ref: /[0-9]+/
                }, {
                    route: "/Merchandising/VendorReturn/Detail/",
                    signature: /vrn#/,
                    ref: /[0-9]+/
                },  {
                    route: "/Merchandising/VendorReturnDirect/Detail/",
                    signature: /vrd#/,
                    ref: /[0-9]+/
                }, {
                    route: "/Merchandising/Promotion/Detail/",
                    signature: /pro#/,
                    ref: /[0-9]+/
                }, {
                    route: "/Merchandising/Vendors/ref?code=",
                    signature: /vnd#/,
                    ref: /\w+/
                },
                {
                    route: "/Merchandising/StockCount/Detail/",
                    signature: /sc#/,
                    ref: /[0-9]+/
                },
                {
                    route: "/Merchandising/StockAdjustment/Detail/",
                    signature: /adj#/,
                    ref: /[0-9]+/
                },
                {
                    route: "/Merchandising/GoodsOnLoan/Detail/",
                    signature: /gol#/,
                    ref: /[0-9]+/
                },
                {
                    route: "/Merchandising/StockTransfer/Detail/",
                    signature: /st#/,
                    ref: /[0-9]+/
                },
                {
                    route: "/Warehouse/Bookings/detail/",
                    signature: /shp#/,
                    ref: /[0-9]+/
                }
            ]);
    });
