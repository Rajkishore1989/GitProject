define([
        'underscore',
        'jquery',
        'moment'
],
    function (_, $, moment) {
        'use strict';

        var taxHelper = function ($http, $q, taxRateResourceProvider) {
            var that = this;
            var tax = localStorage.Tax ? JSON.parse(localStorage.Tax) : {};
            var systemTaxRates = [];
            
            function newDate() {
                return new Date().setHours(0, 0, 0, 0);
            }

            function taxExists() {
                return !(tax === null || tax === undefined || $.isEmptyObject(tax) || tax.date !== newDate());
            }

            function getAllTaxRates() {
                var defer = $q.defer();
                if (!systemTaxRates || systemTaxRates.length === 0) {
                    taxRateResourceProvider.getAll().then(function (rates) {
                        systemTaxRates = rates;
                        defer.resolve(systemTaxRates);
                    });
                } else {
                    defer.resolve(systemTaxRates);
                }
                return defer.promise;
            }

            function getEffectiveTaxRate(rates, priceEffectiveDate) {
                var sortedRates = _.sortBy(rates, function (rate) { return rate.effectiveDate; });
                return _.chain(sortedRates)
                    .filter(function (taxRate) {
                        var adjustedEffectiveDate = moment(taxRate.effectiveDate).toDate();
                        return (adjustedEffectiveDate <= priceEffectiveDate);
                    })
                    .toArray()
                    .last()
                    .value();
            }

            function refreshTaxRate() {
                var defer = $q.defer();
                taxRateResourceProvider.getTaxSettings().then(
                    function (result) {
                        if (typeof result === 'undefined' || result === null) {
                            window.console.log('Tax rate not set.');
                            result = { currentTaxRate: 0, taxSetting: false };
                        }
                        result.date = newDate();
                        localStorage.Tax = JSON.stringify(result);
                        defer.resolve(result);
                    },
                    function (result) {
                        window.console.log('There was a problem loading the current tax rate.');
                        defer.reject(result);
                    });
                return defer.promise;
            }

            function getCurrentTaxRate() {
                var defer = $q.defer();

                // Check if tax object doesn't exist or if date has changed since last store
                if (!taxExists()) {
                    defer.resolve(refreshTaxRate());
                } else {
                    defer.resolve(tax);
                }
                return defer.promise;
            }

            if (!taxExists()) {
                refreshTaxRate();
            }
            
            that.getCurrentTaxRate = getCurrentTaxRate;
            that.refreshTaxRate = refreshTaxRate;
            that.getAllTaxRates = getAllTaxRates;
            that.getEffectiveTaxRate = getEffectiveTaxRate;
        };

        return taxHelper;
    });

