define([
        'angular',
        'underscore',
        'url',
        'jquery',
        'lib/select2'
    ],
    function(angular, _, url, $) {
        'use strict';

        return function($scope, productResourceProvider,pageHelper) {

            var loaded = false,
                setHierarchyColumns = function() {
                    $scope.hierarchySelections =
                        _.map($scope.hierarchyOptions, function(value, key) {
                            var item = $scope.hierarchy[key];
                            if (typeof item === 'undefined') {
                                return "";
                            }
                            return item;
                        });
                };

            $scope.loadingResults = false;
            $scope.selectedText = '';
            $scope.selectedValue = {};
            $scope.hierarchySelections = [];


            $scope.productSearchSetup = function() {
                return {
                    placeholder: "Enter a product",
                    width: '100%',
                    minimumInputLength: 2,
                    ajax: {
                        url: url.resolve('Merchandising/AssociatedProducts/SelectSearch'),
                        dataType: 'json',
                        data: function(term) {
                            return {
                                q: term
                            };
                        },
                        results: function(response) {
                            return {
                                results: _.map(response.data, function(doc) {
                                    return {
                                        id: doc.sku,
                                        text: doc.longDescription,
                                        productId: doc.productId
                                    };
                                })
                            };
                        }
                    },
                    formatResult: function(data) {
                        return "<table class='WarrantyResults'><tr><td><b> " + data.id + " </b></td><td> : </td><td> " + data.text + "</td></tr></table>";
                    },
                    formatSelection: function(data) {
                        return data.id;
                    },
                    dropdownCssClass: "productResults",
                    escapeMarkup: function(m) {
                        return m;
                    }
                };
            };


            $scope.selectProduct = function(val) {
                $scope.selectedValue = val;
            };

            $scope.$watch('vm', function() {
                if (typeof $scope.vm !== 'undefined' && !loaded) {
                    loaded = true;
                    $scope.hierarchy = $scope.vm.hierarchy || emptyHierarchy();
                    $scope.hierarchyOptions = $scope.vm.hierarchyOptions || [];
                    setHierarchyColumns();
                }
            }, true);

            $scope.updateHierarchy = function(tag, level, hier) {
                $scope.hierarchy = hier;
            };

            function emptyHierarchy() {
                _.each($scope.hierarchyOptions, function (level) {
                    $scope.hierarchy[level.key] = "";
                });
            }

            $scope.associateProduct = function () {
                
                _.each($scope.hierarchyOptions, function (level) {
                    if (!$scope.hierarchy.hasOwnProperty(level.key)) {
                        $scope.hierarchy[level.key] = "";
                    }
                });

                productResourceProvider.associateProduct($scope.product.id, $scope.hierarchy).then(
                    function (value) {
                        $scope.vm.associatedProducts.push(value);
                        $scope.product = null;
                        emptyHierarchy();
                    },
                    function(result) {
                        pageHelper.notification.show(result.message);
                    });
            };

            $scope.remove = function (product) {
                productResourceProvider.deleteProductAssociation(product.id).then(
                    function() {
                        $scope.vm.associatedProducts = _.reject($scope.vm.associatedProducts, function(a) { return a.id === product.id; });
                    },
                    function(result) {
                        pageHelper.notification(result.message);
                    });
            };

            emptyHierarchy();

            $scope.resolve = url.resolve;
        };
    });

