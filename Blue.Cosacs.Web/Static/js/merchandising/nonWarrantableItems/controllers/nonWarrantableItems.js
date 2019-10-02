/* jshint ignore:start */
/*global moment*/
/*global define*/
define(['angular', 'jquery', 'underscore', 'url', 'moment'],
    function (angular, jquery, _, url, moment) {
        'use strict';

        return function ($scope, $timeout, pageHelper, NonWarrantableItemsResourceProvider) {

            $scope.newProduct = {
                productId: -1,
                sku: '123',
                longDescription: '123',
                warrantable: false
            };

            $scope.pageSize = 50;
            $scope.pageIndex = 1;
            $scope.recordCount = 0;
            $scope.pageCount = 0;

            $scope.addProduct = function () {
                $scope.newProduct.warrantable = false;
                NonWarrantableItemsResourceProvider.update($scope.newProduct)
                    .then(function(adj) {
                        $scope.saving = false;
                        pageHelper.notification.show("Item marked as Non-Warrantable successfully");
                    }, function(err) {
                        $scope.saving = false;
                        if (err && err.message) {
                            pageHelper.notification.showPersistent(err.message);
                        }
                    })
                    .then(function(reload) {
                        $scope.search();
                    });
            };

            $scope.deleteProduct = function (product) {
                product.warrantable = true;
                NonWarrantableItemsResourceProvider.update(product)
                    .then(function(adj) {
                        $scope.saving = false;
                        pageHelper.notification.show("Item marked as Warrantable successfully");
                    }, function(err) {
                        $scope.saving = false;
                        if (err && err.message) {
                            pageHelper.notification.showPersistent(err.message);
                        }
                    })
                    .then(function (reload) {
                        $scope.search();
                    });
            };

            $scope.search = function () {
                NonWarrantableItemsResourceProvider.search($scope.pageSize, $scope.pageIndex).then(function (response) {
                    $scope.nonWarrantableItems = response;
                    $scope.recordCount = response.recordCount;
                    $scope.pageCount = response.pageCount;
                });
            };

            function productSearchSetup() {
                return {
                    placeholder: "Enter a product",
                    width: '100%',
                    minimumInputLength: 2,
                    ajax: {
                        url: url.resolve('Merchandising/Products/SearchAllStockProducts'),
                        dataType: 'json',
                        data: function (term) {
                            return {
                                q: term,
                                rows: 10
                            };
                        },
                        results: function (result) {
                            return {
                                results:
                                    _.map(result.data, function (doc) {
                                        return {
                                            sku: doc.sku,
                                            description: doc.longDescription,
                                            id: doc.productId
                                        };
                                    })
                            };
                        }
                    },
                    formatResult: function (data) {
                        return "<table class='WarrantyResults'><tr><td><b> " + data.sku +
                               " </b></td><td> : </td><td> " + data.description + "</td></tr></table>";
                    },
                    formatSelection: function (data) {
                        return data.sku;
                    },
                    dropdownCssClass: "productResults",
                    escapeMarkup: function (m) {
                        return m;
                    }
                };
            }

            function processSearchResult(searchResult) {
                if (searchResult) {
                    $scope.newProduct.productId = searchResult.id;
                    $scope.newProduct.description = searchResult.description;
                    $scope.newProduct.sku = searchResult.sku;
                }
            }

            $scope.setPage = function (newPageIndex) {
                $scope.pageIndex = newPageIndex;
                $scope.search();
            };

            $scope.productSearchSetup = productSearchSetup;
            $scope.processSearchResult = processSearchResult;
            $scope.search();
        };
    });
/* jshint ignore:end */