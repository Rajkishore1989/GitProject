define([
        'angular',
        'url'
    ],
    function(angular, url) {
        'use strict';

        return function($scope) {
            $scope.DownloadOrders = function() {
                var urlToFile = 'Merchandising/Export/ExportOrders';
                return url.open(urlToFile);
            };
            $scope.DownloadProducts = function () {
                var urlToFile = 'Merchandising/Export/ExportProducts';
                return url.open(urlToFile);
            };
            $scope.DownloadSets = function () {
                var urlToFile = 'Merchandising/Export/ExportSets';
                return url.open(urlToFile);
            };
            $scope.DownloadStockLevels = function () {
                var urlToFile = 'Merchandising/Export/ExportStockLevels';
                return url.open(urlToFile);
            };
            $scope.DownloadPromotions = function () {
                var urlToFile = 'Merchandising/Export/ExportPromotions';
                return url.open(urlToFile);
            };
            $scope.DownloadAssociatedProducts = function () {
                var urlToFile = 'Merchandising/Export/ExportAssociatedProducts';
                return url.open(urlToFile);
            };
        };
    });
