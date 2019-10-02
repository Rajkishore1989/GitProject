/* global define */
define(['underscore', 'angular', 'url'],
    function (_, angular, url) { 
        'use strict';
        var levelKeys = null,
            getLevelData = function (node) {
                var prodHierarchyNode = node;
                return _.map(_.keys(prodHierarchyNode), function (key) {
                    var tmpHierarchy = prodHierarchyNode[key];
                    return {
                        key: key,
                        name: tmpHierarchy.name,
                        children: tmpHierarchy.children
                    };
                });
            },
            isProductLevelValid = function (level) {
                var retValue = false;
                if (level !== undefined && level !== null && level !== "") {
                    retValue = true;
                }
                return retValue;
            },
            hierarchyCatalog = null,
            buildHierarchyCatalog = function (node) {
                for (var key in node.children) {
                    if (node.children.hasOwnProperty(key)) {
                        var child = node.children[key];
                        child.key = key;
                        child.level = node.level + 1;
                        child.parent = node;
                        if (!_.isEmpty(child.children)) {
                            buildHierarchyCatalog(child);
                        }
                        if (child.level === 3) {
                            var o1 = node.parent,
                                o2 = node,
                                o3 = child,
                                entry = {
                                    k1: o1.key, k2: o2.key, k3: o3.key,
                                    parent: node
                                };
                            entry[_.keys(o1.parent.productHierarchyLevels)[0]] = o1.name;
                            entry[_.keys(o1.parent.productHierarchyLevels)[1]] = o2.name;
                            entry[_.keys(o1.parent.productHierarchyLevels)[2]] = o3.name;
                            if (!hierarchyCatalog) {
                                hierarchyCatalog = {};
                            }
                            hierarchyCatalog[entry.k1 + ',' + entry.k2 + ',' + entry.k3] = entry;
                        }
                    }
                }
                return hierarchyCatalog;
            },
            getHierarchyCatalog = function (dataTree, dataLevels) {
                if (!hierarchyCatalog) {
                    buildHierarchyCatalog({ level: 0, children: dataTree, productHierarchyLevels: dataLevels });
                }
                return hierarchyCatalog;
            },
            productHierarchyScope = null;

        return function ($scope, xhr) {
            $scope.productItem = {
                Level_1: '',
                Level_2: '',
                Level_3: '',
                edit: true,
                level_1_required: true,
                level_2_required: true,
                level_3_required: true,
                IsGroupFilter: true
            };
            if ($scope.select2Options === undefined) {
                $scope.select2Options = {
                    allowClear: true
                };
            }
            xhr.get(url.resolve('/Stock/Catalogue/GetProductRelationsData'))
                .success(function (data) {
                    levelKeys = _.keys(data.levels),
                        productHierarchyScope = {
                            levelKeys: _.keys(data.levels),
                            levels: data.levels,
                            productHierarchyTree: data.tree,
                            getHierarchyCatalogEntry: function (productObj) {
                                var k1 = '',
                                    k2 = '',
                                    k3 = '',
                                    entryType = 0,
                                    entry = {},
                                    catalog = getHierarchyCatalog(data.tree, data.levels);
                                if (productObj[levelKeys[0]] !== null && productObj[levelKeys[0]].length > 0) {
                                    k1 = productObj[levelKeys[0]];
                                    entryType = 1;
                                    if (productObj[levelKeys[1]] !== null && productObj[levelKeys[1]].length > 0) {
                                        k2 = productObj[levelKeys[1]];
                                        entryType = 2;

                                        if (productObj[levelKeys[2]] !== null && productObj[levelKeys[2]].length > 0) {
                                            k3 = productObj[levelKeys[2]];
                                            entryType = 3;
                                        }
                                    }
                                }

                                var tmpEntry;
                                if (entryType === 3) {
                                    entry = catalog[k1 + ',' + k2 + ',' + k3];
                                } else if (entryType === 2) {
                                    tmpEntry = _.find(catalog, function (tmpEntry) {
                                        return tmpEntry.k1 === k1 && tmpEntry.k2 === k2;
                                    });

                                    if (tmpEntry === undefined) {
                                        return null;
                                    }

                                    entry.k1 = tmpEntry.k1;
                                    entry.k2 = tmpEntry.k2;
                                    entry.parent = tmpEntry.parent;
                                    entry[levelKeys[0]] = tmpEntry[levelKeys[0]];
                                    entry[levelKeys[1]] = tmpEntry[levelKeys[1]];
                                } else if (entryType === 1) {
                                    tmpEntry = _.find(catalog, function (tmpEntry) {
                                        return tmpEntry.k1 === k1;
                                    });
                                    entry.k1 = tmpEntry.k1;
                                    entry.parent = tmpEntry.parent;
                                    entry[levelKeys[0]] = tmpEntry[levelKeys[0]];
                                }
                                return entry;
                            },
                            productDepartmentTemplate: url.resolve('static/js/stock/Templates/ProductDepartment.html'),
                            productCategoryTemplate: url.resolve('static/js/stock/Templates/ProductCategory.html'),
                            productCategoryMultipleTemplate: url.resolve('static/js/stock/Templates/ProductCategoryMultiple.html'),
                            productClassTemplate: url.resolve('static/js/stock/Templates/ProductClass.html'),
                            getL1: function (productItem) {
                                if (productItem.IsGroupFilter) {
                                    if (_.isEmpty(productItem.productHierarchyDepartments)) {
                                        if (data.tree !== undefined && data.tree !== null) {
                                            productItem.productHierarchyDepartments = getLevelData(data.tree);
                                        }
                                    }
                                    return productItem.productHierarchyDepartments;
                                }
                            },
                            getL2: function (productItem) {
                                if (productItem.IsGroupFilter) {
                                    if (_.isEmpty(productItem.productHierarchyCategories) && isProductLevelValid(productItem.Level_1)) {
                                        var tmpCategory = _.find(productItem.productHierarchyDepartments, function (cat) {
                                            return cat.key === productItem.Level_1;
                                        });
                                        if (tmpCategory !== undefined && tmpCategory !== null) {
                                            productItem.productHierarchyCategories = getLevelData(tmpCategory.children);
                                        }
                                    }
                                    return productItem.productHierarchyCategories;
                                }
                            },
                            getL3: function (productItem) {
                                if (productItem.IsGroupFilter) {
                                    if (_.isEmpty(productItem.productHierarchyClasses) && isProductLevelValid(productItem.Level_2)) {
                                        var tmpCategory = _.find(productItem.productHierarchyCategories, function (cat) {
                                            return cat.key === productItem.Level_2;
                                        });
                                        if (tmpCategory !== undefined && tmpCategory !== null) {
                                            productItem.productHierarchyClasses = getLevelData(tmpCategory.children);
                                        }
                                    }
                                    return productItem.productHierarchyClasses;
                                }
                            },
                            departmentChange: function (productItem) {
                                if (!productItem.Level_1) {
                                    productItem.productHierarchyCategories = [];
                                } else {
                                    productItem.productHierarchyCategories =
                                        getLevelData(data.tree[productItem.Level_1].children);
                                }
                            },
                            categoryChange: function (productItem) {
                                productItem.productHierarchyClasses = [];

                                if (productItem.Level_2) {
                                    var tmpCategory = _.find(productItem.productHierarchyCategories, function (cat) {
                                        return cat.key === productItem.Level_2;
                                    });
                                    if (tmpCategory && tmpCategory.children) {
                                        productItem.productHierarchyClasses = getLevelData(tmpCategory.children);
                                    }
                                }
                            }
                        };

                    $scope.productHierarchy = productHierarchyScope;
                });
        };
    });