define([
        'underscore',
        'jquery',
        'jquery.pickList',
        'notification',
        'localisation',
        'moment'
    ],
    function (_, $, picklist, notification, localisationProvider, moment) {
        'use strict';

        return function ($q) {
            var that = this,
                localisation,
                localisationData = localStorage.Localisation ? JSON.parse(localStorage.Localisation) : {},
                configurationJson = localStorage.config,
                configuration = configurationJson ? JSON.parse(configurationJson) : {},
                loader = $('.navbar span#loader');

            function mapDateFormat(angularDateFormat) {
                return angularDateFormat
                    .replace(/EEEE/, 'DD')
                    .replace(/EEE/, 'D')
                    .replace(/MMMM/, 'XXXX')
                    .replace(/MMM/, 'XXX')
                    .replace(/MM/, 'mm')
                    .replace(/M/, 'm')
                    .replace(/XXXX/, 'MM')
                    .replace(/XXX/, 'M')
                    .replace(/yyyy/, 'XXXX')
                    .replace(/yy/, 'y')
                    .replace(/XXXX/, 'yy');
            }

            function initLocalData() {
                localisation = {
                    priceRounding: localisationData.priceRounding || [],
                    dateFormat: localisationData.dateFormat || 'd MMMM yyyy',
                    localCurrency: localisationData.localCurrency || '',
                    currencySymbol: localisationData.CurrencySymbol || '$',
                    decimalPlaces: localisationData.DecimalPlaces >= 0 ? localisationData.DecimalPlaces : '2'
                };

                that.dateFormat.dateFormat = mapDateFormat(localisation.dateFormat);
            }

            function initialise() {
                if (!localisationData || !localisationData.dateFormat || !localisationData.priceRounding || !localisationData.localCurrency) {
                    localisationProvider.fetchLocalisationSettings().then(function () {
                        localisationData = localStorage.Localisation ? JSON.parse(localStorage.Localisation) : {};
                        initLocalData();
                    });
                } else {
                    initLocalData();
                }
            }


            that.getSettings = function (sources, callback) {
                var model = {},
                    propertyName;

                picklist.loadAll(sources, function () {
                    _.each(sources, function (source) {
                        picklist.populate(source, function (options) {
                            propertyName = _.last(source.split('.'));
                            propertyName = propertyName.charAt(0).toLowerCase() + propertyName.substr(1);
                            model[propertyName] = _.map(options, function (value) {
                                return value;
                            });
                        });
                    });
                    callback(model);
                });
            };

            that.dateFormat = {
                dateFormat: 'd MMMM yyyy',
                changeMonth: true,
                changeYear: true
            };

            that.setTitle = function (title) {
                document.title = title;
                $('h2#page-heading').text(title);
            };

            that.loading = function (isLoading) {
                if (isLoading) {
                    loader.show();
                } else {
                    loader.hide();
                }
            };

            that.partition = function (input, size) {
                var newArr = [];
                for (var i = 0; i < input.length; i += size) {
                    newArr.push(input.slice(i, i + size));
                }
                return newArr;
            };

            that.notification = notification;

            that.isMaster = configuration.isMaster;

            function setCaretPosition(elem, caretPos) {
                elem = elem[0];
                if (elem !== null) {
                    if (elem.createTextRange) {
                        var range = elem.createTextRange();
                        range.move('character', caretPos);
                        range.select();
                    }
                    else {
                        if (typeof elem.selectionStart !== 'undefined') {
                            elem.focus();
                            elem.setSelectionRange(caretPos, caretPos);
                        }
                        else
                            elem.focus();
                    }
                }
            }

            function getCaretPosition(elem) {
                var range,
                    pos = 0;
                elem = elem[0];
                if (document.selection) {
                    elem.focus();
                    range = document.selection.createRange();
                    range.moveStart('character', -elem.value.length);
                    pos = range.text.length;
                }
                else if (typeof elem.selectionStart === 'number') {
                    pos = elem.selectionStart;
                }
                return pos;
            }

            function round(num, precision) {
                var exp = Math.pow(10, precision);
                return Math.round((num || 0) * exp) / exp;
            }

            function floor(num, precision) {
                var exp = Math.pow(100, precision);
                return Math.floor((num || 0) * exp) / exp;
            }

            function paddedFloorLocal(num) {
                return floor(num, localisation.decimalPlaces).toFixed(localisation.decimalPlaces);
            }

            function roundLocal(num) {
                return round(num, localisation.decimalPlaces).toFixed(localisation.decimalPlaces);
            }

            function roundPromoPrice(price, originalPrice) {
                var priceStr,
                    replaceStr,
                    promoPrice,
                    roundTo,
                    roundValues,
                    originalPriceStr = originalPrice.toString();

                // strip decimals
                price = Math.round(price);
                priceStr = price.toString();

                // only use round values that are lower than the original price
                roundValues = _.filter(localisation.priceRounding, function (r) {
                    return r <= originalPrice;
                });

                // try to find the lowest round value above the discounted price
                roundTo = _.chain(roundValues)
                    .filter(function (r) {
                        var digits = r.toString().length;
                        return r >= Number.parseInt(priceStr.substr(priceStr.length - digits, digits));
                    })
                    .min()
                    .value();

                // if not found, try to find the highest round value lower than the discount
                // min() returns Inifity when applied to an empty set. thx javascript. so helpful!
                if (!isFinite(roundTo)) {
                    roundTo = _.chain(roundValues)
                        .filter(function (r) {
                            var digits = r.toString().length;
                            return r <= Number.parseInt(originalPriceStr.substr(originalPriceStr.length - digits, digits));
                        })
                        .max()
                        .value();
                }

                // if no rounding point found return the discounted price
                if (!isFinite(roundTo)) {
                    return round(price, localisation.decimalPlaces);
                }

                replaceStr = roundTo.toString();

                promoPrice = priceStr.substr(0, priceStr.length - replaceStr.length);
                promoPrice += replaceStr;

                return Number.parseInt(promoPrice);
            }

            function coallesceNumbers() {
                var i, n = null;
                for (i = 0; i < arguments.length; i++) {
                    n = arguments[i];
                    if (n || n === 0) {
                        break;
                    }
                }
                return n;
            }



            initialise();

            that.setCaretPosition = setCaretPosition;
            that.getCaretPosition = getCaretPosition;
            that.localisation = localisation;
            that.round = round;
            that.floor = floor;
            that.paddedFloorLocal = paddedFloorLocal;
            that.roundLocal = roundLocal;
            that.roundPromoPrice = roundPromoPrice;
            that.coallesceNumbers = coallesceNumbers;
        };
    });