define([
    'angular',
    'underscore',
    'url',
    'moment',
    'lib/select2',
    'jquery',
    'datepicker'
],
    function (angular, _, url, moment) {
        'use strict';
        var settingsSources = ['Blue.Cosacs.Merchandising.Fascia'];

        return function ($scope, $location, pageHelper, taxHelper, user, promotionsResourceProvider, $timeout, productResourceProvider) {
            $scope.product = {};
            $scope.tax = {};
            $scope.valueOff = {};
            $scope.setPrice = {};
            $scope.discountPercentage = {};
            $scope.itemMode = '';
            $scope.dateFormat = pageHelper.dateFormat;
            $scope.promotionHasStarted = false;
            $scope.promotionHasEnded = false;
            $scope.promotiontimeHasStarted = false;
            $scope.promotionTimeHasEnded = false;
            //Change for ZEN/UNC/CRF/CR2018-011 Pricing Promotion - Happy Hour
            
            $scope.today = moment().format('YYYY-MM-DD');
            $scope.todaytime = moment().format('hh:mm');

            var loaded = false;

            pageHelper.getSettings(settingsSources, function (options) {
                $scope.options = options;
                $scope.$apply();
            });

            taxHelper.getCurrentTaxRate().then(function (tax) {
                $scope.tax = tax;
            });

            $scope.updateValidEndDate = function (startDate) {
                if(moment($scope.endDate).isBefore(moment($scope.startDate))){
                    $scope.endDate = $scope.startDate;
                }            
            };
           
            function convertDate(source) {
                 //Change for ZEN/UNC/CRF/CR2018-011 Pricing Promotion - Happy Hour
                $scope.startDate = source.startDate ? moment(source.startDate).format('YYYY-MM-DD') : null;
                $scope.endDate = source.endDate ? moment(source.endDate).format('YYYY-MM-DD') : null;
                $scope.startTime = source.startDate ? moment(source.startDate).format('HH:mm') : null;
                $scope.endTime = source.endDate ? moment(source.endDate).format('HH:mm') : null;

                if ($scope.startTime != null && $scope.endTime != null) {
                    $("#chkhideshow").prop("checked", true);
                    
                    $('#hasallow').show();

                }

                
            }

            function checkPromoStatus() {
                //Change for ZEN/UNC/CRF/CR2018-011 Pricing Promotion - Happy Hour
                if ($scope.vm.promotion.startDate && $scope.vm.promotion.endDate) {
                    var now = new Date();
                    $scope.promotionHasStarted = new Date($scope.vm.promotion.startDate) < now;
                    $scope.promotionHasEnded = new Date($scope.vm.promotion.endDate) < now;
                    $scope.promotiontimeHasStarted = $scope.vm.promotion.startTime < now.getTime;
                    $scope.promotiontimeHasEnded = $scope.vm.promotion.endTime < now.getTime
                    if ($scope.promotiontimeHasStarted)
                    {
                        $(StartTime).hide();
                        $(startp).show();
                    }

                    if ($scope.promotiontimeHasEnded) {
                        $(EndTime).hide();
                        $(endp).show();
                    }
                }
            }

           

            $scope.$watch('vm', function() {
                if (typeof $scope.vm !== 'undefined' && !loaded) {
                   
                  
                    loaded = true;
                    $scope.hierarchy = $scope.vm.hierarchy || {};
                    $scope.hierarchyOptions = $scope.vm.hierarchyOptions || [];
                    convertDate($scope.vm.promotion, $scope);
                    checkPromoStatus();
                   // addstartendtime();
                    if (_.any($scope.vm.promotion.details, function(detail) {
                        return detail.hierarchies && detail.hierarchies.length > 0;
                    })) {
                        $scope.itemMode = 'hierarchy';
                    } else {
                        $scope.itemMode = 'sku';
                    }

                }
            }, true);

            function resetForm() {
                $scope.hierarchy = {};
                $scope.setPrice = {};
                $scope.product = {};
                $scope.valueOff = {};
                $scope.discountPercentage = {};
            }

            $scope.generateUrl = function (link) {
                return url.resolve(link);
            };

            $scope.clearDetails = function () {
                $scope.vm.promotion.details = [];
                resetForm();
            };

            //$scope.getdetails = function () {
            //    debugger
            //    alert(1);
            //    if ($scope.chkselct == true)

            //        $scope.result = true;

            //    else

            //        $scope.result = false;

            //}
            //$scope.hasallow = true;

            //$scope.ShowHide = function () {
            //    debugger
            //    alert(1);
            //    if (true) {
            //        $scope.hasallow = true;

            //    }
               
            //};

            $scope.appliesTo = function (data, value) {
                for (var prop in data) {
                    if (data.hasOwnProperty(prop)) {
                        delete data[prop];
                    }
                }

                $scope.itemMode = value;

                $scope.clearDetails();
            };

            $scope.addHierarchy = function(hierarchyDetails) {
                var mappedHierarchy = [];
                _.each($scope.hierarchy, function(value, property) {
                    if (value && value.length > 1) {
                        mappedHierarchy.push({
                            levelName: property,
                            tagName: value
                        });
                    }
                });

                $scope.vm.promotion.details.push({
                    id: null,
                    priceTypeName: priceType(hierarchyDetails.priceType),
                    priceType: hierarchyDetails.priceType,
                    valueDiscount: removeTax(hierarchyDetails.valueDiscount, null),
                    percentDiscount: hierarchyDetails.percentage,
                    hierarchies: mappedHierarchy
                });

                resetForm();
            };

            function getPrice(value, prices) {
                switch (parseInt(value, 10)) {
                    case 1:
                        return prices.regularPrice;
                    case 2:
                        return prices.cashPrice;
                    case 3:
                        return prices.dutyFreePrice;
                }
                return 0;
            }

            $scope.addProduct = function(productDetails) {
                var productPrice;
                var averageWeightedCost;
                var taxRate;

                productResourceProvider.get(productDetails.product.productId, $scope.vm.promotion.locationId, $scope.vm.promotion.fascia, $scope.startDate).then(function(result) {
                    productPrice = getPrice(productDetails.priceType, result);
                    taxRate = result.taxRate;
                    averageWeightedCost = result.averageWeightedCost;

                    $scope.vm.promotion.details.push({
                        id: null,
                        productId: productDetails.product.productId,
                        sku: productDetails.product.id,
                        name: productDetails.product.text,
                        originalPrice: productPrice,
                        averageWeightedCost: averageWeightedCost,
                        priceTypeName: priceType(productDetails.priceType),
                        priceType: productDetails.priceType,
                        setPrice: removeTax(productDetails.setPrice, taxRate),
                        valueDiscount: removeTax(productDetails.valueDiscount, taxRate),
                        percentDiscount: productDetails.percentage,
                        taxRate: taxRate
                    });

                    resetForm();

                }, function(result) {
                    if (result.message) {
                        pageHelper.notification.showPersistent(result.message);
                    }
                });
            };

            $scope.taxSetting = function() {
                return $scope.tax.taxSetting ? 'inclusive' : 'exclusive';
            };

            function addTax(price, rate) {
                var inclusive = $scope.tax.taxSetting;
                if (isUndefined(rate)) {
                    rate = $scope.tax.currentTaxRate;
                }
                if (!isUndefined(price)) {
                    return inclusive ? price * (1 + rate) : price;
                } 
            }
            $scope.addTax = addTax;

            function removeTax(price, rate) {
                var inclusive = $scope.tax.taxSetting;
                if (isUndefined(rate)) {
                    rate = $scope.tax.currentTaxRate;
                }
                if (!isUndefined(price)) {
                    return inclusive ? price / (1 + rate) : price;
                }
            }
            $scope.removeTax = removeTax;

            function priceType(value) {
                switch (parseInt(value,10)) {
                    case 1:
                        return 'Regular';
                    case 2:
                        return 'Cash';
                    case 3:
                        return 'Duty Free';
                }
                return '';
            }

            function isUndefined(object) {
                return object === undefined || object === 'undefined' || object === null;
            }

            $scope.margin = function (price, detail) {
                if (!price) { // no price no margin
                    return null;
                }

                if (price > 0 && detail.averageWeightedCost === 0) {// 100 % as no awc.
                    return 1;
                }

                if (price === 0) {// Avoid div by 0 and set to 0. -- Leona 4/3/16
                    return 0;
                }
                return (price - detail.averageWeightedCost) / price;
            };

            $scope.save = function () {
                 //Change for ZEN/UNC/CRF/CR2018-011 Pricing Promotion - Happy Hour
                var StartTimecom = $scope.startDate + 'T' + $scope.startTime;
                var combinedStartTime = new Date(StartTimecom);
                var EndTimecom = $scope.endDate + 'T' + $scope.endTime;
                var combinedEndTime = new Date(EndTimecom);
               
                var exists = $scope.vm.promotion.id;
                $scope.vm.promotion.startDate = combinedStartTime;
                $scope.vm.promotion.endDate = combinedEndTime
               
                promotionsResourceProvider.save($scope.vm.promotion).then(function(result) {
                    $scope.vm.promotion = result;
                    checkPromoStatus();
                    pageHelper.notification.show("Promotion saved successfully");
                    if (!exists) {
                        pageHelper.setTitle(result.name + ' Promotion');
                        $location.path($scope.routes.route + '/' + result.id);
                    }
                }, function(result) {
                    if (result.message) {
                        pageHelper.notification.showPersistent(result.message);
                    } else {
                        pageHelper.notification.showPersistent("Error saving promotion");
                    }
                });
            };

            $scope.removeItem = function (item) {
                if ($scope.vm.promotion.details.length > 1) {
                    $scope.vm.promotion.details = _.without($scope.vm.promotion.details, item);
                    $scope.updateProductValidity($scope.vm.promotion.type);
                }
                else {
                    pageHelper.notification.showPersistent("Promotion must have at least one item");
                }
            };

            $scope.hasPermission = user.hasPermission("PromotionEdit");

            $scope.canEdit = function () {
                return $scope.hasPermission && !$scope.promotionHasEnded;
            };

             //Change for ZEN/UNC/CRF/CR2018-011 Pricing Promotion - Happy Hour
            $scope.canEditTime = function () {
                
                return !$scope.promotionTimeHasEnded;
            };

             //Change for ZEN/UNC/CRF/CR2018-011 Pricing Promotion - Happy Hour
            $scope.canEditEndDate = function () {
                   return $scope.canEdit() && ($scope.endDate != $scope.today);
            };

            $scope.canEditEndTime = function () {
                
                return $scope.canEditTime() && ($scope.endTime >= $scope.todaytime);
            };

            $scope.canEditLockableField = function () {
                return $scope.canEdit() && !$scope.promotionHasStarted && !($scope.vm && $scope.vm.products && $scope.vm.products.length > 0);
            };

            $scope.canEditTimeLockableField = function () {
                
                return $scope.canEditTime() && !$scope.promotionTimeHasStarted && !($scope.vm && $scope.vm.products && $scope.vm.products.length > 0);
            };


            function promoPrice(item) {
                if (item.percentDiscount && item.originalPrice) {
                    var price = addTax(item.originalPrice, item.taxRate);
                    var discountedPrice = price - (price * item.percentDiscount);
                    return pageHelper.roundPromoPrice(discountedPrice, price);
                    }
                return 0;
            }
            $scope.promoPrice = promoPrice;

            $scope.updateProductValidity = function (type) {

                var obj = {};
                switch (parseInt(type,10)) {
                    case 1:
                        obj = $scope.setPrice;
                        break;
                    case 2:
                        obj = $scope.valueOff;
                        break;
                    case 3:
                        obj = $scope.discountPercentage;
                        break;
                }

                if (!obj.product) {
                    obj.canAdd = false;
                    return;
                }

                if (!obj.priceType) {
                    obj.canAdd = false;
                    return;
                }

                var exists = _.findWhere($scope.vm.promotion.details, { productId: obj.product.productId, priceType: obj.priceType });
                obj.canAdd = !exists;
            };

            $scope.updateHierarchyValidity = function (type) {
                var obj = {};
                switch (parseInt(type,10)) {
                    case 2:
                        obj = $scope.valueOff;
                        break;
                    case 3:
                        obj = $scope.discountPercentage;
                        break;
                }

                if (!obj.priceType) {
                    obj.canAdd = false;
                    return;
                }

                var validHierarchy =_.any($scope.hierarchy, function(value) {
                    return value && value.length > 0;
                });

                obj.canAdd = validHierarchy;
            };

            $scope.productSearchSetup = function () {
            
                return {
                    placeholder: "Enter a product",
                    width: '100%',
                    minimumInputLength: 2,
                    ajax: {
                        url: url.resolve('Merchandising/Promotion/SelectSearch'),
                        dataType: 'json',
                        data: function (term) {
                            return {
                                q: term,
                                locationId: $scope.vm.promotion.locationId,
                                fascia: $scope.vm.promotion.fascia,
                                effectiveDate: $scope.startDate
                            };
                        },
                        results: function (result) {
                            return {
                                results: _.map(result.data, function (doc) {
                                    return {
                                        id: doc.sku,
                                        text: doc.longDescription,
                                        productId: doc.productId
                                    };
                                    alert(doc.productId);
                                })
                            };
                        }
                    },
                    formatResult: function (data) {
                        return "<table class='promotionResult'><tr><td><b> " + data.id + " </b></td><td> : </td><td> " + data.text + "</td></tr></table>";
                    },
                    formatSelection: function (data) {
                        return data.id;
                    },
                    dropdownCssClass: "productResults",
                    escapeMarkup: function (m) {
                        return m;
                    }
                };
            };

            $scope.editItem = function (promoItem) {
                promoItem.setPriceTemp = addTax(promoItem.setPrice, promoItem.taxRate);
                promoItem.valueOffTemp = addTax(promoItem.valueOff, promoItem.taxRate);
                promoItem.percentDiscountTemp = promoItem.percentDiscount;
                promoItem.isEditing = true;
            };

            $scope.confirmEdit = function (promoItem) {
                switch (parseInt($scope.vm.promotion.type,10)) {
                    case 1:
                        promoItem.setPrice = removeTax(promoItem.setPriceTemp, promoItem.taxRate);
                        break;
                    case 2:
                        promoItem.valueDiscount = removeTax(promoItem.valueDiscountTemp, promoItem.taxRate);
                        break;
                    case 3:
                        promoItem.percentDiscount = promoItem.percentDiscountTemp;
                }
                promoItem.isEditing = false;
                delete promoItem.setPriceTemp;
                delete promoItem.valueDiscountTemp;
                delete promoItem.percentDiscountTemp;
            };

            $scope.revertEdit = function(promoItem) {
                promoItem.isEditing = false;
                delete promoItem.setPriceTemp;
                delete promoItem.valueDiscountTemp;
                delete promoItem.percentDiscountTemp;
            };

            $scope.getHierarchyValue = function(promoItem, hierarchy) {
                var currentHierarchy = _.find(promoItem.hierarchies, function(item) {

                    return item.levelName.toLowerCase() === hierarchy.key.toLowerCase();
                });

                if (currentHierarchy) {
                    return currentHierarchy.tagName; 
                }

                return 'Any';
            };
        };
    });
