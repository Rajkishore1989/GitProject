/*global define*/
define(['underscore', 'angular', 'url', 'moment', 'confirm', 'angularShared/app', 'alert',
        'merchandising/shared/directives/hierarchy', 'notification', 'angular.ui', 'angular-resource',
        'lib/select2'],

    function (_, angular, url, moment, confirm, app, alert, hierarchyDirective, notification) {
        'use strict';

        return {
            init: function ($el) {
                var partsMatrixController = function ($scope, xhr) {
                    $scope.product = {
                        fields: []
                    };
                    $scope.masterData = {
                        repairTypes: { data: [] },
                        serviceSupplier: { data: [] }
                    };
                    $scope.select2Options = {
                        allowClear: true
                    };

                    var resetNew = function () {
                        $scope.productItem = {};
                        $scope.productItem.IsGroupFilter = true;
                        $scope.productItem.edit = true;
                        $scope.creating = false;
                    };

                    $scope.createNew = function () {
                        resetNew();
                        $scope.creating = true;

                        $scope.productItem.hierarchy = {
                            Division: null,
                            Department: null,
                            Class: null
                        };
                    };

                    $scope.undo = function (item) {
                        xhr.get(url.resolve('/Service/Parts/GetItem?Id=') + item.Id)
                            .success(function (data) {
                                for (var i = 0, ii = $scope.matrixList.length; i < ii; i++) {
                                    if (data.Id === $scope.matrixList[i].Id) {
                                        data.hierarchy = createRecordHierarchy(data);
                                        $scope.matrixList[i] =  data;

                                        return;
                                    }
                                }
                            });
                        item.edit = false;
                    };

                    var formatSave = function (save) {
                        var saveObj = {};
                        for (var o in save) {
                            if (save.hasOwnProperty(o)) {
                                if (typeof save[o] === 'object') {
                                    saveObj[o] = save[o] ? save[o].id : null;
                                } else {
                                    saveObj[o] = save[o];
                                }
                            }
                        }
                        return saveObj;
                    };

                    $scope.save = function (record) {
                        if (!$scope.valid(record)) {
                            return;
                        }

                        var formattedRecord = formatSave(record);
                        xhr.post(url.resolve('/Service/Parts/Save'), formattedRecord)
                            .success(function (data) {
                                if (data.Message) {
                                    notification.show(data.Message);
                                } else {
                                    if (record.Id) {
                                        record.Id = data;
                                        record.edit = false;
                                    } else {
                                        formattedRecord.Id = parseInt(data, 10);
                                        formattedRecord.edit = false;
                                        formattedRecord.hierarchy = createRecordHierarchy(formattedRecord);
                                        $scope.matrixList.push(formattedRecord);
                                        resetNew();
                                    }
                                    notification.show("Record saved successfully.");
                                }
                            });
                    };

                    $scope.deleteRecord = function (record) {
                        confirm("Are you sure you want to remove the record " + record.Label + "?",
                            "Remove Record", function (ok) {
                                if (ok) {
                                    xhr["delete"](url.resolve('/Service/Parts/Delete?Id=' + record.Id))
                                        .success(function () {
                                            if (record.Id) {
                                                for (var i = 0, ii = $scope.matrixList.length; i < ii; i++) {
                                                    if (record.Id === $scope.matrixList[i].Id) {
                                                        $scope.matrixList.splice(i, 1);
                                                        return;
                                                    }
                                                }
                                            }
                                        });
                                    notification.show("Record deleted successfully.");
                                }
                            }, false, 'Remove');
                    };

                    var validateMoney = function (money) {
                        var regex = /^\d+\.?\d*$/;
                        return regex.test(money);
                    };

                    $scope.isValidAmount = function (amount) {
                        return validateMoney(amount);
                    };

                    $scope.valid = function (row) {
                        if (!row) {
                            return true;
                        }

                        if (row.Label &&
                            (row.ChargeInternal !== null && row.ChargeInternal !== undefined) &&
                            (row.ChargeFirstYearWarranty !== null && row.ChargeFirstYearWarranty !== undefined) &&
                            (row.ChargeExtendedWarranty !== null && row.ChargeExtendedWarranty !== undefined) &&
                            (row.ChargeCustomer !== null && row.ChargeCustomer !== undefined) &&
                            row.RepairType &&
                            validateMoney(row.ChargeInternal) &&
                            validateMoney(row.ChargeFirstYearWarranty) &&
                            validateMoney(row.ChargeExtendedWarranty) &&
                            validateMoney(row.ChargeCustomer) &&
                            (row.ItemList && !row.IsGroupFilter || row.IsGroupFilter)) {
                            return true;
                        } else {
                            return false;
                        }
                    };

                    $scope.labelFilter = function () {
                        if ($scope.filter) {
                            return {
                                Label: $scope.filter
                            };
                        }
                    };

                    xhr.get(url.resolve('/Service/Parts/GetAll'))
                        .success(function (data) {
                            $scope.matrixList = data;
                            loadHierarchy();
                        });

                    $scope.saveHierarchySettings = function (tag, level, labourItem) {
                        switch (level){
                            case 'Division':
                                labourItem.Level_1 = getHierarchyId('Division', tag);
                                break;

                            case 'Department':
                                labourItem.Level_2 = getHierarchyId('Department', tag);
                                break;

                            case 'Class':
                                labourItem.Level_3 = getHierarchyId('Class', tag);
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

                                _.map($scope.matrixList, function(current){
                                    current.hierarchy = createRecordHierarchy(current);

                                    return current;
                                });
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
                            return _.find($scope.hierarchyOptions, function (c) {
                                return c.key === member;
                            }).originalValue[laborItem[property]];
                        }

                        return null;
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

                    resetNew();
                };

                partsMatrixController.$inject = ['$scope', 'xhr'];

                app().controller('partsMatrixController', partsMatrixController)
                    .directive('hierarchy', [hierarchyDirective]);

                return angular.bootstrap($el, ['myApp']);
            }
        };
    });