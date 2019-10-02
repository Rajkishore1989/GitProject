/*global define, console */
define(['jquery.pickList', 'angular', 'jquery', 'underscore', 'url', 'moment', 'spa', 'confirm', 'angularShared/app', 'notification',
    'angularShared/loader', 'angularShared/interceptor', 'angular.ui', 'angular.bootstrap', 'lib/select2', 'jquery.ui'],

function (pickList, angular, $, _, url, moment, spa, confirm, app, notification, loader, interceptor) {
    'use strict';

    return {
        init: function ($el) {
            var warrantyPromotionsController = function ($scope, $location, $attrs, $timeout, $dialog, xhr, $anchorScroll) {
                $scope.select2Options = {
                    allowClear: true
                };
                $scope.creatingNewPromotion = false;
                $scope.MasterData = {};
                $scope.newPromotion = {
                    Levels: {}
                };

                $scope.MasterData.Branches = {};
                $scope.MasterData.BranchTypes = {};

                $scope.filtersToggle = 'level';
                $scope.promotions = [];

                $scope.datePicker = {
                    defaultDate: "+0",
                    dateFormat: "DD, d MM, yy",
                    changeMonth: true,
                    changeYear: true
                };

                $scope.AllowEdit = $attrs.editPricePermission === 'True';

                $scope.promtionDatePickerDate = _.extend({}, $scope.datePicker, { defaultDate: "+1", minDate: "+1" });

                $scope.MasterData.PromotionActions = {
                    '%': 'Percentage Discount',
                    '=': 'Set Price'
                };

                $scope.filterPromotions = $location.search();
                if (!$scope.filterPromotions.PageSize) {
                    $scope.filterPromotions.PageSize = 10;
                }

                setDefaultValueForActiveFrom($scope.filterPromotions.ActiveFrom);
                if ($scope.filterPromotions.ActiveTo) {
                    $scope.filterPromotions.ActiveTo = new Date(moment($scope.filterPromotions.ActiveTo).format());
                }

                $scope.selectPage = function (page) {
                    $scope.filterPromotions.PageIndex = page;
                    $scope.performSearch();
                };

                function setDefaultValueForActiveFrom(value) {
                    if (value) {
                        $scope.filterPromotions.ActiveFrom = new Date(moment($scope.filterPromotions.ActiveFrom).format());
                    }
                }

                $scope.clearFilter = function () {
                    $scope.filterPromotions = _.omit($scope.filterPromotions, 'Warranty', 'ActiveTo', 'ActiveFrom', 'BranchNumber', 'BranchType');
                    setDefaultValueForActiveFrom();
                    $scope.performSearch();
                };

                var safeApply = function (fn) {
                    var phase = $scope.$root.$$phase;
                    if (phase === '$apply' || phase === '$digest') {
                        $scope.$eval(fn);
                    } else {
                        $scope.$apply(fn);
                    }
                };

                function GetPickList(pickListName, applyObject) {
                    pickList.populate(pickListName, function (data) {
                        safeApply(function () {
                            _.extend(applyObject, data);
                        });
                    });

                    return null;
                }

                $scope.populateExistingPromotions = function (allPromotions) {

                    $location.hash('search');
                    $anchorScroll();

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

                        singlePromotion.Filters.push({
                            name: 'Store Type',
                            value: singlePromotion.BranchType || 'All'
                        });

                        var branchNumber = _.find($scope.MasterData.Branches, function (value, key) {
                            return key === singlePromotion.BranchNumber;
                        });

                        singlePromotion.Filters.push({
                            name: 'Store Location',
                            value: branchNumber || ' All'
                        });

                        singlePromotion.Filters.push({
                            name: 'Warranty',
                            value: singlePromotion.WarrantyNumber,
                            WarrantyId: singlePromotion.WarrantyId,
                            wurl: url.resolve('/Warranty/Warranties/') + singlePromotion.WarrantyId
                        });
                    });

                    return allPromotions;
                };

                $scope.performSearch = function () {
                    xhr({
                        method: 'POST',
                        url: url.resolve('Warranty/WarrantyPromotions/List'),
                        data: $scope.filterPromotions
                    }).success(function (data) {
                        if (data) {
                            _.extend($scope.filterPromotions, {
                                PageCount: data.PageCount,
                                PageIndex: data.PageIndex,
                                RecordCount: data.RecordCount
                            });
                            $scope.promotions = $scope.populateExistingPromotions(data.Page);
                        }
                    })
                    .error(function (error, text) {
                        console.log('error creating return percentage ' + error + ' ' + text);
                    });
                };

                GetPickList('BRANCH', $scope.MasterData.Branches);
                GetPickList('fascia', $scope.MasterData.BranchTypes);
                $scope.performSearch();

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
                        required: true,
                        dropdownCssClass: "warrantyResults",
                        escapeMarkup: function (m) {
                            return m;
                        }
                    };
                };

                $scope.canSave = function (promotion) {
                    if (!promotion.PromotionAmount || !promotion.startDate || !promotion.endDate || !promotion.Action || !promotion.Warranty) {
                        return false;
                    }

                    return true;
                };

                $scope.createNewPromotion = function () {

                    if (!$scope.canSave) {
                        return;
                    }

                    var promotion = $scope.newPromotion;
                    promotion.StartDate = promotion.startDate.toISOString();
                    promotion.EndDate = promotion.endDate.toISOString();
                    if (promotion.Action === '%') {
                        promotion.PercentageDiscount = promotion.PromotionAmount;
                        promotion.RetailPrice = null;
                    } else if (promotion.Action === '=') {
                        promotion.RetailPrice = promotion.PromotionAmount;
                        promotion.PercentageDiscount = null;
                    }
                    promotion.WarrantyId = promotion.Warranty.WarrantyId;
                    promotion.WarrantyNumber = promotion.Warranty.id;

                    var promotionToSave = _.extend({}, promotion);

                    delete promotionToSave.startDate;
                    delete promotionToSave.endDate;
                    delete promotionToSave.Levels;
                    delete promotionToSave.Warranty;

                    xhr({
                        method: 'POST',
                        url: url.resolve('Warranty/WarrantyPromotions'),
                        data: promotionToSave
                    }).success(function (data) {
                        if(data.Result){

                            notification.show('Promotion added successfully');

                            $scope.newPromotion = {};

                            if (data.Promotion.BranchType) {
                                data.Promotion.BranchType = _.find($scope.MasterData.BranchTypes, function (value, key) {
                                    return key === data.Promotion.BranchType;
                                });
                            }

                            $scope.promotions.push($scope.populateExistingPromotions([data.Promotion])[0]);
                            $scope.creatingNewPromotion = false;
                            $timeout(function () {
                                $('tr.promotion[data-id="' + data.Promotion.Id + '"]').addClass('new');
                            }, 0);

                            $timeout(function () {
                                $('tr.promotion[data-id="' + data.Promotion.Id + '"]').removeClass('new');
                            }, 1000);
                        }
                        else {
                            notification.show(data.Message);
                        }
                    })
                    .error(function (error, text) {
                        console.log('error creating return percentage ' + error + ' ' + text);
                    });
                };

                $scope.cancelNewPromotion = function () {
                    $scope.newPromotion = {};

                    $scope.creatingNewPromotion = false;
                };

                $scope.showNewRow = function ($event) {
                    $scope.creatingNewPromotion = true;
                    $event.preventDefault();
                };

                $scope.deletePromotion = function () {
                    var promotion = this.promo;
                    var id = promotion.Id;

                    if (!id) {
                        return;
                    }

                    var deleteConfirmation = $dialog.messageBox('Confirm Promotion Delete',
                        'You have chosen to delete this Promotion. Are you sure you want to do this?', [{ label: 'Delete', result: 'yes' }, {
                            label: 'Cancel',
                            result: 'no'
                        }]);

                    deleteConfirmation.open().then(function (choice) {
                        if (choice === 'yes') {
                            xhr({
                                method: 'DELETE',
                                url: url.resolve('Warranty/WarrantyPromotions/' + id)
                            }).success(function (data) {
                                if (data.Success) {
                                    $scope.promotions = _.reject($scope.promotions, function (promo) {
                                        return promo.Id === id;
                                    });
                                }
                            });
                        }
                    });
                };
            };

            warrantyPromotionsController.$inject = ['$scope', '$location', '$attrs', '$timeout', '$dialog', 'xhr', '$anchorScroll'];

            app().controller('WarrantyPromotionsController', warrantyPromotionsController);

            return angular.bootstrap($el, ['myApp']);
        }
    };
});