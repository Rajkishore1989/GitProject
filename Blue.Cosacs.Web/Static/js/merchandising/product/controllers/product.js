define([
        'jquery',
        'angular',
        'underscore',
        'url',
        'notification',
        'lib/bootstrap/collapse',
        'lib/bootstrap/transition'
    ],
    function ($, angular, _, url, notification) {
        'use strict';

        var settingsSources = [
            'Blue.Cosacs.Merchandising.Fascia',
            'Blue.Cosacs.Merchandising.VendorCurrencies',
            'Blue.Cosacs.Merchandising.ProductTags',
            'Blue.Cosacs.Merchandising.StoreType'
        ];

        return function ($scope, $http, $q, $location, user, pageHelper, taxHelper, taggingResourceProvider, repossessedStockProvider, productResourceProvider, vendorResourceProvider, $anchorScroll) {
            var loaded = false;
            $scope.saving = false;

            pageHelper.getSettings(settingsSources, function (options) {
                $scope.options = options;
                $scope.$apply();
            });

            function updateProduct() {
                productResourceProvider.getProduct($scope.vm.product.id).then(function (result) {
                    $scope.vm.product = result.product;
                });
            }

            taggingResourceProvider.getSupplierTags().then(
                function (value) {
                    $scope.suppliers = _.map(value,
                        function (x) {
                            return {id: x.key, name: x.value};
                        });
                });

            $scope.exists = function () {
                return $scope.vm.product.id !== undefined && $scope.vm.product.id > 0;
            };

            $scope.updateVendor = function () {
                $scope.vm.product.primaryVendorId = parseInt($scope.vm.primaryVendorId, 10);
            };

            $scope.isNonActive = function () {
                return $scope.vm.product.status == 1;
            };

            $scope.isDeleted = function () {
                return $scope.vm.product.status == 5;
            };

            $scope.isAged = function () {
                return $scope.vm.product.status == 6;
            };

            $scope.validAgedStatuses = function () {
                return _.filter($scope.vm.statuses, function (status) {
                    return status.name.toLowerCase() === "deleted" || status.name.toLowerCase() === "aged";
                });
            };

            $scope.isEditable = function () {
                if ($scope.vm.product.productType !== undefined) {
                    var perm, allowed;

                    switch ($scope.vm.product.productType) {
                        case 'RegularStock':
                            perm = "RegularStockEdit";
                            break;
                        case 'ProductWithoutStock':
                            perm = "ProductsWithoutStockEdit";
                            break;
                        case 'SparePart':
                            perm = "SparePartsEdit";
                            break;
                        case 'RepossessedStock':
                            perm = "RepossessedStockEdit";
                            break;
                        default:
                            return false;
                    }

                    allowed = user.hasPermission(perm);

                    return allowed;
                }
                return true;
            };


            $scope.generateUrl = function (link) {
                return url.resolve(link);
            };

            $scope.createRepossessedCodes = function () {
                $scope.saving = true;
                repossessedStockProvider
                    .update($scope.vm.product.id)
                    .then(function (response) {
                            $scope.saving = false;
                            var skus = response;
                            if (skus.length > 0) {
                                skus = _.map(skus, function (sku) {

                                    var link = url.resolve("/merchandising/products/ref?sku=" + sku.toLowerCase());
                                    return '<a href="' + link +
                                        '">SKU#' +
                                        sku.toUpperCase() +
                                        '</a>';
                                });
                                notification.showPersistent('Repossessed stock ' +
                                    skus.join(', ') +
                                    ' have been created');
                            } else {
                                notification.show('Repossessed codes already exist for this product.');
                            }
                        },
                        function () {
                            $scope.saving = false;
                        });
            };

            $scope.$watch('partitionedAttributeData', function (val) {
                if (val !== undefined) {
                    $scope.vm.product.attributes = [].concat.apply([], val);
                }
            }, true); // deep watch

            $scope.$watch('partitionedFeatureData', function (val) {
                if (val !== undefined) {
                    $scope.vm.product.features = [].concat.apply([], val);
                }
            }, true); // deep watch

            $scope.validDeletedStatuses = function () {
                if ($scope.vm.product.costPrice !== null && $scope.vm.product.currentRetailPrice !== null && $scope.vm.product.suppliers.length > 0) {
                    return _.filter($scope.vm.statuses, function (status) {
                        return status.name.toLowerCase() !== "non active";
                    });
                }

                return _.filter($scope.vm.statuses, function (status) {
                    return status.name.toLowerCase() === "deleted";
                });
            };
            
            $scope.$watch('vm', function () {
                $scope.canEditTax = user.hasPermission('TaxRateEdit');
          
                if ($scope.vm.product !== null) {

                    if (!loaded) {
                        loaded = true;
                        $scope.productSaved = true;
                        $scope.partitionedAttributeData = pageHelper.partition($scope.vm.product.attributes, 2);
                        $scope.partitionedFeatureData = pageHelper.partition($scope.vm.product.features, 2);
                        $scope.selectedStoreTypes = $scope.vm.product.storeTypes || [];
                        $scope.selectedTags = $scope.vm.product.tags || [];
                        $scope.hierarchy = $scope.vm.product.hierarchy || [];
                        $scope.brands = $scope.vm.brands || [];
                        $scope.hierarchyOptions = $scope.vm.hierarchyOptions || [];
                        $scope.stockLevels = $scope.vm.product.stockLevel || [];
                        $scope.taxRates = $scope.vm.product.taxRates || [];

                        if ($scope.vm.product.primaryVendorId) {
                            $scope.vm.primaryVendorId = $scope.vm.product.primaryVendorId.toString();
                        }
                        $scope.selectedSuppliers = _.map($scope.vm.product.suppliers, function (x) {
                            return x.value;
                        });
                        $scope.validInactiveOptions = _.filter($scope.vm.statuses, function (status) {
                            return status.name.toLowerCase() == 'deleted' || status.name.toLowerCase() == "non active";
                        });

                        vendorResourceProvider.getList().then(function (vendors) {
                            $scope.vendors = vendors;
                        });

                        if (_.where($scope.vm.statuses, {'id': $scope.vm.product.status}).length < 1) {
                            $scope.vm.product.status = _.findWhere($scope.vm.statuses, {name: "Non Active"}).id;
                        }

                        if ($scope.vm.product.id === null) {
                            $('.productRequired').hide();
                        } else {
                            $('.productRequired').show();
                        }
                        var query = $location.$$url.split("="); // $routeparams not populated and anchorscroll not working shitty angular *hack*
                        if (query[query.length-1] === "CostPricing")
                        {
                            setTimeout(function () {
                                window.scrollTo(0, document.body.scrollHeight);
                            }, 25);
                        }

                    } else {
                        if ($scope.vm.product.id !== null) {
                            $('.productRequired').fadeIn();
                        }
                    }
                } else {
                    $scope.productSaved = false;
                }
            }, true);

            $scope.saveProduct = function () {

                
                if ($scope.vm.product !== null) {
                    $scope.saving = true;
                    productResourceProvider.create($scope.vm.product).then(function (result) {
                        pageHelper.notification.show('Product saved successfully.');
                        $scope.vm.product = result.product;
                        $scope.partitionedAttributeData = pageHelper.partition($scope.vm.product.attributes, 2);
                        $scope.partitionedFeatureData = pageHelper.partition($scope.vm.product.features, 2);
                        pageHelper.setTitle('Product ' + result.product.sku);
                        $location.path($scope.routes.route + '/' + result.product.id);
                        $scope.saving = false;
                    }, function (result) {
                        pageHelper.notification.showPersistent(result.message || "An error occured saving the product.");
                        $scope.saving = false;
                    });
                }
            };
            $scope.CovertProductTypeCodes = function () {
                debugger
                if ($scope.vm.product !== null) {
                    if ($scope.vm.product.productType !== undefined && $scope.vm.product.productType != 'RegularStock') {
                        pageHelper.notification.showPersistent("Product Should  be Regular Stock");
                        return;
                    }
                    if ($scope.vm.product.productType == 'RegularStock') {
                        $scope.vm.product.productType = 'ProductWithoutStock'
                        $scope.vm.product.previousProductType = 'RegularStock'
                    }
                   
                    $scope.saving = true;
                    
                    productResourceProvider.CovertProductTypeCodes($scope.vm.product).then(function (result) {
                        pageHelper.notification.show('Product saved successfully.');
                        $scope.vm.product = result.product;
                        $scope.partitionedAttributeData = pageHelper.partition($scope.vm.product.attributes, 2);
                        $scope.partitionedFeatureData = pageHelper.partition($scope.vm.product.features, 2);
                        pageHelper.setTitle('Product ' + result.product.sku);
                        $location.path($scope.routes.route + '/' + result.product.id);
                        $scope.saving = false;
                    }, function (result) {
                        pageHelper.notification.showPersistent(result.message || "An error occured saving the product.");
                        $scope.saving = false;
                    });
                }
            };

            $scope.addAttribute = function (attrDisplayName, type) {
                if (attrDisplayName && attrDisplayName.length > 0) {
                    var attrName = attrDisplayName.replace(/\W+/g, "");

                    if (attrName === '') {
                        pageHelper.notification.showPersistent('Attribute name must contain alphanumeric characters.');
                        return;
                    }

                    var matches;
                    if (type === 'attribute') {
                        matches = _.findWhere($scope.vm.product.attributes, {name: attrName});

                        if (matches) {
                            pageHelper.notification.showPersistent('Attribute already exists.');
                        } else {

                            $scope.vm.product.attributes.push({name: attrName, displayName: attrDisplayName});
                            $scope.partitionedAttributeData = pageHelper.partition($scope.vm.product.attributes, 2);
                            $scope.attributeName = "";
                        }
                    } else {
                        matches = _.findWhere($scope.vm.product.features, {name: attrName});

                        if (matches) {
                            pageHelper.notification.showPersistent('Feature already exists.');
                        } else {

                            $scope.vm.product.features.push({name: attrName, displayName: attrDisplayName});
                            $scope.partitionedFeatureData = pageHelper.partition($scope.vm.product.features, 2);
                            $scope.featureName = "";
                        }
                    }
                }
            };

            $scope.removeAttribute = function (attrName, type) {
                if (type === 'attribute') {
                    $scope.vm.product.attributes = _.filter($scope.vm.product.attributes, function (attr) {
                        return attr.name != attrName;
                    });
                    $scope.partitionedAttributeData = pageHelper.partition($scope.vm.product.attributes, 2);
                } else {
                    $scope.vm.product.features = _.filter($scope.vm.product.features, function (attr) {
                        return attr.name != attrName;
                    });
                    $scope.partitionedFeatureData = pageHelper.partition($scope.vm.product.features, 2);
                }
            };

            $scope.addSupplierTag = function (supplierId) {
                if ($scope.vm.product !== null) {
                    $scope.saving = true;
                    taggingResourceProvider
                        .addSupplierTag($scope.vm.product.id, supplierId)
                        .then(function () {
                            $scope.saving = false;
                            pageHelper.notification.show('Product vendor saved successfully.');
                        }, function () {
                            $scope.saving = false;
                        });
                }
            };

            $scope.removeSupplierTag = function (supplierId) {
                if ($scope.vm.product !== null) {
                    $scope.saving = true;
                    taggingResourceProvider.removeSupplierTag($scope.vm.product.id, supplierId).then(function () {
                        pageHelper.notification.show('Product vendor removed successfully.');
                        $scope.saving = false;
                    }, function () {
                        $scope.saving = false;
                    });
                }
            };

            $scope.saveStoreTags = function () {
                if ($scope.vm.product !== null) {
                    $scope.saving = true;
                    taggingResourceProvider.saveStoreTags($scope.vm.product.id, $scope.selectedStoreTypes).then(function () {
                        pageHelper.notification.show('Product store type saved successfully.');
                        $scope.saving = false;
                    }, function () {
                        $scope.saving = false;
                    });
                }
            };

            $scope.saveProductTags = function () {
                if ($scope.vm.product !== null) {
                    $scope.saving = true;
                    taggingResourceProvider.saveProductTags($scope.vm.product.id, $scope.selectedTags).then(function () {
                        pageHelper.notification.show('Product tag saved successfully.');
                        $scope.saving = false;
                    }, function () {
                        $scope.saving = false;
                    });
                }
            };

            $scope.saveHierarchySettings = function (tag, level) {
                if ($scope.vm.product !== null) {
                    $scope.saving = true;
                    taggingResourceProvider.saveHierarchySettings($scope.vm.product.id, level, tag).then(function () {
                        pageHelper.notification.show('Product hierarchy successfully updated.');
                        $scope.saving = false;
                    }, function () {
                        $scope.saving = false;
                    });
                }
            };
        };
    });
