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

    return function (user, pageHelper, taxHelper) {
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
            templateUrl: url.resolve('/Static/js/merchandising/product/templates/promotionalPricing.html'),
            link: function (scope) {

                scope.tax = {};

                taxHelper.getCurrentTaxRate().then(function (tax) {
                    scope.tax = tax;
                });

                function margin(price) {
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
            
                function rawDate(date) {
                    return moment(moment.utc(date).format('DD-MMM-YYYY')).toDate();
                }

                function promotionActive(date) {
                    return moment.utc(date).diff(moment()) > 0;
                }

                //Watch tax rates
                scope.$watch('taxRates', function (rates) {
                   
                    var sortedRates = _.sortBy(rates, function (rate) { return rate.effectiveDate; });

                    taxHelper.getCurrentTaxRate().then(function(rate) {
                        scope.taxRate = rate.currentTaxRate;
                        _.each(scope.retailPrices, function(price, index) {
                            var r = _.chain(sortedRates)
                                .filter(function (rate) {
                                    return (moment(rate.effectiveDate).isBefore(moment(scope.retailPrices[index].effectiveDate)) ||
                                    moment(rate.effectiveDate).isSame(moment(scope.retailPrices[index].effectiveDate), 'day'));
                                })
                                .toArray()
                                .last()
                                .value();

                            if (r !== null && r !== undefined && !$.isEmptyObject(r)) {
                                price.taxRate = r.rate;
                            } else {
                                price.taxRate = scope.taxRate;
                            }
                        });
                    });
                }, true);

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
                scope.margin = margin;
                scope.addTax = addTax;
                scope.calculateInclusive = calculateInclusive;
                scope.calculateExclusive = calculateExclusive;
                scope.sortDate = sortDate;
                scope.generateUrl = generateUrl;
                scope.rawDate = rawDate;
                scope.promotionActive = promotionActive;
                _.each(scope.retailPrices, sortDate);
            }
        };
    };
});