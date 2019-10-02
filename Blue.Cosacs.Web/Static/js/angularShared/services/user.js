/*global define*/
define(['underscore'],
    function (_) {
        'use strict';

        return function () {
            var user = localStorage.GlaucousUser ? JSON.parse(localStorage.GlaucousUser) : {},
            permissions = user && user.permissions ? user.permissions : [];

            var merchandisingEnum = {
                2101: 'LocationView',
                2102: 'LocationEdit',
                2103: 'HierarchyView',
                2104: 'HierarchyEdit',
                2105: 'PeriodDataView',
                2106: 'PeriodDataEdit',
                2107: 'TagValuesView',
                2108: 'TagConditionValuesEdit',
                2109: 'TagFirstYearWarrantyEdit',
                2110: 'VendorView',
                2111: 'VendorEdit',
                2112: 'ViewStock',
                2113: 'RegularStockEdit',
                2114: 'RepossessedStockEdit',
                2115: 'ProductsWithoutStockEdit',
                2116: 'SparePartsEdit',
                2117: 'SetsView',
                2118: 'SetsEdit',
                2119: 'ComboView',
                2120: 'ComboEdit',
                2121: 'RepossessedConditionsView',
                2122: 'RepossessedConditionsEdit',
                2123: 'AssociatedProductsView',
                2124: 'AssociatedProductsEdit',
                2125: 'TaxRateView',
                2126: 'TaxRateEdit',
                2127: 'Ticketing',
                2128: 'PromotionView',
                2129: 'PromotionEdit',
                2130: 'CostPriceView',
                2131: 'CostPriceEdit',
                2132: 'RetailPriceView',
                2133: 'RetailPriceEdit',
                2134: 'PurchaseOrderView',
                2135: 'PurchaseOrderEdit',
                2136: 'GoodsReceiptView',
                2137: 'GoodsReceiptEdit',
                2138: 'UserView',
                2139: 'UserCanReceiveGoods',
                2140: 'GoodsReceiptApprove',
                2141: 'ProductEnquiry',
                2142: 'VendorReturnApprove',
                2143: 'GoodsReceiptVerify',
                2144: 'StockAdjustmentReasonsView',
                2145: 'StockAdjustmentReasonsEdit',
                2146: 'StockAdjustmentView',
                2147: 'StockAdjustmentEdit',
                2148: 'StockAdjustmentAuthorise',
                2149: 'StockCountView',
                2150: 'StockCountSchedule',
                2151: 'StockCountStart',
                2152: 'StockCountEdit',
                2153: 'StockCountClose',
                2154: 'CintErrorView',
                2155: 'IncotermView',
                2156: 'RunScheduledJobs',
                2157: 'TransactionTypeView',
                2158: 'TransactionTypeEdit',
                2159: 'StockTransferView',
                2160: 'StockTransferEdit',
                2161: 'StockRequisitionView',
                2162: 'StockRequisitionEdit',
                2163: 'StockAllocationView',
                2164: 'StockAllocationEdit',
                2165: 'GoodsOnLoanView',
                2166: 'GoodsOnLoanEdit'
            };

            return {
                hasPermission: function (name) {
                    var key = parseInt((_.invert(merchandisingEnum))[name], 10);
                    return _.contains(permissions, key);
                },
                branchNumber: user.BranchNumber ? user.BranchNumber : '',
                branchName: user.BranchName ? user.BranchName : ''
            };
        };
    });
