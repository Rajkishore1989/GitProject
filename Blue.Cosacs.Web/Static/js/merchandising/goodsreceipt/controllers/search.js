define([
        'angular',
        'underscore',
        'url',
        'moment',
        'spa',
        'confirm',
        'angularShared/app',
        'notification',
        'alert',
        'angularShared/loader',
        'angularShared/interceptor',
        'angular.ui',
        'underscore.string',
        'merchandising/app'
],
    function (angular, _, url, moment, spa, confirm, app, notification) {
        'use strict';

        return function ($scope) {
            $scope.datePickerSettings = {
                maxDate: "+10Y",
                minDate: "-10Y",
                dateFormat: "D, d MM, yy",
                changeMonth: true,
                changeYear: true
            };

            $scope.url = function (link) {
                return url.resolve(link);
            };

            var getReceiptIds = function (receipts) {

                return _.map(receipts, function(item) {
                    return { id: item.ReceiptId, type: item.ReceiptType };
                });
            };

            var batchPrintWithout = function(event, searchResults) {
                batchPrint(event, searchResults, false);
            };

            var batchPrintWith = function(event, searchResults) {
                batchPrint(event, searchResults, true);
            };

            var batchPrint = function (event, searchResults, includeCosts) {
                var ids = getReceiptIds(searchResults.results);

                
                if (ids.length === 0) {
                    return notification.show('Please select from the available filters for a Batch print', 'Batch Print');
                } else {
                    var message = '';
                    if (ids.length > 50) {
                        message = 'You are viewing <strong>' + ids.length + '</strong> results but can only print a maximum of <strong>50</strong> at one time.<br/><br/>';
                        ids = ids.splice(0, 50);
                    }

                    message += 'Are you sure you want to print <strong>' + ids.length + '</strong> Goods Receipts?';
                    return confirm(message, 'Batch Print', function(ok) {
                        if (ok) {

                            var goodsReceipts = _.where(ids, { type: 'Standard' });
                            var goodsReceiptIds = _.pluck(goodsReceipts, 'id');

                            var directReceipts = _.where(ids, { type: 'Direct' });
                            var directReceiptsIds = _.pluck(directReceipts, 'id');

                            return url.open("/Merchandising/GoodsReceipt/BatchPrint?goodsReceiptIds=" + goodsReceiptIds + '&directReceiptIds=' + directReceiptsIds + "&includeCosts=" + includeCosts);
                        }
                    });
                }
            };

            $scope.$on('facetsearch:action:batchprintwithcosts', batchPrintWith);
            $scope.$on('facetsearch:action:batchprintwithoutcosts', batchPrintWithout);
        };
    });

