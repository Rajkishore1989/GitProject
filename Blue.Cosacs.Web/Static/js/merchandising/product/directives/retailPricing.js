define([
         'jquery',
        'angular',
        'underscore',
        'url',
        'notification',
        'moment',
        'datepicker'
        
],
function ($,angular,_ ,url, notification, moment) {
    'use strict';

    var settingsSources = ['Blue.Cosacs.Merchandising.Fascia'];

    return function (user, pageHelper, taxHelper, $timeout, retailPriceProvider, $dialog, $filter, productResourceProvider, $rootScope) {
        return {
            restrict: 'E',
            scope: {
                product: '=',
                retailPrices: '=',
                locations: '=',
                productType: '=',
                averageWeightedCost: '=',
                taxRates: '='
            },
            templateUrl: url.resolve('/Static/js/merchandising/product/templates/retailPricing.html'),
            link: function (scope, element, attrs) {

                scope.tax = {};

                taxHelper.getCurrentTaxRate().then(function (tax) {
                    scope.tax = tax;
                });

                var saving = false;

                function resetNewPrice() {
                    scope.newPrice = {
                        id: null,
                        productId: scope.product.id,
                        location: null,
                        locationId: null,
                        effectiveDate: null,
                        taxRate: null,
                        regularPrice: 0,
                        cashPrice: 0,
                        dutyFreePrice: 0
                    };
                }

                resetNewPrice();

                function add() {
                    scope.editMode = true;
                    resetNewPrice();

                    $timeout(function() {
                        // current jqueryui datepicker directive doesnt support setting mindate
                        $('.effectiveDate', element).datepicker('option', 'minDate', new Date());
                    }, 0);
                }

                function cancel() {
                    scope.editMode = false;
                }

                function margin(price, rate) {
                    return 1 - (scope.averageWeightedCost / price);
                }

                function calculateInclusive(price, rate) {
                    return price * (1 + rate);
                }

                function calculateExclusive(price, rate) {
                    return price / (1 + rate);
                }

                function addTax(price) {
                    var inclusive = scope.tax.taxSetting;
                    return inclusive ? price * (1 + scope.taxRate) : price;
                }

                scope.updateInclusiveCashPrice = function() {
                    scope.cashPriceInclusive = calculateInclusive(scope.newPrice.cashPrice, scope.newPrice.taxRate);
                };

                scope.updateExclusiveCashPrice = function () {
                    scope.newPrice.cashPrice = calculateExclusive(scope.cashPriceInclusive, scope.newPrice.taxRate);
                };

                scope.updateInclusiveRegularPrice = function() {
                    scope.regularPriceInclusive = calculateInclusive(scope.newPrice.regularPrice, scope.newPrice.taxRate);
                };

                scope.updateExclusiveRegularPrice = function() {
                    scope.newPrice.regularPrice = calculateExclusive(scope.regularPriceInclusive, scope.newPrice.taxRate);
                };

                scope.updateInclusiveDutyFreePrice = function () {
                    scope.dutyFreePriceInclusive = calculateInclusive(scope.newPrice.dutyFreePrice, scope.newPrice.taxRate);
                };

                scope.updateExclusiveDutyFreePrice = function () {
                    scope.newPrice.dutyFreePrice = calculateExclusive(scope.dutyFreePriceInclusive, scope.newPrice.taxRate);
                };

                // Update tax with product tax rate or fall back to system tax rate
                function updateTaxForPrice(rates, price) {
                    var priceEffective = moment(moment(price.effectiveDate).utc().format('YYYY-MM-DD')).toDate();
                    if (priceEffective < new Date()) {
                        priceEffective = new Date();
                    }
                    var productTaxRate = taxHelper.getEffectiveTaxRate(rates, priceEffective);
                    if (productTaxRate && !$.isEmptyObject(productTaxRate)) {
                        price.taxRate = productTaxRate.rate;
                    } else {
                        taxHelper.getAllTaxRates().then(function(systemRates) {
                            var systemRate = taxHelper.getEffectiveTaxRate(systemRates, priceEffective);
                            if (systemRate && !$.isEmptyObject(systemRate)) {
                                price.taxRate = systemRate.rate;
                            } else {
                                price.taxRate = 0;
                            }
                        });
                    }
                }

                //Watch EffectiveDate
                scope.$watch('newPrice.effectiveDate', function () {
                    updateTaxForPrice(scope.taxRates, scope.newPrice);
                }); 

                //Watch tax rates
                scope.$watch('taxRates', function (rates) {
                    _.each(scope.retailPrices, function (price) {
                        updateTaxForPrice(rates, price);
                    });
                }, true);

                function create() {
                    retailPriceProvider.create(scope.newPrice).then(function (data) {
                        scope.newPrice.id = data.id;
                        pageHelper.notification.show('Retail price saved successfully.');
                        sortDate(scope.newPrice);
                        scope.retailPrices.push(scope.newPrice);
                        updateLocation(scope.newPrice);
                        $rootScope.$broadcast("productUpdated");
                        scope.editMode = false;
                        productResourceProvider.getProductStatusUpdate(scope.product.id).then(function (result) {
                            scope.product.status = result.status;
                        });
                    }, function (result) {
                        pageHelper.notification.showPersistent(result.message);
                        saving = false;
                    });
                }

                function remove(price) {

                    if (!price.id || price.id === 0) {
                        scope.editMode = false;
                        scope.retailPrices = _.without(scope.retailPrices, price);
                        return;
                    }

                    var deleteConfirmation = $dialog.messageBox('Confirm delete retail price',
                        'Are you sure you wish to delete the retail price for the ' + $filter('date')(price.effectiveDate, 'd MMMM yyyy') + '?', [
                            {
                                label: 'Delete',
                                result: 'yes',
                                cssClass: 'btn-primary'
                            }, {
                                label: 'Cancel',
                                result: 'no'
                            }
                        ]);

                    deleteConfirmation.open().then(function (msgResult) {
                        if (msgResult === 'yes') {
                            retailPriceProvider.remove(price).then(function () {
                                pageHelper.notification.show("Retail Price deleted successsfully");
                                scope.retailPrices = _.without(scope.retailPrices, price);
                                scope.editMode = false;
                                $rootScope.$broadcast("productUpdated");
                            }, function (result) {
                                if (result.message) {
                                    pageHelper.notification.showPersistent(result.message);
                                }
                                scope.editMode = false;
                            });
                        }
                    });
                }

                function updateLocation(price) {
                    price.location = scope.locations[price.locationId];
                }

                function isInPast (dateStr) {
                    if (typeof dateStr !== 'undefined' && dateStr !== null) {
                        var dateObj = moment(moment.utc(dateStr).format('YYYY-MM-DD')).toDate();
                        return dateObj <= new Date().setHours(0, 0, 0, 0);
                    }
                    return true;
                }

                function canDelete(price) {
                    return !isInPast(price.effectiveDate) && scope.canEdit && scope.productType !== "RepossessedStock";
                }

                function sortDate(retailPrice) {
                    if (retailPrice.effectiveDate)
                        retailPrice.sortDate = new Date(retailPrice.effectiveDate);
                    else {
                        retailPrice.sortDate = new Date(8640000000000000);
                    }
                }

                function generateUrl(link) {
                    return url.resolve(link);
                }
               
                scope.dateFormat = pageHelper.dateFormat;
                pageHelper.getSettings(settingsSources, function (options) {
                    scope.options = options;
                    scope.$apply();
                });
                scope.create = create;
                scope.remove = remove;
                scope.canDelete = canDelete;
                scope.margin = margin;
                scope.calculateInclusive = calculateInclusive;
                scope.calculateExclusive = calculateExclusive;
                scope.cancel = cancel;
                scope.updateLocation = updateLocation;
                scope.add = add;
                scope.editMode = false;
                scope.sortDate = sortDate;
                scope.generateUrl = generateUrl;
                scope.canView = user.hasPermission("RetailPriceView");
                scope.canEdit = user.hasPermission("RetailPriceEdit");
              
                _.each(scope.retailPrices, sortDate);
            }
        };
    };
});