/*global define*/
/* jshint ignore:start */
define(['moment', 'underscore', 'angular', 'angularShared/app', 'notification', 'url', 'lookup',
        'merchandising/shared/directives/hierarchy', 'merchandising/shared/services/helpers',
        'merchandising/shared/services/pageHelper', 'merchandising/shared/services/apiResourceHelper',
    'lib/select2', 'angular.ui'],
    function (moment, _, angular, app, notification, url, lookup, hierarchyDirective, helpers, pageHelper, apiResourceHelper) {
        'use strict';
        return {
            init: function ($el) {
                var linkCtrl = function ($scope, $location, $rootScope, $filter, xhr, $dialog, $anchorScroll, lookup) {

                    var newProductTemplate = {};
                    $scope.warrantyLevels = [];
                    var newWarrantyTemplate;

                    $scope.hierarchyOptions = [];
                    $scope.hierarchy = {};

                    $scope.hasViewLinkPermission = $el.data('viewLinkPermission') === 'True';
                    $scope.hasEditLinkPermission = $el.data('editLinkPermission') === 'True';
                    $scope.product = {};
                    $scope.product.fields = {};
                    $scope.newWarranty = {
                        WarrantyId: null,
                        Min: null,
                        Max: null
                    };
                    $scope.filter = $location.search();
                    $scope.filter.PageSize = $scope.filter.PageSize || 10;

                    if ($scope.filter.EffectiveStartFrom) {
                        $scope.filter.EffectiveStartFrom = moment($scope.filter.EffectiveStartFrom).toDate();
                    }
                    if ($scope.filter.EffectiveStartTo) {
                        $scope.filter.EffectiveStartTo = moment($scope.filter.EffectiveStartTo).toDate();
                    }


                    lookup.populate('BRANCH').then(function (data) {
                        $scope.product.branches = lookup.wrapList(data);
                    });

                    lookup.populate('fascia').then(function (data) {
                        $scope.product.branchTypes = lookup.wrapList(data);
                    });

                    $scope.datePicker = {
                        dateFormat: "D, d MM, yy",
                        changeMonth: true,
                        changeYear: true
                    };
                    $scope.newProduct = {
                        hierarchy: {
                            Division: null,
                            Department: null,
                            Class: null
                        }
                    };

                    $scope.selectPage = function (page) {
                        $scope.filter.PageIndex = page;
                        $scope.search();
                    };

                    function isFloatValue(value) {
                        return !isNaN(parseFloat(value));
                    }

                    $scope.linkDatePicker = {
                        defaultDate: "+1",
                        minDate: "+1",
                        dateFormat: "DD, d MM, yy",
                        changeMonth: true,
                        changeYear: true
                    };

                    function clone(object) {
                        return JSON.parse(JSON.stringify(object));
                    }

                    newWarrantyTemplate = clone($scope.newWarranty);

                    $scope.isWarrantyLimitInvalid = function () {
                        if (!isFloatValue($scope.newWarranty.Min)) {
                            return true;
                        }

                        if (!isFloatValue($scope.newWarranty.Max)) {
                            return true;
                        }
                        var min = parseFloat($scope.newWarranty.Min);
                        var max = parseFloat($scope.newWarranty.Max);

                        if (min >= max) {
                            return true;
                        }

                        return max === 0;
                    };

                    var checkNewWarranty = function (returnMessage) {

                        if (returnMessage === null) {
                            returnMessage = {
                                message: ''
                            };
                        }
                        returnMessage.message = '';

                        if ($scope.newWarranty.WarrantyId === null) {
                            return false;
                        }

                        if (!isFloatValue($scope.newWarranty.Min)) {
                            returnMessage.message = 'Warranty Min is invalid';
                            return false;
                        }

                        if (!isFloatValue($scope.newWarranty.Max)) {
                            returnMessage.message = 'Warranty Max is invalid';
                            return false;
                        }

                        if ($scope.isWarrantyLimitInvalid()) {
                            returnMessage.message = 'Warranty Max have to be greater than Warranty Min';
                            return false;
                        }

                        return true;
                    };

                    $scope.validateNewWarranty = function (warrantyLevel) {
                        var warrantyId = $scope.newWarranty.WarrantyId.id || 0;
                        var effectiveDate = warrantyLevel.effectiveDate ? warrantyLevel.effectiveDate.toISOString() : null;

                        var inData = {
                            warrantyId: warrantyId,
                            warrantyLink: {
                                Id: warrantyLevel.Id,
                                Name: warrantyLevel.Name,
                                EffectiveDate: effectiveDate,
                                products: listItem(warrantyLevel.products, false),
                                warranties: listItem(warrantyLevel.warranties, false)
                            }
                        };

                        xhr.post(
                                url.resolve('/Warranty/Link/ValidateNewLinkWarranty'), inData
                            )
                            .success(function (data) {

                                if (data && data.isValid === true) {
                                    $scope.warrantyAdd(warrantyLevel);
                                }
                                else {
                                    notification.show(data.msg);
                                    return false;
                                }

                            });

                    };

                    $scope.checkNewWarrantyEmpty = function () {
                        return $scope.newWarranty.WarrantyId !== null && $scope.newWarranty.Min !== null && $scope.newWarranty.Max !== null;
                    };

                    $scope.select2Options = {
                        allowClear: true
                    };

                    $scope.productRemove = function (index, warrantyLevel) {
                        warrantyLevel.products.splice(index, 1);
                        //$scope.matchProducts(warrantyLevel);
                    };

                    $scope.setupProducts = function (key) {
                        return {
                            allowClear: true,
                            data: _.map($scope.product.fields[key], function (field) {
                                return {
                                    id: field,
                                    text: field,
                                    type: key
                                };
                            })
                        };
                    };

                    var notDefinedTxt = 'ALL',
                        listItem = function (warrantyOrProductArray, forSolrSearch) {
                            var linkItems = [];
                            _.each(warrantyOrProductArray, function (warrantyOrProductItem) {
                                linkItems.push(JSON.parse(JSON.stringify(warrantyOrProductItem)));
                            });

                            _.each(linkItems, function (linkItem) {
                                for (var prop in linkItem) {
                                    if (linkItem.hasOwnProperty(prop)) {
                                        if (linkItem[prop] && linkItem[prop].text) {
                                            if (prop === 'StockBranchNameWarrantyLink' || prop === 'WarrantyId') {
                                                linkItem[prop] = forSolrSearch ? linkItem[prop].text : linkItem[prop].id;
                                            }
                                            else if (prop === 'StoreType') {
                                                linkItem[prop] = linkItem[prop].id;
                                            } else {
                                                linkItem[prop] = linkItem[prop].text;
                                            }
                                        }
                                    }
                                }

                                if (linkItem.Levels) {
                                    for (var key in linkItem.Levels) {
                                        if (linkItem.Levels.hasOwnProperty(key)) {
                                            if (linkItem.Levels[key] && linkItem.Levels[key].text) {
                                                var tmpTxtVal = linkItem.Levels[key].id;
                                                if (tmpTxtVal !== notDefinedTxt) {
                                                    linkItem[key] = tmpTxtVal;
                                                }
                                            }
                                        }
                                    }
                                    delete linkItem.Levels;
                                }
                            });

                            return linkItems;
                        };

                    $scope.editing = function () {
                        return _.find($scope.warrantyLevels, function (warranty) {
                            return warranty.edit === true;
                        });
                    };

                    $scope.save = function (warrantyLevel) {
                        if (warrantyLevel.products.length > 0 && warrantyLevel.warranties.length > 0 && warrantyLevel.Name.length > 0) {
                            var tomorrowDate = moment(+(new Date())).add('days', 1).toDate();
                            var effectiveDateNotUpToDate = tomorrowDate.valueOf() > (+warrantyLevel.effectiveDate);
                            // Always update warranty effective date if user saves a warranty link
                            warrantyLevel.effectiveDate = effectiveDateNotUpToDate ? tomorrowDate : warrantyLevel.effectiveDate;
                            xhr.post(url.resolve('/Warranty/Link'), {
                                Id: warrantyLevel.Id,
                                Name: warrantyLevel.Name,
                                EffectiveDate: warrantyLevel.effectiveDate.toISOString(),
                                products: listItem(warrantyLevel.products, false),
                                warranties: listItem(warrantyLevel.warranties, false)
                            })
                                .success(function (data) {
                                    if (data && data.id > 0) {
                                        warrantyLevel.Id = data.id;
                                        notification.show('Warranty Product link saved');
                                        warrantyLevel.edit = false;
                                    } else {
                                        notification.show(data.msg);
                                    }

                                });
                        }
                    };

                    $scope.deleteLink = function (index, warrantyLevel) {
                        if (warrantyLevel.Id && !warrantyLevel.edit) {
                            var deleteConfirmation = $dialog.messageBox('Confirm Delete',
                                'You have chosen to delete the WarrantyLink "' + warrantyLevel.Name +
                                    '". Are you sure you want to delete?', [
                                    {
                                        label: 'Delete',
                                        result: 'yes',
                                        cssClass: 'btn-primary'
                                    },
                                    {
                                        label: 'Cancel',
                                        result: 'no'
                                    }
                                ]);
                            deleteConfirmation.open().then(function (result) {
                                if (result === 'yes') {
                                    xhr({
                                        method: 'DELETE',
                                        url: url.resolve('/Warranty/Link/') + warrantyLevel.Id,
                                        data: warrantyLevel.Id
                                    })
                                        .success(function () {
                                            $scope.warrantyLevels.splice(index, 1);
                                            notification.show('Warranty Product link deleted');
                                        });
                                }
                            });
                        }
                    };

                    $scope.stopEdit = function (index, warrantyLevel) {
                        if (warrantyLevel.Id) {
                            getWarrantyLevel(warrantyLevel.Id, warrantyLevel);
                        } else {
                            $scope.warrantyLevels.splice(index, 1);
                        }
                    };

                    var mapWarrantyLevels = function (warrantyLevels) {
                        _.each(warrantyLevels, function (warrantyLevel) {
                            warrantyLevel.effectiveDate = new Date(parseInt(warrantyLevel.EffectiveDate.substr(6), 10));

                            _.map(warrantyLevel.products, function(current){
                                current.hierarchy = createRecordHierarchy(current);

                                return current;
                            });
                        });

                        return warrantyLevels;
                    };

                    $scope.search = function () {
                        xhr({
                            method: 'POST',
                            url: url.resolve('/Warranty/Link/GetAll'),
                            data: this.filter
                        }).success(function (data) {
                            if (data) {
                                $scope.warrantyLevels = mapWarrantyLevels(data.Page);
                                _.extend($scope.filter, {
                                    PageCount: data.PageCount,
                                    PageIndex: data.PageIndex,
                                    RecordCount: data.RecordCount
                                });
                            }
                            setup();
                        });
                    };

                    $scope.clearFilter = function () {
                        $scope.filter = _.omit($scope.filter, 'Name', 'EffectiveStartFrom', 'EffectiveStartTo');
                        $scope.search();
                    };

                    $scope.search();

                    var getWarrantyLevel = function (id, warrantyLevel) {
                        xhr.get(url.resolve('/Warranty/Link/GetLink/') + id)
                            .success(function (data) {
                                if (data) {
                                    var newWarrantyLevel = mapWarrantyLevels([data])[0];
                                    var index = _.indexOf($scope.warrantyLevels, warrantyLevel);
                                    if (index !== -1) {
                                        //$scope.warrantyLevels.splice(index, 1);
                                        populateWarrantyProductData(newWarrantyLevel);
                                        //$scope.warrantyLevels.push(newWarrantyLevel);
                                        $scope.warrantyLevels[index] = newWarrantyLevel;
                                    }
                                }
                            });
                    };

                    var discardNewWarranty = function (warrantyLevel) {
                        var index = _.indexOf($scope.warrantyLevels, warrantyLevel);
                        if (index !== -1) {
                            $scope.warrantyLevels.splice(index, 1);
                        }
                    };

                    var checkEdit = function (warrantyLevel) {
                        var link = _.find($scope.warrantyLevels, function (level) {
                            return level.edit === true;
                        });
                        if (link) {
                            var name = _.isUndefined(link.Name) ? 'New Link' : link.Name;
                            var deleteConfirmation = $dialog.messageBox('Discard Edit', 'You are currently editing another warranty link "' + name + '". Do you want to discard your pending changes?', [
                                {
                                    label: 'Discard',
                                    result: 'yes'
                                },
                                {
                                    label: 'Cancel',
                                    result: 'no'
                                }
                            ]);
                            deleteConfirmation.open().then(function (result) {
                                if (result === 'yes') {
                                    link.edit = false;
                                    if (link.products.length === 0 && link.warranties.length === 0) {
                                        $scope.warrantyLevels.splice($scope.warrantyLevels.length - 1, 1);
                                    }
                                    if (link.Id) {
                                        getWarrantyLevel(link.Id, link);
                                    }
                                    else {
                                        discardNewWarranty(link);
                                    }

                                    return true;
                                } else {
                                    return false;
                                }
                            });
                        }
                        else {
                            warrantyLevel.edit = true;

                            return true;
                        }
                    };

                    $scope.checkEdit = checkEdit;

                    $scope.warrantyLevelAdd = function () {
                        var warrantyLevel = {
                            Id: null,
                            Name: "",
                            effectiveDate: null,
                            products: [],
                            edit: true,
                            warranties: []
                        };
                        if (checkEdit(warrantyLevel)) {
                            $scope.warrantyLevels = [warrantyLevel].concat($scope.warrantyLevels);
                            //$scope.warrantyLevels.push(warrantyLevel);
                        }
                    };

                    $scope.warrantyHref = function (warrantyId) {
                        return url.resolve('/Warranty/Warranties/' + warrantyId);
                    };

                    var populateWarrantyData = function (warrantyLevel) {
                        _.each(warrantyLevel.warranties, function (warranty) {
                            if (warranty.WarrantyId) {
                                warranty.WarrantyId = {
                                    id: warranty.WarrantyId,
                                    text: warranty.WarrantyName + " : " + warranty.WarrantyDescription,
                                    name: warranty.WarrantyName
                                };
                            }
                        });
                    };

                    var populateWarrantyProductData = function (warrantyLevel) {
                        _.each(warrantyLevel.products, function (product) {
                            if (product.StockBranchNameWarrantyLink) {
                                product.StockBranchNameWarrantyLink = _.find($scope.product.branches.data, function (branch) {
                                    return parseInt(branch.id, 10) === product.StockBranchNameWarrantyLink;
                                });
                            }
                            if (product.StoreType) {
                                product.StoreType = _.find($scope.product.branchTypes.data, function (branchType) {
                                    return branchType.id === product.StoreType;
                                });
                            }
                        });

                        populateWarrantyData(warrantyLevel);
                    };

                    function setup() {
                        $location.hash('search');
                        $anchorScroll();

                        _.each($scope.warrantyLevels, populateWarrantyProductData);
                    }

                    $scope.warrantyAdd = function (warrantyLevel) {
                        var msg = {
                            message: ''
                        };
                        if (!$scope.checkNewWarrantyEmpty()) {
                            return false;
                        }

                        if (checkNewWarranty(msg)) {
                            warrantyLevel.warranties.push({
                                WarrantyId: $scope.newWarranty.WarrantyId,
                                Min: $scope.newWarranty.Min,
                                Max: $scope.newWarranty.Max
                            });
                            $scope.newWarranty = clone(newWarrantyTemplate);
                            warrantyLevel.addWarranty = false;
                        }
                        else {
                            notification.show(msg.message);
                        }
                    };

                    $scope.cancelNewWarranty = function (warrantyLevel) {
                        $scope.newWarranty = clone(newWarrantyTemplate);
                        warrantyLevel.addWarranty = false;
                    };

                    $scope.warrantyRemove = function (hashKey, warrantyLevel) {
                        var itemIndex = _.indexOf(warrantyLevel.warranties, _.where(warrantyLevel.warranties, { $$hashKey: hashKey })[0]);
                        warrantyLevel.warranties.splice(itemIndex, 1);
                    };

                    $scope.productAdd = function (warrantyLevel) {
                        var newValue = {
                            StockBranchNameWarrantyLink: $scope.newProduct.StockBranchNameWarrantyLink,
                            StoreType: $scope.newProduct.StoreType,
                            RefCodeWarrantyLink: $scope.newProduct.RefCodeWarrantyLink,
                            ItemNoWarrantyLink: $scope.newProduct.ItemNoWarrantyLink,
                            Level_1: $scope.newProduct.Level_1,
                            Level_2: $scope.newProduct.Level_2,
                            Level_3: $scope.newProduct.Level_3
                        };
                        newValue.hierarchy = createRecordHierarchy(newValue);

                        warrantyLevel.products.push(newValue);

                        $scope.newProduct = {
                            hierarchy: {
                                Division: null,
                                Department: null,
                                Class: null
                            }
                        };

                        warrantyLevel.addProduct = false;
                    };

                    $scope.cancelNewProduct = function (warrantyLevel) {
                        $scope.newProduct = clone(newProductTemplate);
                        warrantyLevel.addProduct = false;
                    };

                    $scope.warrantySearchSetup = function () {
                        return {
                            allowClear: true,
                            placeholder: "Search for a warranty",
                            minimumInputLength: 2,
                            ajax: {
                                url: url.resolve('warranty/warrantyAPI/SelectSearch'),
                                dataType: 'json',
                                data: function (term) {
                                    return {
                                        q: term,
                                        rows: 10
                                    };
                                },
                                results: function (data) {
                                    return {
                                        results: _.map(data.response.docs, function (doc) {
                                            return {
                                                id: doc.WarrantyId,
                                                text: doc.WarrantyNumber + " : " + doc.ItemDescription
                                            };
                                        })
                                    };
                                }
                            },
                            formatResult: function (data) {
                                return '<table class="warrantyResults"><tr><td>' + data.text + '</td></tr></table>';
                            },
                            formatSelection: function (data) {
                                return data.text;
                            },
                            dropdownCssClass: "warrantyResults",
                            escapeMarkup: function (m) {
                                return m;
                            }
                        };
                    };

                    $scope.saveHierarchySettings = function (tag, level, warrantyLink) {
                        switch (level){
                            case 'Division':
                                warrantyLink.Level_1 = getHierarchyId('Division', tag);
                                break;

                            case 'Department':
                                warrantyLink.Level_2 = getHierarchyId('Department', tag);
                                break;

                            case 'Class':
                                warrantyLink.Level_3 = getHierarchyId('Class', tag);
                                break;
                        }
                    };

                    function loadHierarchy() {
                        xhr.get(url.resolve('Merchandising/Hierarchy/Get'))
                            .success(function (response) {
                                $scope.hierarchyOptions = [];
                                var options = response.data;

                                transformTags(options);

                                var model = {};
                                _.each(options, function (v, k) {
                                    if (v) {
                                        model[k] = v;
                                        model[k].originalValue = model[k].value;
                                        model[k].value = _.values(model[k].value);
                                    }
                                });
                                $scope.hierarchyOptions = model;
                            });
                    }

                    function getHierarchyId(member, property){
                        if (property) {
                            return _.find(
                                _.pairs(
                                    _.find($scope.hierarchyOptions, function(c){
                                        return c.key === member;
                                    }).originalValue),
                                function(c){
                                    return c[1] === property;
                                })[0];
                        }

                        return null;
                    }

                    function transformTags(options) {
                        // adapt data to diego's list control {k:v..kn:vn}
                        _.each(options, function (level) {
                            level.key = level.name;


                            level.tags = _.object(_.map(level.tags, function (tag) {
                                return [tag.id, tag.name];
                            }));
                            level.value = level.tags;

                            delete level.id;
                            delete level.name;
                            delete level.tags;

                            return level;
                        });
                    }

                    function createRecordHierarchy(record){
                        return {
                            Division: getHierarchyDescription('Division', record, 'Level_1'),
                            Department: getHierarchyDescription('Department', record, 'Level_2'),
                            Class: getHierarchyDescription('Class', record, 'Level_3')
                        };
                    }

                    function getHierarchyDescription(member, laborItem, property) {
                        if (laborItem[property]) {
                            var value = _.find($scope.hierarchyOptions, function (c) {
                                return c.key === member;
                            });

                            return _.isUndefined(value) ? '' : value.originalValue[laborItem[property]];
                        }

                        return null;
                    }

                    loadHierarchy();
                };

                linkCtrl.$inject = ['$scope', '$location', '$rootScope',
                    '$filter', 'xhr', '$dialog', '$anchorScroll', 'lookup'];

                app()
                    .service('pageHelper', ['$q', pageHelper])
                    .service('helpers', helpers)
                    .service('apiResourceHelper', ['$q', 'pageHelper', '$resource', 'helpers', apiResourceHelper])
                    .directive('hierarchy', [hierarchyDirective])
                    .controller('linkCtrl', linkCtrl);

                return angular.bootstrap($el, ['myApp']);
            }
        };
    });
/* jshint ignore:end */