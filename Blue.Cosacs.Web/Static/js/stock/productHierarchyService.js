/* global define */
define(['underscore', 'angular', 'url'],
    function (_, angular, url) { 
        'use strict';
        var productHierarchySrv = function ($http, $q) {

            var productItem = {
                Level_1: '',
                Level_2: '',
                Level_3: '',
                edit: true,
                level_1_required: true,
                level_2_required: true,
                level_3_required: true,
                IsGroupFilter: true
            };
            var hierarchyCatalog = null;
            var categories = $q.defer();

            $http.get(url.resolve('/Stock/Catalogue/GetProductRelationsData')).then(function (result) {
                var cats = getAllCategories(productItem, result.data);
                var mappedCat = _.map(cats, function (cat) {
                    return {
                        k: cat.key,
                        v: cat.key + ' - ' + cat.name
                    };
                });

                categories.resolve(mappedCat);
            });

            function getAllCategories(productItem, data) {
                var departments = getDepartments(productItem, data);
                var categories = [];

                _.each(departments, function (department) {
                    if (department !== undefined && department !== null) {
                        var tmpCatgeories = getLevelData(department.children);

                        categories = categories.concat(tmpCatgeories);
                    }
                });

                return categories;
            }

            function getDepartments(productItem, data) {
                if (productItem.IsGroupFilter) {
                    if (_.isEmpty(productItem.productHierarchyDepartments)) {
                        if (data.tree !== undefined && data.tree !== null) {
                            productItem.productHierarchyDepartments = getLevelData(data.tree);
                        }
                    }
                    return productItem.productHierarchyDepartments;
                }
            }

            function getLevelData(node) {
                var prodHierarchyNode = node;
                return _.map(_.keys(prodHierarchyNode), function (key) {
                    var tmpHierarchy = prodHierarchyNode[key];
                    return {
                        key: key,
                        name: tmpHierarchy.name,
                        children: tmpHierarchy.children
                    };
                });
            }

            function buildHierarchyCatalog(node) {
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
            }

            return {
                Categories: categories.promise
            };
        };

        productHierarchySrv.$inject = ['$http', '$q'];

        return productHierarchySrv;

    });