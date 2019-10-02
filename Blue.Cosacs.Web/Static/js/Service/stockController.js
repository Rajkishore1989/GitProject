/*global define*/
define(['angular', 'url', 'moment', 'alert', 'underscore', 'modal'],
    function (angular, url, moment, alert, _) {
        'use strict';

        var partIndex;
        var stockController = function ($scope, $http, $rootScope) {
            $scope.branches = [0];

            var searching = false;

            var disableSearch = $scope.disableSearch = function () {
                if (!$scope.searchStr || !$scope.searchStr.length || searching) {
                    $scope.disable = 'ui-icon-disabled';
                } else {
                    $scope.disable = 'click';
                }
            };

            var searchDisabled = function () {
                return !$scope.searchStr || !$scope.searchStr.length || $scope.disable === 'ui-icon-disabled';
            };


            var getStock = $scope.getStock = function (search, branch) {
                if (!searching && !searchDisabled()) {
                    searching = true;
                    disableSearch();
                    $http.get(url.resolve('/Service/Requests/StockItem') + '?search=' + search + '&branch=' + branch + '&type=' + $scope.type)
                        .success(function (data, status, headers, config) {
                            $scope.stockResult = data;
                            if (!data || data.length === 0) {
                                alert("There are no results found  for your search.", "No results found");
                            }
                            searching = false;
                            disableSearch();
                        }).error(function (data, status, headers, config) {
                            alert('Could not load stock data.', 'Load Failed');
                            searching = false;
                            disableSearch();
                        });
                }
            };

            $scope.disableBranch = function () {
                return _.keys($scope.branches).length === 1;
            };

            var isSearchStockValueValid = function (searchStockValue) {
                var returnVal = false;
                if (searchStockValue !== undefined && searchStockValue !== null && parseInt(searchStockValue, 10) > 0) {
                    returnVal = true;
                }
                return returnVal;
            };

            $scope.$on('searchItem', function (event, data, branches, branch, branchDefault) {
                $('#stock-modal').modal();
                $scope.type = "S";
                $scope.branches = branches;
                $scope.searchStr = data;
                $scope.stockResult = "";
                if (!isSearchStockValueValid($scope.searchStock)) {
                    $scope.searchStock = branchDefault;
                }

                if (data) {
                    getStock(data, branch);
                } else {
                    disableSearch();
                }
            });

            $scope.$on('searchPart', function (event, data, branches, branch, branchDefault) {                
                $('#stock-modal').modal();
                $("#itemNo").focus();
                $scope.type = "P";
                $scope.branches = branches;
                $scope.stockResult = "";
                partIndex = data;
                if (!isSearchStockValueValid($scope.searchStock)) {
                    $scope.searchStock = branchDefault;
                }
                disableSearch();
            });

            $scope.selectStock = function (data) {
                if ($scope.type === "S") {
                    $rootScope.$broadcast('stockResult', data);
                }
                if ($scope.type === "P") {
                    $rootScope.$broadcast('partResult', { index: partIndex, part: data });
                }
                $('#stock-modal').modal('hide');
            };
        };

        stockController.$inject = ['$scope', '$http', '$rootScope'];
        return stockController;
    });