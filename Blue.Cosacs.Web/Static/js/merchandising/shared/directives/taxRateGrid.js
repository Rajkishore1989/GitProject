define(['angular', 'url', 'underscore', 'moment', 'jquery'],
function (angular, url, _, moment, $) {
    'use strict';
    return function(pageHelper, taxRateResourceProvider, taxHelper) {
        return {
            restrict: 'E',
            scope: {
                taxRates: '=',
                productId: '='
            },
            templateUrl: url.resolve('/Static/js/merchandising/shared/templates/taxRateGrid.html'),
            link: function(scope, element, attrs) {
                scope.newRate = { id: 0, productId: scope.productId, name: '', rate: '', effectiveDate: moment.utc() };
                scope.editing = false;
                scope.dateFormat = pageHelper.dateFormat;

                scope.add = function(rate, form) {
                    if (form.$invalid) {
                        return;
                    }

                    var exists = _.findWhere(scope.taxRates, { name: rate.name });

                    if (!exists) {
                        return taxRateResourceProvider
                            .save(rate)
                            .then(function (response) {
                                scope.editing = false;
                                scope.newRate = { id: 0, productId: scope.productId };

                                // Remove rates that are no longer required;
                                var newDate = new Date(response.effectiveDate).setHours(0, 0, 0, 0);
                                var today = new Date().setHours(0, 0, 0, 0);
                                if (newDate <= today) {
                                    scope.taxRates = _.filter(scope.taxRates, function(rate) {
                                        var itemDate = new Date(rate.effectiveDate).setHours(0, 0, 0, 0);
                                        return itemDate >= today || itemDate > newDate;
                                    });
                                }
                                scope.taxRates.push(response);

                                taxHelper.refreshTaxRate();
                                pageHelper.notification.show('Tax rate saved successfully');

                            }, function(response) {
                                pageHelper.notification.show(response.message);
                            });
                    } else {
                        pageHelper.notification.showPersistent('Tax rate name already exists');
                    }

                    return null;
                };

                scope.remove = function (rate) {
                    return taxRateResourceProvider
                        .remove(rate)
                        .then(function (response) {
                            pageHelper.notification.show('Tax rate deleted successfully');
                            var index = _.indexOf(scope.taxRates, _.find(scope.taxRates, function (item) {
                                return item.id === rate.id;
                            }));
                            scope.taxRates.splice(index, 1);

                        }, function (response) {
                            pageHelper.notification.showPersistent(response.message);
                        });
                };

                scope.edit = function () {
                    scope.editing = true;
                    scope.newRate = { id: 0, productId: scope.productId, name: '', rate: '', effectiveDate: new Date() };
                    $('.effectiveDate', element).datepicker('option', 'minDate', new Date());
                };

                scope.cancel = function () {
                    scope.editing = false;
                };

                scope.isInPast = function (dateStr) {
                    if (typeof dateStr !== 'undefined' && dateStr !== null) {
                        var dateObj = moment(moment.utc(dateStr).format('YYYY-MM-DD')).toDate();
                        return dateObj <= new Date().setHours(0,0,0,0);
                    }
                    return true;
                };

                scope.tomorrow = function() {
                    var tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    return tomorrow.toJSON().split('T')[0];
                };

                scope.$watch('taxRates', function (rates) {
                    var pastRates = _.filter(rates, function (rate) { return scope.isInPast(rate.effectiveDate); });
                    var sortedRates = _.sortBy(pastRates, function (rate) { return rate.effectiveDate; });
                    scope.currentRate = sortedRates[sortedRates.length - 1];
                }, true);
            }
        };
    };
});