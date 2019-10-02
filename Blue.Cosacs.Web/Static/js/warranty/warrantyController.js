/*global define*/
define(['underscore', 'jquery', 'angular', 'angularShared/app', 'notification', 'url',
    'alert', 'moment', 'facetsearch/service', 'lib/select2'],

    function (_, $, angular, app, notification, url, alert, moment, facetService) {
        'use strict';
        return {
            init: function ($el) {
                var warrantyCtrl = function ($scope, $location, $rootScope, $filter, xhr, facetService, Enum) {

                    $scope.MasterData = {};
                    $scope.MasterData.Branches = $el.data('branches') || {};
                    $scope.MasterData.BranchTypes = $el.data('branch-types') || {};
                    $scope.hasEditPricePermission = $el.data('editPricePermission') === 'True';
                    $scope.hasViewPromotionPermission = $el.data('viewPromotionPermission') === 'True';
                    $scope.MasterData.DefaultTaxRate = $el.data('default-tax-rate') || 0;
                    $scope.DefaultWarrantyType = $el.data('default-warranty-type') || Enum.WarrantyTypeEnum.Free;
                    $scope.WarrantyTypes = facetService.getWarrantyTypes();
                    $scope.warranty = {};

                    $scope.departmentSet = false;

                    var isInt = function (i) {
                        var n;
                        n = parseInt(i, 10);
                        return isNaN(n) ? 0 : n;
                    };

                    var mapLevels = function (warranty) {
                        warranty.WarrantyTags = [];
                        _.each(warranty.levels, function (level) {
                            if (level.selectedTag){
                                warranty.WarrantyTags.push({
                                    TagName: getTagName(level.selectedTag, level.Tags),
                                    LevelId: level.LevelId
                                });
                            }
                        });
                    };

                    var getTagName = function (tagNumber, tags) {
                        var tagName = _.find(tags, function (tag) {
                            if (tag.Id === parseInt(tagNumber, 10)) {
                                return true;
                            }
                            return false;
                        });

                        return tagName.Name;
                    };

                    var update = function () {
                        xhr.put(url.resolve('/Warranty/WarrantyAPI/') + $scope.warranty.Id, $scope.warranty)
                            .success(function (data) {
                                if (data.error) {
                                    alert("There is already a warranty with the same number. Save Failed.", "Duplicate Warranty Number");
                                } else {
                                    notification.show('Warranty updated successfully.');
                                }
                            });
                    };

                    var save = function (isContinue) {
                        xhr.post(url.resolve('/Warranty/WarrantyAPI'), $scope.warranty)
                            .success(function (data) {
                                if (data.error) {
                                    alert("There is already a warranty with the same number. Save Failed.", "Duplicate Warranty Number");
                                } else {
                                    notification.show('Warranty saved successfully.');

                                    if (isContinue) {
                                        var levels = $scope.warranty.levels;
                                        _.each(levels, function (level) {
                                            level.selectedTag = null;
                                        });
                                        $scope.warranty = {};
                                        $scope.warranty.levels = levels;
                                    } else {
                                        $location.path(url.resolve('/Warranty/Warranties/') + data.id);
                                        $scope.warranty.Id = id = data.id;
                                        $scope.showEditPrice = true;
                                    }

                                }
                            });
                    };

                    var getDisplayLocationPrice = function (locationPrice, taxRate) {
                        locationPrice.TaxInclusivePrice = (locationPrice.RetailPrice + ((locationPrice.RetailPrice * (taxRate || $scope.MasterData.DefaultTaxRate)) / 100));
                        locationPrice.RetailPrice = ((locationPrice.RetailPrice * 100) / 100);
                        locationPrice.CostPrice = ((locationPrice.CostPrice * 100) / 100);
                        locationPrice.BranchName = $scope.MasterData.Branches[locationPrice.BranchNumber];
                    };

                    var populateExistingPromotions = function (allPromotions) {

                        _.each(allPromotions, function (singlePromotion) {
                            singlePromotion.Filters = [];

                            if (singlePromotion.PercentageDiscount > 0) {
                                singlePromotion.IsPercentage = true;
                                singlePromotion.PromotionAmount = singlePromotion.PercentageDiscount;
                            } else if (singlePromotion.RetailPrice > 0) {
                                singlePromotion.IsPercentage = false;
                                singlePromotion.PromotionAmount = singlePromotion.RetailPrice;
                            }

                            singlePromotion.startDate = moment(singlePromotion.StartDate).toDate();
                            singlePromotion.endDate = moment(singlePromotion.EndDate).toDate();
                            singlePromotion.StartDate = singlePromotion.startDate.toISOString();
                            singlePromotion.EndDate = singlePromotion.endDate.toISOString();

                            if (singlePromotion.BranchType) {
                                singlePromotion.Filters.push({
                                    name: 'Store Type',
                                    value: singlePromotion.BranchType
                                });
                            }

                            if (singlePromotion.BranchNumber) {
                                var branchNumber = _.find($scope.MasterData.Branches, function (value, key) {
                                    return key === singlePromotion.BranchNumber;
                                });

                                if (branchNumber) {
                                    singlePromotion.Filters.push({
                                        name: 'Store Location',
                                        value: branchNumber
                                    });
                                }
                            }

                            if (singlePromotion.Warranty) {
                                singlePromotion.Filters.push({
                                    name: 'Warranty',
                                    value: singlePromotion.Warranty.Number
                                });
                            }
                        });

                    };

                    var id = $location.url().substring($location.url().lastIndexOf('/') + 1);

                    var filterUnselectedRenewals = function () {
                        $scope.warranty.RenewalChildren = _.filter($scope.warranty.RenewalChildren, function (renewal) {
                            return renewal.id !== -1;
                        });
                    };

                    xhr.get(url.resolve('/Warranty/WarrantyAPI/') + isInt(id))
                        .success(function (data) {
                            $scope.warranty = data.warranty;
                            $scope.warranty.TypeCode = $scope.warranty.TypeCode ||
                                $scope.DefaultWarrantyType.toUpperCase();

                            $scope.masterData = data.masterData;

                            $scope.warranty.levels = data.masterData.warrantyHierarchy;
                            if ($scope.warranty.levels) {
                                _.each($scope.warranty.levels, function (tmpLevel) {
                                    var levelName = "levelScope";
                                    tmpLevel[levelName] = {};
                                    _.each(tmpLevel.Tags, function (tmpTag) {
                                        tmpLevel[levelName][tmpTag.Id] = tmpTag.Name;
                                    });
                                });
                            }

                            if (!$scope.warranty.RenewalChildren) {
                                $scope.warranty.RenewalChildren = [];
                            }
                            if (!$scope.warranty.RenewalParents) {
                                $scope.warranty.RenewalParents = [];
                            }

                            _.each($scope.warranty.WarrantyTags, function (tag) {
                                _.each($scope.warranty.levels, function (level) {
                                    if (level.LevelId === tag.LevelId) {
                                        for(var t = 0; t < level.Tags.length; t++) {
                                            if (level.Tags[t].Name === tag.TagName) {
                                                level.selectedTag = String(level.Tags[t].Id);
                                                $scope.departmentSet = true;
                                                break;
                                            }
                                        }
                                    }
                                });
                            });

                            $scope.$watch('warranty.TypeCode', function (newVal, oldVal) {
                                if (newVal === oldVal || newVal !== Enum.WarrantyTypeEnum.Free) {
                                    return;
                                }

                                if (hasRetailPrice()) {
                                    $scope.warranty.TypeCode = oldVal;
                                    notification.show('Cannot change the type of Warranty to Free because it has a Retail Price.');

                                }
                            });

                            var hasRetailPrice = function () {
                                if (!$scope.prices || $scope.prices.length === 0) {
                                    return false;
                                }
                                var hasRetPrice = _.find($scope.prices, function (price) {
                                    return price.RetailPrice > 0;
                                });

                                return (hasRetPrice && hasRetPrice !== undefined);
                            };

                            var isLocked = function () {
                                var ret = false;

                                _.find($scope.prices, function (price) {
                                    var today = moment().startOf('day');
                                    var effectiveDt = price.EffectiveDate;

                                    if (today.isAfter(effectiveDt) ||
                                        today.isSame(effectiveDt)) {
                                        ret = true;

                                        return true;// Break for loop callback
                                    }
                                });

                                return ret;
                            };

                            $scope.prices = [];
                            $scope.showEditPrice = false;
                            $scope.locked = true;

                            if (isInt(id)) {

                                var taxRate = data.warranty.TaxRate;
                                xhr.get(url.resolve('/Warranty/WarrantyPrices/GetPrices/' + id))
                                    .success(function (prices) {
                                        _.each(prices, function (price) {
                                            getDisplayLocationPrice(price, taxRate);
                                        });

                                        $scope.prices = prices;
                                        $scope.showEditPrice = true;
                                        $scope.locked = isLocked();
                                    });

                                if ($scope.hasViewPromotionPermission) {
                                    var parameters = {
                                        params: {
                                            warrantyId: id
                                        }
                                    };

                                    xhr.get(url.resolve('/Warranty/WarrantyPromotions/GetPromotionsForWarranty'), parameters)
                                        .success(function (promotions) {
                                            populateExistingPromotions(promotions);
                                            $scope.promotions = promotions;
                                        });
                                }
                            } else {
                                $scope.locked = false;
                            }
                        });

                    $scope.warrantyLevelsLink = function () {
                        return url.resolve('/Warranty/Hierarchy');
                    };

                    $scope.isDepartmentSet = function () {

                        if(_.isUndefined($scope.warranty.levels)){
                            safeApply($scope, function () {
                                $scope.departmentSet = false;
                            });
                            return false;
                        }else{
                            _($scope.warranty.levels).forEach(function(level){
                                if(_.has(level, 'selectedTag')){
                                    if(!(_.isNull(level.selectedTag))){

                                        safeApply($scope, function () {
                                            $scope.departmentSet = true;
                                        });
                                        return true;
                                    }else{
                                        safeApply($scope, function () {
                                            $scope.departmentSet = false;
                                        });
                                        return false;
                                    }
                                }else{
                                    safeApply($scope, function () {
                                        $scope.departmentSet = false;
                                    });
                                    return false;
                                }
                            });
                        }
                    };

                    $scope.saveWarranty = function (isContinue) {
                        mapLevels($scope.warranty);

                        if (angular.uppercase($scope.warranty.TypeCode) === Enum.WarrantyTypeEnum.InstantReplacement) {
                            $scope.warranty.RenewalChildren = [];
                            $scope.warranty.RenewalParents = [];
                        } else {
                            filterUnselectedRenewals();
                        }

                        if ($scope.warranty.Id) {
                            update();
                        } else {
                            save(isContinue);
                        }
                    };

                    $scope.clear = function () {
                        var levels = $scope.warranty.levels;
                        _.each(levels, function (level) {
                            level.selectedTag = null;
                        });
                        $scope.warranty = {};
                        $scope.warranty.levels = levels;
                        $scope.warranty.TaxRate = $scope.MasterData.DefaultTaxRate;
                    };

                    $scope.getWarrantyPriceLink = function () {
                        var searchParams = facetService.getSearchUrl('WarrantyId', [id]);
                        return url.resolve('Warranty/Warranties?') + searchParams;
                    };

                    $scope.warrantySearchSetup = function () {
                        var _scope = $scope;

                        var getRowsFilter = function () {
                            var filterRows = _.reduce(_scope.warranty.RenewalChildren, function (memo, child) {
                                if (child.id !== -1) {
                                    memo += child.id + ",";
                                }
                                return memo;
                            }, "", this);

                            return filterRows.replace(/(^,)|(,$)/g, "");
                        };

                        return {
                            placeholder: "Search for a warranty",
                            minimumInputLength: 2,
                            ajax: {
                                url: url.resolve('warranty/warrantyAPI/SelectSearch'),
                                dataType: 'json',
                                data: function (term, page) {
                                    return { q: term, filter: getRowsFilter(), rows: 10,filterReplacement:true };
                                },
                                results: function (data, page) {
                                    return {
                                        results: _.map(data.response.docs, function (doc) {
                                            return {
                                                id: doc.WarrantyId,
                                                num: doc.WarrantyNumber,
                                                text: doc.WarrantyNumber + " : " + doc.ItemDescription
                                            };
                                        })
                                    };
                                }
                            },
                            formatResult: function (data) {
                                return "<table class='warrantyResults'><tr><td> " + data.text + "</td></tr></table>";
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

                    $scope.AddRenewal = function () {
                        if (!$scope.warranty.RenewalChildren) {
                            $scope.warranty.RenewalChildren = [];
                        }
                        var renewal = _.find($scope.warranty.RenewalChildren, function (child) {
                            return child.id === -1;
                        });
                        if (!renewal) {
                            renewal = { id: -1, num: -1 };
                            $scope.warranty.RenewalChildren.push(renewal);
                        }
                    };

                    $scope.RemoveRenewal = function (renewal) {
                        for (var i = 0; i < $scope.warranty.RenewalChildren.length; i++) {
                            if ($scope.warranty.RenewalChildren[i].id === renewal.id) {
                                $scope.warranty.RenewalChildren.splice(i, 1);
                            }
                        }
                    };

                    $scope.warrantyLink = function (id) {
                        return url.resolve('/Warranty/Warranties/') + id;
                    };

                    $scope.renewalPicked = function (nodeChild) {
                        var testResult = nodeChild.id !== -1;
                        return testResult;
                    };

                    $scope.$watch('warranty.TypeCode', function (value) {
                        $scope.hideRenewal = (angular.uppercase(value) !== Enum.WarrantyTypeEnum.Extended);
                        if ($scope.hideRenewal) {
                            $scope.warranty.RenewalChildren = []; // clear array on hide
                        }
                    });

                    $scope.getRadioButtonId = function (type) {
                        var tmpId = 'id';
                        if (type && type.value) {
                            tmpId = type.value.replace(/ /g, '');
                        }
                        return tmpId;
                    };

                };

                var safeApply = function (scope, fn) {
                    var phase = scope.$root.$$phase;
                    if (phase === '$apply' || phase === '$digest') {
                        scope.$eval(fn);
                    } else {
                        scope.$apply(fn);
                    }
                };

                var pickListDirective = function () {
                    return {
                        restrict: 'C',
                        link: function (scope, iElement, iAttrs, ctrl) {
                            setTimeout(function () {
                                $('.picklist.picklistdirective').on("change", function (opt) {
                                    var renewal = _.find(scope.warranty.RenewalChildren, function (child) {
                                        return child.id === -1; // added renewal
                                    });
                                    safeApply(scope, function () {
                                        if (renewal) {
                                            renewal.id = scope.newRenewal.id;
                                            renewal.num = scope.newRenewal.num;
                                            renewal.text = scope.newRenewal.text;
                                            $(this).select2("destroy");
                                            scope.newRenewal = null;
                                        }
                                    });
                                });
                            }, 500);
                        }
                    };
                };


                warrantyCtrl.$inject = ['$scope', '$location', '$rootScope', '$filter', 'xhr', 'facetService', 'Enum'];
                app()
                    .service('facetService', facetService)
                    .controller('warrantyCtrl', warrantyCtrl)
                    .directive('picklistdirective', pickListDirective);
                return angular.bootstrap($el, ['myApp']);
            }
        };
    });