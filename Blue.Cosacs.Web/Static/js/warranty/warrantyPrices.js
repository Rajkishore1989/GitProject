/*global define*/
define(['angular', 'jquery', 'underscore', 'url', 'moment', 'spa', 'confirm', 'angularShared/app', 'notification',
    'facetsearch/controller', 'facetsearch/directive', 'angular.ui', 'angular.bootstrap', 'lib/select2', 'jquery.ui', 'underscore.string'],

function (angular, $, _, url, moment, spa, confirm, app, notification, facetController, facetDirective) {
    'use strict';

    return {
        init: function ($el) {

            var searchController = function ($scope, $timeout, $dialog, xhr, $compile) {

                function round(value) {
                    return Number(Math.round(value +'e'+ 2)+'e-'+ 2);
                }

                $scope.templateRetrieved = xhr.get(url.resolve('/Static/js/warranty/templates/WarrantyPrices.html'), {
                    cache: true
                })
                .success(function (data) {
                    $scope.pricesTemplate = $compile(data);
                });

                $scope.select2Options = {
                    allowClear: true
                };

                $scope.hasEditPricePermission = $el.data('editPricePermission') === 'True';
                $scope.MasterData = {};
                $scope.MasterData.Branches = $el.data('branches') || {};
                $scope.MasterData.BranchTypes = $el.data('branch-types') || {};
                $scope.MasterData.DefaultTaxRate = $el.data('default-tax-rate') || 0;
                $scope.MasterData.BulkEditActions = {
                    '+': 'Increase by ',
                    '+%': 'Increase by %',
                    '-': 'Decrease by ',
                    '-%': 'Decrease by %',
                    '=': 'Change to '
                };

                $scope.bulkEdit = {
                    CostPrice: {},
                    RetailPrice: {},
                    TaxInclusivePrice: {}
                };
                $scope.priceBulkEdit = false;

                $scope.newPriceDatePicker = {
                    defaultDate: "+1",
                    minDate: "+1",
                    dateFormat: "D, d MM, yy",
                    changeMonth: true,
                    changeYear: true
                };

                $scope.getPathToWarranty = function (warrantyId) {
                    return url.resolve('Warranty/Warranties/' + warrantyId);
                };

                $scope.getPathToWarrantyPromotion = function (warrantyId, warrantyPriceId, WarrantyNumber, EffectiveDate) {
                    return url.resolve('Warranty/WarrantyPromotions/PromotionsForWarrantyPrice?warrantyId=' + warrantyId +
                        '&warrantyPriceId=' + warrantyPriceId +
                        '&WarrantyNumber=' + WarrantyNumber +
                        '&EffectiveDate=' + EffectiveDate);
                };

                var safeApply = function (fn) {
                    var phase = $scope.$root.$$phase;
                    if (phase === '$apply' || phase === '$digest') {
                        $scope.$eval(fn);
                    } else {
                        $scope.$apply(fn);
                    }
                };



                var getDisplayLocationPrice = function (locationPrice, taxRate) {
                    locationPrice.TaxInclusivePrice = round(locationPrice.RetailPrice + ((locationPrice.RetailPrice * (taxRate || $scope.MasterData.DefaultTaxRate)) / 100));
                    locationPrice.RetailPrice = round((locationPrice.RetailPrice * 100) / 100);
                    locationPrice.CostPrice = round((locationPrice.CostPrice * 100) / 100);
                    locationPrice.BranchName = $scope.MasterData.Branches[locationPrice.BranchNumber];
                    locationPrice.effectiveDate = new Date(parseInt(locationPrice.EffectiveDate.substr(6), 10));

                    locationPrice.OriginalCostPrice = locationPrice.CostPrice;
                    locationPrice.OriginalRetailPrice = locationPrice.RetailPrice;
                    locationPrice.OriginalTaxInclusivePrice = locationPrice.TaxInclusivePrice;
                    locationPrice.OriginalEffectiveDate = locationPrice.EffectiveDate;
                    locationPrice.HasPromotions = locationPrice.PromotionCount > 0;


                    locationPrice.editingBulkEntry = false;

                    if (locationPrice.HasPromotions) {
                        var toolTip = 'There are ' + locationPrice.PromotionCount;
                        toolTip = toolTip + ' Promotion(s) related with this price. Click to see more details';

                        locationPrice.PromotionTooltip = toolTip;
                    }

                    var priceItemDate = moment(locationPrice.EffectiveDate)._d;
                    locationPrice.EffectiveDateInThePast = false;
                    if ((+(new Date())) > (+priceItemDate)) // Check if this date is in the passed
                    {
                        locationPrice.EffectiveDateInThePast = true;
                    }

                    var _jsd = new Date(),
                        tmpMinDate = moment(_jsd.setDate(_jsd.getDate() + 1))._d;
                    locationPrice.dateCreatedOrCurrent = {
                        defaultDate: "+1",
                        minDate: tmpMinDate,
                        dateFormat: "D, d MM, yy",
                        changeMonth: true,
                        changeYear: true
                    };
                };

                var warrantyClicked = function (event, data) {
                    if (data.domEvent.target.tagName === 'A' && data.domEvent.target.classList.contains('refLink')) {
                        if ($el.data('viewPermission') === 'True') {
                            spa.go('/Warranty/Warranties/' + data.element.data('id'));
                            return false;
                        }
                    } else if (data.domEvent.target.tagName === 'DIV' || data.domEvent.target.tagName === 'SPAN') {

                        if (!data.resultItem.expanded && $(data.element).find('.price-info.existing').length === 0) {
                            $scope.WarrantyClickedDetailData = data;
                            getPriceInfo(data);
                        } else {
                            $scope.WarrantyClickedDetailData = null;
                            safeApply(function () {
                                data.resultItem.expanded = !data.resultItem.expanded;
                            });
                        }
                        return false;
                    }
                };

                var getPriceInfo = function (data) {
                    xhr({
                        method: 'GET',
                        url: url.resolve('Warranty/WarrantyPrices/GetPrices/' + data.resultItem.WarrantyId)
                    }).success(function (priceData) {
                        var taxRate = data.resultItem.TaxRate;
                        _.each(priceData, function (locationPrice) {
                            getDisplayLocationPrice(locationPrice, taxRate);
                        });

                        data.resultItem.priceData = priceData;
                        data.resultItem.newLocationPrice = {};
                        data.resultItem.expanded = true;

                        var warrantyScope = $scope.$new();
                        warrantyScope.result = data.resultItem;

                        safeApply(function () {
                            $scope.pricesTemplate(warrantyScope, function (clonedElement, scope) {
                                angular.element('#warrantyPrices-' + scope.result.WarrantyId).html(clonedElement);
                            });
                        });
                    });
                };

                $scope.warrantyHierarchyCrumbs = function () {
                    var tags = [];
                    _.each(this.result, function (value, key) {
                        if (_.str.startsWith(key, 'Level_')) {
                            tags.push(value);
                        }
                    });

                    return tags.join(' > ');
                };

                $scope.retailPriceChanged = function () {
                    var retailPrice = this.locationPrice.RetailPrice * 1; // Convert to numeric value
                    var taxRate = this.result.TaxRate;
                    this.locationPrice.TaxInclusivePrice = round(retailPrice + (retailPrice * taxRate / 100));
                };

                $scope.taxInclusivePriceChanged = function () {
                    var taxInclusivePrice = this.locationPrice.TaxInclusivePrice * 1;
                    var taxRate = this.result.TaxRate;
                    this.locationPrice.RetailPrice = round(taxInclusivePrice / ((100 + taxRate) / 100));
                };

                var isNewPriceStringValueValid = function (price) {
                    return parseFloat(price) >= 0.01;
                };

                var isNewFreePriceStringValueValid = function (price) {
                    return parseFloat(price) >= 0;
                };

                $scope.isCostPriceStringValueValid = function (itemObj, itemValues) {
                    if (itemObj.WarrantyType === 'Free') {
                        return isNewFreePriceStringValueValid(itemValues.CostPrice);
                    } else {
                        return isNewPriceStringValueValid(itemValues.CostPrice);
                    }
                };

                $scope.isRetailPriceStringValueValid = function (itemObj, itemValues) {
                    return itemObj.WarrantyType !== 'Free' && isNewPriceStringValueValid(itemValues.RetailPrice);
                };

                $scope.isTaxInclusivePriceStringValueValid = function (itemObj, itemValues) {
                    return itemObj.WarrantyType !== 'Free' && isNewPriceStringValueValid(itemValues.TaxInclusivePrice);
                };

                $scope.saveLocationPriceChange = function (warranty) {
                    var retailPrice = this.locationPrice.RetailPrice * 1;
                    var costPrice = this.locationPrice.CostPrice * 1;
                    var locationPrice = this.locationPrice;
                    var isFree = this.result.WarrantyType === "Free";
                    var taxRate = warranty.TaxRate;
                    var effectiveDate = this.locationPrice.effectiveDate.toISOString();

                    if (((!retailPrice || retailPrice < 0) || (!costPrice || costPrice < 0)) && !isFree) {
                        return;
                    }

                    xhr({
                        method: 'PUT',
                        url: url.resolve('Warranty/WarrantyPrices/' + this.locationPrice.Id),
                        data: {
                            Id: this.locationPrice.Id,
                            RetailPrice: retailPrice,
                            CostPrice: costPrice,
                            EffectiveDate: effectiveDate
                        }
                    }).success(function (savedLocationPrice) {
                        locationPrice.OriginalCostPrice = savedLocationPrice.CostPrice;
                        locationPrice.OriginalRetailPrice = savedLocationPrice.RetailPrice;
                        locationPrice.OriginalTaxInclusivePrice = round(savedLocationPrice.RetailPrice + (savedLocationPrice.RetailPrice * taxRate / 100));
                        notification.show('Warranty price updated');
                    });
                };

                $scope.cancelLocationPriceChange = function () {
                    this.locationPrice.CostPrice = this.locationPrice.OriginalCostPrice;
                    this.locationPrice.RetailPrice = this.locationPrice.OriginalRetailPrice;
                    this.locationPrice.TaxInclusivePrice = this.locationPrice.OriginalTaxInclusivePrice;
                };

                $scope.deleteBulkEdit = function (bulkEditId, warrantyData) {
                    var deleteConfirmation = $dialog.messageBox('Confirm Bulk Edit Price Delete',
                        'You have chosen to delete the Bulk Edit Price information with id=' + bulkEditId + '. Are you sure you want to do this?', [{
                            label: 'Delete',
                            result: 'yes',
                            cssClass: 'btn-primary'
                        }, {
                            label: 'Cancel',
                            result: 'no'
                        }]);

                    deleteConfirmation.open().then(function (choice) {
                        if (choice === 'yes') {
                            if (warrantyData.resultItem === undefined) {
                                warrantyData.resultItem = { WarrantyId: warrantyData.id };
                            }
                            xhr({
                                method: 'POST',
                                url: url.resolve('Warranty/WarrantyPrices/DeleteBulkEdit'),
                                data: { bulkEditId: bulkEditId }
                            }).success(function (data) {
                                if (data.Result) {
                                    if ($scope.WarrantyClickedDetailData) {
                                        getPriceInfo($scope.WarrantyClickedDetailData);
                                    }
                                    notification.show('Warranty price deleted successfully');
                                } else {
                                    notification.show('Warranty price deletion failed');
                                }
                            });
                        }
                    });
                };

                $scope.deleteLocationPrice = function () {

                    var result = this.result;
                    var id = this.locationPrice.Id;
                    var deleteConfirmation = $dialog.messageBox('Confirm Price Delete',
                        'You have chosen to delete the Price information for Store Type "' + (this.locationPrice.BranchType || 'All') + '", Store Location "' + (this.locationPrice.BranchName || 'All') + '". Are you sure you want to do this?', [{
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
                                url: url.resolve('Warranty/WarrantyPrices/' + id)
                            }).success(function (data) {
                                if (data.Success) {
                                    result.priceData = _.reject(result.priceData, function (locationPrice) {
                                        return locationPrice.Id === id;
                                    });

                                    notification.show('Warranty price deleted');

                                    if (result.priceData) {
                                        if (result.priceData.length === 0) {
                                            result.WarrantyHasPrices = "No";
                                        } else {
                                            result.WarrantyHasPrices = "Yes";
                                        }
                                    } else {
                                        result.WarrantyHasPrices = "No";
                                    }
                                }
                            });
                        }
                    });
                };

                $scope.addNewPrice = function (event) {
                    this.result.addPricing = !this.result.addPricing;
                    event.stopImmediatePropagation();
                    event.preventDefault();
                    return false;
                };

                $scope.newRetailPriceChanged = function () {
                    var retailPrice = this.result.newLocationPrice.RetailPrice * 1; // Convert to numeric value
                    var taxRate = this.result.TaxRate;
                    this.result.newLocationPrice.TaxInclusivePrice = round(retailPrice + (retailPrice * taxRate / 100));
                };

                $scope.newTaxInclusivePriceChanged = function () {
                    var taxInclusivePrice = this.result.newLocationPrice.TaxInclusivePrice * 1;
                    var taxRate = this.result.TaxRate;
                    this.result.newLocationPrice.RetailPrice = round(taxInclusivePrice / ((100 + taxRate) / 100));
                };

                $scope.createNewLocationPrice = function () {
                    var retailPrice = this.result.newLocationPrice.RetailPrice * 1;
                    var costPrice = this.result.newLocationPrice.CostPrice * 1;
                    var taxRate = this.result.TaxRate;
                    var isFree = this.result.WarrantyType === "Free";
                    var result = this.result;
                    var effectiveDate = this.result.newLocationPrice.effectiveDate.toISOString();

                    if (((!retailPrice || retailPrice < 0) || (!costPrice || costPrice < 0)) && !isFree) {
                        return;
                    }

                    xhr({
                        method: 'POST',
                        url: url.resolve('Warranty/WarrantyPrices/'),
                        data: {
                            WarrantyId: this.result.WarrantyId,
                            BranchType: this.result.newLocationPrice.BranchType,
                            BranchNumber: this.result.newLocationPrice.BranchNumber,
                            RetailPrice: retailPrice,
                            CostPrice: costPrice,
                            EffectiveDate: effectiveDate
                        }
                    }).success(function (locationPrice) {
                        if (locationPrice.hasError) {
                            notification.show('Error: ' + locationPrice.message);
                        } else {
                            result.newLocationPrice = {};

                            getDisplayLocationPrice(locationPrice, taxRate);
                            result.priceData.unshift(locationPrice);
                            result.WarrantyHasPrices = "Yes";
                            notification.show('Warranty price added');
                            result.addPricing = false;
                        }
                    });
                };

                $scope.cancelNewLocationPrice = function () {
                    this.result.newLocationPrice = {};
                    this.result.addPricing = false;
                };

                $scope.bulkEditEnabled = function () {
                    return (this.bulkEdit.CostPrice.Amount !== '' && typeof this.bulkEdit.CostPrice.Amount === 'string' && this.bulkEdit.CostPrice.Action !== '') ||
                        (this.bulkEdit.RetailPrice.Amount !== '' && typeof this.bulkEdit.RetailPrice.Amount === 'string' && this.bulkEdit.RetailPrice.Action !== '') ||
                        (this.bulkEdit.TaxInclusivePrice.Amount !== '' && typeof this.bulkEdit.TaxInclusivePrice.Amount === 'string' && this.bulkEdit.TaxInclusivePrice.Action !== '');
                };

                $scope.bulkEditLocationPrice = function () {

                    var confirmBulkEdit = {
                        changes: {},
                        totalResults: $scope.totalResults
                    };

                    var costPriceChange, retailPriceChange, taxInclusivePrice;

                    if (this.bulkEdit.CostPrice.Amount !== '' && typeof this.bulkEdit.CostPrice.Amount === 'string' && this.bulkEdit.CostPrice.Action !== '') {
                        costPriceChange = {
                            OperationDesc: $scope.MasterData.BulkEditActions[this.bulkEdit.CostPrice.Action],
                            Operation: this.bulkEdit.CostPrice.Operation,
                            Amount: this.bulkEdit.CostPrice.Amount,
                            IsPercentage: this.bulkEdit.CostPrice.IsPercentage
                        };
                        confirmBulkEdit.changes['Cost Price'] = costPriceChange;
                    }

                    if (this.bulkEdit.RetailPrice.Amount !== '' && typeof this.bulkEdit.RetailPrice.Amount === 'string' && this.bulkEdit.RetailPrice.Action !== '') {
                        retailPriceChange = {
                            OperationDesc: $scope.MasterData.BulkEditActions[this.bulkEdit.RetailPrice.Action],
                            Operation: this.bulkEdit.RetailPrice.Operation,
                            Amount: this.bulkEdit.RetailPrice.Amount,
                            IsPercentage: this.bulkEdit.RetailPrice.IsPercentage
                        };
                        confirmBulkEdit.changes['Retail Price'] = retailPriceChange;
                        taxInclusivePrice = null;
                    }

                    if (this.bulkEdit.TaxInclusivePrice.Amount !== '' && typeof this.bulkEdit.TaxInclusivePrice.Amount === 'string' && this.bulkEdit.TaxInclusivePrice.Action !== '') {
                        taxInclusivePrice = {
                            OperationDesc: $scope.MasterData.BulkEditActions[this.bulkEdit.TaxInclusivePrice.Action],
                            Operation: this.bulkEdit.TaxInclusivePrice.Operation,
                            Amount: this.bulkEdit.TaxInclusivePrice.Amount,
                            IsPercentage: this.bulkEdit.TaxInclusivePrice.IsPercentage
                        };
                        confirmBulkEdit.changes['Tax Inclusive Price'] = taxInclusivePrice;
                        retailPriceChange = null;
                    }

                    if (confirmBulkEdit.changes['Cost Price'] === undefined && confirmBulkEdit.changes['Retail Price'] === undefined && confirmBulkEdit.changes['Tax Inclusive Price'] === undefined || $scope.bulkEditForm.$invalid) {
                        return;
                    }

                    confirmBulkEdit.effectiveDate = this.bulkEdit.effectiveDate;
                    var effectiveDate = this.bulkEdit.effectiveDate.toISOString();

                    xhr({
                        method: 'POST',
                        url: url.resolve('Warranty/WarrantyPrices/GetBulkEditInfo'),
                        data: {
                            Filter: JSON.stringify($scope.searchParameters),
                            EditRequest: {
                                CostPrice: costPriceChange,
                                RetailPrice: retailPriceChange,
                                TaxInclusivePrice: taxInclusivePrice,
                                EffectiveDate: effectiveDate
                            }
                        }
                    }).success(function (data) {
                        var dataObj = JSON.parse(data.BulkEditInfo);

                        confirmBulkEdit.Records = dataObj;
                        confirmBulkEdit.NumberOfRecords = dataObj.length;

                        var priceChangeConfirmation = $dialog.dialog({
                            templateUrl: url.resolve('/Static/js/warranty/Templates/bulkEditConfirmation.html'),
                            controller: 'BulkEditConfirmController',
                            resolve: {
                                confirmBulkEdit: function () {
                                    return confirmBulkEdit;
                                }
                            }
                        });

                        priceChangeConfirmation.open().then(function (choice) {
                            if (choice === 'yes') {
                                xhr({
                                    method: 'POST',
                                    url: url.resolve('Warranty/WarrantyPrices/BulkEditPrices'),
                                    data: {
                                        Filter: JSON.stringify($scope.searchParameters),
                                        EditRequest: {
                                            CostPrice: costPriceChange,
                                            RetailPrice: retailPriceChange,
                                            TaxInclusivePrice: taxInclusivePrice,
                                            EffectiveDate: effectiveDate
                                        }
                                    }
                                }).success(function (data) {
                                    if (data.Success) {
                                        $scope.bulkEdit.CostPrice = {};
                                        $scope.bulkEdit.RetailPrice = {};
                                        $scope.bulkEdit.TaxInclusivePrice = {};
                                        notification.show('Price changed for all selected warranties');
                                        _.each($scope.displayResults, function (result) {
                                            result.priceData = null;
                                            result.expanded = false;
                                        });
                                    }
                                });
                            }
                        });
                    });
                };

                $scope.cancelBulkEditLocationPrice = function () {
                    $scope.bulkEdit = {
                        CostPrice: {},
                        RetailPrice: {},
                        TaxInclusivePrice: {}
                    };
                };

                $scope.operationChanged = function (price) {
                    if (price.Action.indexOf('%') !== -1) {
                        price.IsPercentage = true;
                        price.Operation = price.Action.substring(0, 1);
                    } else {
                        price.IsPercentage = false;
                        price.Operation = price.Action;
                    }
                };

                $scope.resetBulkPrices = function (priceObj) {
                    priceObj.Action = null;
                    priceObj.Operation = null;
                    priceObj.Amount = null;
                };

                $scope.$on('facetsearch:result:expandableToggle:click', warrantyClicked);

                $scope.bulkPriceChanged = function () {
                    if ($scope.bulkEdit.CostPrice.Amount || $scope.bulkEdit.RetailPrice.Amount || $scope.bulkEdit.TaxInclusivePrice.Amount) {
                        $scope.priceBulkEdit = true;
                    } else {
                        $scope.priceBulkEdit = false;
                    }
                };

                $scope.isBulkEdit = function (locationPrice) {
                    return locationPrice.BulkEditId && locationPrice.BulkEditId > 0;
                };

                $scope.editBulkEntry = function (locationPrice) {
                    if (!locationPrice.editingBulkEntry) {
                        locationPrice.editingBulkEntry = false; // TODO: Bulk Edit Implementation
                    } else if (locationPrice.editingBulkEntry) {
                        locationPrice.editingBulkEntry = false;
                    }
                };
            };

            searchController.$inject = ['$scope', '$timeout', '$dialog', 'xhr', '$compile'];

            app().controller('FacetController', facetController)
                .directive('facetsearch', facetDirective)
                .controller('SearchController', searchController)
                .controller('BulkEditConfirmController', ['$scope', 'dialog', 'confirmBulkEdit', function ($scope, dialog, confirmBulkEdit) {
                    $scope.confirmBulkEdit = confirmBulkEdit;

                    $scope.close = function (e, result) {
                        e.preventDefault();
                        dialog.close(result);
                    };
                } ]);

            return angular.bootstrap($el, ['myApp']);
        }
    };
});