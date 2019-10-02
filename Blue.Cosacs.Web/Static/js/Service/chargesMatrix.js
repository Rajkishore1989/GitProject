/*global define*/
define(['underscore', 'angular', 'url', 'moment', 'confirm', 'angularShared/app', 'alert', 'jquery.pickList',
        'merchandising/shared/directives/hierarchy', 'notification', 'angular.ui', 'angular-resource', 'lib/select2'],

    function (_, angular, url, moment, confirm, app, alert, pickList, hierarchyDirective, notification) {
        'use strict';

        return {
            init: function ($el) {
                var chargesMatrixController = function ($scope, xhr) {
                    $scope.product = {};
                    $scope.product.fields = [];
                    $scope.masterData = {};

                    var resetNew = function () {
                        $scope.productItem = {};
                        $scope.productItem.IsGroupFilter = true;
                        $scope.productItem.edit = true;
                        $scope.creating = false;
                    };

                    $scope.select2Options = {
                        allowClear: true
                    };

                    var safeApply = function (fn) {
                        var phase = $scope.$root.$$phase;
                        if (phase === '$apply' || phase === '$digest') {
                            $scope.$eval(fn);
                        } else {
                            $scope.$apply(fn);
                        }
                    };

                    pickList.populate('Blue.Cosacs.Service.ServiceRepairType', function (rows) {
                        safeApply(function() {
                            $scope.masterData.repairTypes = {
                                data: _.map(rows, function (value, key) {
                                    return {
                                        id: key,
                                        text: value,
                                        type: 'repairType'
                                    };
                                })
                            };
                        });
                    });

                    pickList.populate('ServiceSupplier', function (rows) {
                        safeApply(function() {
                            $scope.masterData.serviceSupplier = {
                                data: _.map(rows, function (value, key) {
                                    return {
                                        id: key,
                                        text: value,
                                        type: 'serviceSupplier'
                                    };
                                })
                            };
                        });
                    });

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
                        xhr.get(url.resolve('/Service/Charges/GetItem?Id=') + item.Id)
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
                        xhr.post(url.resolve('/Service/Charges/Save'), formatSave(formattedRecord))
                            .success(function (data) {
                                if (data.Message){
                                    notification.show(data.Message);
                                } else {

                                    if (record.Id) {
                                        record.Id = data;
                                        record.edit = false;
                                    } else {
                                        formattedRecord.Id = data;
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
                        confirm("Are you sure you want to remove the record " + record.Label + "?", "Remove Record",
                            function (ok) {
                                if (ok) {
                                    xhr["delete"](url.resolve('/Service/Charges/Delete?Id=' + record.Id))
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

                    $scope.valid = function (row) {
                        if (!row) {
                            return true;
                        }

                        return row.Label && 
                            row.RepairType && 
                            $scope.chargesValueIsValid(row.ChargeCustomer) && 
                            $scope.chargesValueIsValid(row.ChargeEWClaim) && 
                            $scope.chargesValueIsValid(row.ChargeContractedTech) && 
                            $scope.chargesValueIsValid(row.ChargeInternalTech) && 
                            (row.ItemList && !row.IsGroupFilter || row.IsGroupFilter);
                    };

                    $scope.labelFilter = function () {
                        if ($scope.filter) {
                            return {
                                Label: $scope.filter
                            };
                        }
                    };

                    xhr.get(url.resolve('/Service/Charges/GetAll'))
                        .success(function (data) {

                            $scope.matrixList = data;
                            loadHierarchy();
                        });

                    $scope.chargesValueIsValid = function (value) {

                        if (isNaN(parseFloat(value))) {
                            return false;
                        }

                        return value >= 0;
                    };

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

                chargesMatrixController.$inject = ['$scope', 'xhr'];

                app().controller('chargesMatrixController', chargesMatrixController)
                    .directive('hierarchy', [hierarchyDirective]);

                return angular.bootstrap($el, ['myApp']);
            }
        };
    });