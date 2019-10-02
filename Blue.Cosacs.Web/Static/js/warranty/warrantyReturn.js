/*global define*/
define(['angular', 'jquery', 'underscore', 'url', 'moment', 'spa', 'confirm', 'angularShared/app', 'notification',
    'angular.ui', 'angular.bootstrap', 'lib/select2', 'jquery.ui', 'lib/jquery.containsCaseInsensitive'],

function (angular, $, _, url, moment, spa, confirm, app, notification) {
    'use strict';

    return {
        init: function ($el) {
            var warrantyReturnController = function ($scope, $attrs, $timeout, $dialog, xhr, $location, lookup) {

                $scope.select2Options = {
                    allowClear: true
                };
                $scope.hasEditPercentagePermission = $attrs.editPercentagePermission === 'True';
                $scope.creatingNewReturn = false;
                $scope.SearchCriteria = "";
                $scope.MasterData = {};
                $scope.newReturn = {
                    Levels: {}
                };
                $scope.filtersToggle = 'level';
                $scope.filter = $location.search();

                $scope.selectPage = function (page) {
                    $scope.filter.PageIndex = page;
                    $scope.search();
                };

                $scope.privateFunc = {
                    populateExistingReturns: function (allPercentages) {
                        _.each(allPercentages, function (returnPercentage) {
                            returnPercentage.Filters = [];
                            if (returnPercentage.BranchType) {
                                returnPercentage.Filters.push({
                                    name: 'Store Type',
                                    value: lookup.getValue(returnPercentage.BranchType, 'fascia')
                                });
                            } else {
                                returnPercentage.Filters.push({
                                    name: 'Store Type',
                                    value: 'ALL'
                                });
                            }

                            if (returnPercentage.BranchNumber) {
                                var branchNumber = _.find($scope.MasterData.Branches, function (value, key) {
                                    return key == returnPercentage.BranchNumber;
                                });

                                if (branchNumber) {
                                    returnPercentage.Filters.push({
                                        name: 'Store Location',
                                        value: branchNumber
                                    });
                                }
                            } else {
                                returnPercentage.Filters.push({
                                    name: 'Store Location',
                                    value: 'ALL'
                                });
                            }

                            if (returnPercentage.Warranty) {
                                returnPercentage.Filters.push({
                                    name: 'Warranty',
                                    value: returnPercentage.Warranty.Number,
                                    WarrantyId: returnPercentage.Warranty.Id,
                                    wurl: url.resolve('/Warranty/Warranties/') + returnPercentage.Warranty.Id
                                });
                            } else {
                                returnPercentage.Filters.push({
                                    name: 'Warranty',
                                    value: 'ALL',
                                    wurl: '#'
                                });
                            }

                            if (!returnPercentage.WarrantyReturnFilters || returnPercentage.WarrantyReturnFilters.length === 0) {
                                returnPercentage.WarrantyReturnFilters = [{
                                    LevelName: 'Levels',
                                    TagName: 'ALL'
                                }];
                            }
                        });

                        return allPercentages;
                    }
                };

                $scope.search = function () {

                    xhr({
                        method: 'POST',
                        url: url.resolve('/Warranty/WarrantyReturn/GetAll'),
                        data: this.filter
                    }).success(function (data) {
                        if (data) {
                            $scope.returnPercentages = data.Page;
                            _.extend($scope.filter, {
                                PageCount: data.PageCount,
                                PageIndex: data.PageIndex,
                                RecordCount: data.RecordCount
                            });
                        }
                        setup();
                    });



                };

                var setup = function () {

                    $location.hash('search');

                    //set up initial status
                    if ($attrs.returnpercentageData) {

                        var returnpercentageData = JSON.parse($attrs.returnpercentageData);
                        $scope.MasterData.Branches = returnpercentageData.filters.branches;
                        $scope.MasterData.BranchTypes = returnpercentageData.filters.branchTypes;

                        returnpercentageData.returnPercentages = $scope.returnPercentages;
                        var levels = returnpercentageData.filters.hierarchyData.Levels;
                        _.each(levels, function (level) {
                            var tags = _.filter(returnpercentageData.filters.hierarchyData.Tags, function (tag) {
                                return tag.Level.Id === level.Id;
                            });
                            level.Tags = tags;
                        });

                        $scope.MasterData.Levels = levels;
                        $scope.returnPercentagesFull = $scope.privateFunc.populateExistingReturns(returnpercentageData.returnPercentages);
                        $scope.returnPercentages = $scope.returnPercentagesFull;
                    }
                    //$anchorScroll();
                };

                $scope.search();

                $scope.warrantySearchSetup = function () {
                    return {
                        placeholder: "Warranty",
                        allowClear: true,
                        minimumInputLength: 2,
                        ajax: {
                            url: url.resolve('Warranty/WarrantyAPI/SelectSearch'),
                            dataType: 'json',
                            data: function (term) {
                                return {
                                    q: term,
                                    rows: 10
                                };
                            },
                            results: function (data) {
                                var results = _.map(data.response.docs, function (doc) {
                                    return {
                                        id: doc.WarrantyNumber,
                                        text: doc.ItemDescription,
                                        WarrantyId: doc.WarrantyId
                                    };
                                });
                                return {
                                    results: results
                                };
                            }
                        },
                        formatResult: function (data) {
                            return "<table class='warrantyResults'><tr><td><b> " + data.id + " </b></td><td> : </td><td> " + data.text + "</td></tr></table>";
                        },
                        formatSelection: function (data) {
                            return data.id;
                        },
                        dropdownCssClass: "warrantyResults",
                        escapeMarkup: function (m) {
                            return m;
                        }
                    };
                };

                $scope.createNewReturnPercentage = function () {
                    var retPercent = $scope.newReturn.ReturnPercentage;
                    if (!$scope.newReturn.WarrantyLength || !$scope.newReturn.ElapsedMonths ||
                        isNaN(retPercent) || retPercent < 0 || retPercent > 100 ) {
                        return;
                    }

                    //elapsed less than length
                    if (($scope.newReturn.WarrantyLength + $scope.newReturn.FreeWarrantyLength) < $scope.newReturn.ElapsedMonths) {
                        return;
                    }

                    var return2create = {
                        WarrantyReturnFilters: null,
                        WarrantyLength: $scope.newReturn.WarrantyLength,
                        ElapsedMonths: $scope.newReturn.ElapsedMonths,
                        FreeWarrantyLength: $scope.newReturn.FreeWarrantyLength,
                        PercentageReturn: $scope.newReturn.ReturnPercentage,
                        BranchType: ($scope.newReturn.BranchType === '') ? null : $scope.newReturn.BranchType,
                        BranchNumber: ($scope.newReturn.BranchNumber === '') ? null : $scope.newReturn.BranchNumber,
                        Warranty: null
                    };

                    if ($scope.filtersToggle == 'level') {
                        return2create.WarrantyReturnFilters = _.compact(_.map($scope.newReturn.Levels, function (tagId, levelId) {
                            if (tagId) {
                                var levelName, tagName;
                                var id = parseInt(levelId, 10);
                                var level = _.find($scope.MasterData.Levels, function (l) {
                                    return l.Id === id;
                                });
                                if (level) {
                                    levelName = level.Name;
                                    id = parseInt(tagId, 10);
                                    var tag = _.find(level.Tags, function (t) {
                                        return t.Id === id;
                                    });
                                    if (tag) {
                                        tagName = tag.Name;
                                    }
                                }

                                return {
                                    LevelId: levelId,
                                    LevelName: levelName,
                                    TagId: tagId,
                                    TagName: tagName
                                };
                            }
                        }));
                    } else {
                        if ($scope.newReturn.Warranty) {
                            return2create.Warranty = {
                                Id: $scope.newReturn.Warranty.WarrantyId,
                                Number: $scope.newReturn.Warranty.id,
                                Description: $scope.newReturn.Warranty.text
                            };
                        }
                    }

                    xhr({
                        method: 'POST',
                        url: url.resolve('Warranty/WarrantyReturn'),
                        data: return2create
                    }).success(function (data) {
                        notification.show('Return Percentage added successfully');
                        $scope.newReturn = {
                            Levels: {}
                        };

                        data.Filters = [];
                        if (data.BranchType) {
                            var branchType = _.find($scope.MasterData.BranchTypes, function (value, key) {
                                return key == data.BranchType;
                            });

                            if (branchType) {
                                data.Filters.push({
                                    name: 'Store Type',
                                    value: branchType
                                });
                            }
                        } else {
                            data.Filters.push({
                                name: 'Store Type',
                                value: 'ALL'
                            });
                        }

                        if (data.BranchNumber) {
                            var branchNumber = _.find($scope.MasterData.Branches, function (value, key) {
                                return parseInt(key, 10) === data.BranchNumber;
                            });

                            if (branchNumber) {
                                data.Filters.push({
                                    name: 'Store Location',
                                    value: branchNumber
                                });
                            }
                        } else {
                            data.Filters.push({
                                name: 'Store Location',
                                value: 'ALL'
                            });
                        }

                        if (data.Warranty) {
                            data.Filters.push({
                                name: 'Warranty',
                                value: data.Warranty.Number,
                                WarrantyId: data.Warranty.Id,
                                wurl: url.resolve('/Warranty/Warranties/') + data.Warranty.Id
                            });
                        } else {
                            data.Filters.push({
                                name: 'Warranty',
                                value: 'ALL',
                                wurl: '#'
                            });
                        }

                        if (!data.WarrantyReturnFilters || data.WarrantyReturnFilters.length === 0) {
                            data.WarrantyReturnFilters = [{
                                LevelName: 'Levels',
                                TagName: 'ALL'
                            }];
                        }

                        $scope.returnPercentagesFull.push(data);
                        $scope.returnPercentages = $scope.returnPercentagesFull;
                        $scope.creatingNewReturn = false;
                        $timeout(function () {
                            $('tr.return[data-id="' + data.Id + '"]').addClass('new');
                        }, 0);
                        $timeout(function () {
                            $('tr.return[data-id="' + data.Id + '"]').removeClass('new');
                        }, 1000);

                        if ($scope.stopWatchingWarrantySelection) {
                            $scope.stopWatchingWarrantySelection();
                        }
                    });
                    /*.error(function (error, text) {
                    //JS lint was complaining about the console
                    console.log('error creating return percentage ' + error + ' ' + text);
                    });*/
                };

                $scope.stopWatchingWarrantySelection = null;
                $scope.cancelNewReturnPercentage = function () {
                    $scope.newReturn = {
                        Levels: {}
                    };

                    $scope.creatingNewReturn = false;
                    if ($scope.stopWatchingWarrantySelection) {
                        $scope.stopWatchingWarrantySelection();
                    }
                };

                $scope.showNewRow = function (e) {
                    e.preventDefault();
                    $scope.creatingNewReturn = true;

                    $scope.stopWatchingWarrantySelection = $scope.$watch('newReturn.Warranty', function () {
                        if ($scope.newReturn.Warranty) {
                            if ($scope.newReturn.Warranty.WarrantyId) {
                                xhr({
                                    method: 'GET',
                                    url: url.resolve('Warranty/WarrantyAPI/' + $scope.newReturn.Warranty.WarrantyId)
                                }).success(function (data) {
                                    if (data && data.warranty && data.warranty.Length) {
                                        $scope.newReturn.WarrantyLength = data.warranty.Length;
                                    }
                                });
                            }
                        } else {
                            $scope.newReturn.WarrantyLength = null;
                        }
                    });
                };

                $scope.deleteReturnPercentage = function () {
                    var returnpercentage = this.returnPercentage;
                    var id = returnpercentage.Id;

                    if (!id) {
                        return;
                    }

                    var deleteConfirmation = $dialog.messageBox('Confirm Return Percentage Delete',
                        'You have chosen to delete this Warranty Return Percentage. Are you sure you want to do this?', [{
                            label: 'Delete',
                            result: 'yes',
                            cssClass: 'btn-primary'
                        }, {
                            label: 'Cancel',
                            result: 'no'
                        }]);

                    deleteConfirmation.open().then(function (choice) {
                        if (choice === 'yes') {
                            xhr({
                                method: 'DELETE',
                                url: url.resolve('Warranty/WarrantyReturn/' + id)
                            }).success(function (data) {
                                if (data.Success) {
                                    $scope.returnPercentagesFull = _.reject($scope.returnPercentagesFull, function (retpercentage) {
                                        return retpercentage.Id === id;
                                    });
                                    $scope.returnPercentages = $scope.returnPercentagesFull;

                                    notification.show('Warranty return percentage deleted');
                                }
                            });
                        }
                    });
                };


            };

            warrantyReturnController.$inject = ['$scope', '$attrs', '$timeout', '$dialog', 'xhr', '$location', 'lookup'];

            app().controller('WarrantyReturnController', warrantyReturnController);

            return angular.bootstrap($el, ['myApp']);
        }
    };
});