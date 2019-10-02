define(['angular', 'jquery', 'url', 'underscore', 'lib/select2'],
function (angular, $, url, _) {
    'use strict';
    return function () {
        return {
            restrict: 'E',
            scope: {
                model: '=',             // Required: The selected item.
                resultProcessor: '=',   // Required: A function that takes the selected item for further processing.
                endpoint: '=',          // Optional: The url of the search service. Defaults to 'Merchandising/Products/SearchStockProducts'.
                placeholder: '=',       // Optional: The placeholder text for the dropdown. Defaults to 'Enter a product'.
                isDisabled: '=',        // Optional: Dictates when the control will appear to be disabled.
                params: '=',            // Optional: A function that returns an object holding parameters to be sent to the search service.
                mapper: '=',            // Optional: A function that can extend the basic mapping functionality. Default in "mapResult" maps sku, description, id, productId and AWC.
                resultFormatter: '=',   // Optional: A function that takes row item data and returns a string to be displayed for each row in the dropdown.
                resultKeyFormatter: '=',// Optional: A function that takes row item data and returns the value to be associated with that row.
                useDefaultMapper: '@'   // Optional: Causes the default product mapper to be used. Defaults to true. If another mapper is defined, it will be used after the default mapper.
            },
            templateUrl: url.resolve('/Static/js/merchandising/shared/templates/search-dropdown.html'),
            controller: ['$scope', function ($scope) {
                
                function mapResult(doc) {

                    var model;
                    if (typeof $scope.useDefaultMapper === 'undefined' || $scope.useDefaultMapper === true) {
                        model = {
                            sku: doc.sku,
                            description: doc.longDescription,
                            id: doc.productId,
                            productId: doc.productId,
                            averageWeightedCost: doc.averageWeightedCost
                        };
                    } else {
                        model = {};
                    }

                    if ($scope.mapper) {
                        return $scope.mapper(doc, model);
                    }

                    return model;
                }

                $scope.searchSetup = {
                    placeholder: $scope.placeholder || "Enter a product",
                    width: '100%',
                    minimumInputLength: 2,
                    ajax: {
                        url: url.resolve($scope.endpoint || 'Merchandising/Products/SearchStockProducts'),
                        dataType: 'json',
                        data: function (term) {
                            var prms = $scope.params ? $scope.params() : {};
                            prms.q = term;
                            if (!prms.rows) {
                                prms.rows = 10;
                            }
                            return prms;
                        },
                        results: function(result) {
                            return {
                                results: _.map(result.data, function(resultItem) {
                                    return mapResult(resultItem);
                                })
                            };
                        }
                    },
                    formatResult: function (data) {
                        if ($scope.resultFormatter) {
                            return $scope.resultFormatter(data);
                        }
                        return "<table><tr><td><b> " + data.sku + " </b></td><td> : </td><td> " + data.description + "</td></tr></table>";
                    },
                    formatSelection: function (data) {
                        if ($scope.resultKeyFormatter) {
                            return $scope.resultKeyFormatter(data);
                        }
                        return data.sku;
                    },
                    dropdownCssClass: "productResults",
                    escapeMarkup: function(m) {
                        return m;
                    }
                };
            }]
        };
    };
});