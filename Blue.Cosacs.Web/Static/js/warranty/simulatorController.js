/*global define*/
define(['underscore', 'angular', 'angularShared/app', 'notification', 'url',
        'jquery.pickList', 'alert', 'localisation', 'moment', 'merchandising/hierarchy/controllers/productHierarchy', 'lib/select2'],

    function (_, angular, app, notification, url, pickList, alert, localisation, moment, productHierarchy) {
        'use strict';
        return {
            init: function ($el) {
                var simulatorCtrl = function ($scope, $location, $rootScope, $filter, xhr, $anchorScroll, Enum) {

                    $scope.hasPagination = true;

                    $scope.filter = $location.search();
                    initData();

                    $location.hash('search');
                    $anchorScroll();

                    $scope.selectPage = function(page) {
                        $scope.filter.PageIndex = page;
                        $scope.search();
                    };

                    var refreshQueryStringParameters = function (scope) {
                        var cleanUri = location.protocol + "//" + location.host + location.pathname;
                        var refreshedUrl = cleanUri + '?' + getCurrentFilterValues(scope);
//                        if (history) {
//                            history.pushState({}, '', refreshedUrl);
//                        }
                    };

                    var getCurrentFilterValues = function (scope) {
                        var tmpFilterStr = '';

                        var tmpFilter = scope.filter;
                        for (var searchVar in tmpFilter) {
                            if (tmpFilter.hasOwnProperty(searchVar)) {
                                var tmpValue = tmpFilter[searchVar];
                                if (tmpValue !== null && tmpValue !== undefined && tmpValue !== '') {
                                    tmpFilterStr += searchVar + '=' + encodeURIComponent(tmpFilter[searchVar]) + '&';
                                }
                            }
                        }
                        tmpFilterStr = tmpFilterStr.substring(0, tmpFilterStr.length - 1); // trim last '&'
                        return tmpFilterStr;
                    };
                    refreshQueryStringParameters($scope);

                    $scope.WarrantyTypes = {"F": "Free", "E": "Extended", "I": "Instant Replacement"};
                    $scope.SearchTypes = {"SingleProduct": "Single Product", "AllProducts": "All Products"};

                    productHierarchy($scope, xhr);

                    $scope.$watch('productItem.Level_1', function (newVal, oldVal) {
                        $scope.filter.Department = newVal;
                    });

                    $scope.$watch('productItem.Level_2', function (newVal, oldVal) {
                        $scope.filter.CategoryId = newVal;
                    });

                    $scope.$watch('filter.SearchType', function (newVal) {
                        $scope.filter.SearchAllProducts = (newVal === 'AllProducts');

                        resetData();
                    });

                    $scope.$watch('filter.resultType', function (newVal) {
                        $scope.filter.PageIndex = 1; // reset to page 1

                        if (newVal === 'withWarranties') {
                            $scope.filter.PageCount = $scope.filter.PageCountWarranties;
                        } else if (newVal === 'withOutWarranties') {
                            $scope.filter.PageCount = $scope.filter.PageCountNoWarranties;
                        } else {
                            $scope.filter.PageCount = 0;
                        }
                    });

                    $scope.hasResults = function () {
                        var hasRes = ($scope.results && $scope.results.length > 0);

                        if ($scope.filter.SearchAllProducts && $scope.filter.resultType == 'withOutWarranties') {
                            hasRes = ($scope.resultsNoWarranties && $scope.resultsNoWarranties.length > 0);
                        }

                        return hasRes;
                    };

                    $scope.showWithWarrantiesSection = function () {
                        return   (!$scope.filter.SearchAllProducts) || ($scope.filter.SearchAllProducts && $scope.filter.resultType == 'withWarranties');
                    };

                    $scope.isMissingParameters = function () {
                        return !$scope.filter.location ||
                            ( ($scope.filter.SearchAllProducts && !$scope.filter.CategoryId) || (!$scope.filter.SearchAllProducts && !$scope.filter.product));
                    };

                    $scope.clear = function () {
                        resetData();
                        initData();
                    };

                    $scope.search = function () {
                        var sellDate = null;
                        var items = [];

                        $scope.results = items;
                        if ($scope.filter.sellDate !== undefined && $scope.filter.sellDate !== null && $scope.filter.sellDate !== '') {
                            sellDate = $scope.filter.sellDate.toISOString();
                        }

                        xhr.post(url.resolve('/Warranty/Link/Search'), {
                            Product: $scope.filter.SearchAllProducts ? '' : $scope.filter.product,
                            PriceVATEx: $scope.filter.price,
                            Location: $scope.filter.location,
                            Date: sellDate,
                            Department: $scope.filter.SearchAllProducts ? $scope.filter.Department : null,
                            CategoryId: $scope.filter.SearchAllProducts ? $scope.filter.CategoryId : null,
                            WarrantyTypeCode: $scope.filter.WarrantyType,
                            PageIndex: $scope.filter.PageIndex,
                            PageSize: $scope.filter.PageSize
                        }).success(function (data) {
                            if (data && data.Items) {
                                items = data.Items;
                                $scope.warrantiesCount = data.CountWarranties;
                                var pageCountWarranties = $scope.filter.PageSize > 0 ? data.CountWarranties / $scope.filter.PageSize : 0;
                                $scope.filter.PageCountWarranties = Math.ceil(pageCountWarranties);
                                // items = items.concat(data.Items);
                            }

                            if (data) {
                                $scope.filter.PageIndex = data.PageIndex;
                                $scope.filter.PageSize = data.PageSize;
                            }

                            $scope.results = items;

                            if (data && data.ItemsWithoutWarranties) {
                                $scope.resultsNoWarranties = data.ItemsWithoutWarranties;
                                $scope.noWarrantiesCount = data.CountNoWarranties;
                                var pageCountNoWarranties = $scope.filter.PageSize > 0 ? data.CountNoWarranties / $scope.filter.PageSize : 0;
                                $scope.filter.PageCountNoWarranties = Math.ceil(pageCountNoWarranties);
                            }

                            if (data.ProductPrice) {
                                $scope.filter.price = data.ProductPrice.toFixed(2);
                            }

                            if ($scope.filter.resultType === 'withWarranties') {
                                $scope.filter.PageCount = $scope.filter.PageCountWarranties;
                            } else if ($scope.filter.resultType === 'withOutWarranties') {
                                $scope.filter.PageCount = $scope.filter.PageCountNoWarranties;
                            } else {
                                $scope.filter.PageCount = 0;
                            }

                            refreshQueryStringParameters($scope);
                            $location.hash('search');
                        });
                    };

                    $scope.exportResults = function () {
                        var sellDate = null;
                        if ($scope.filter.sellDate !== undefined && $scope.filter.sellDate !== null && $scope.filter.sellDate !== '') {
                            sellDate = $scope.filter.sellDate.toISOString();
                        }

                        var parameters = {
                            Product: $scope.filter.SearchAllProducts ? '' : $scope.filter.product,
                            PriceVATEx: $scope.filter.price,
                            Location: $scope.filter.location,
                            Date: sellDate,
                            Department: $scope.filter.SearchAllProducts ? $scope.filter.Department : null,
                            CategoryId: $scope.filter.SearchAllProducts ? $scope.filter.CategoryId : null,
                            WarrantyTypeCode: $scope.filter.WarrantyType
                        };

                        var tmpWithWithoutWarranties = 1;
                        if ($scope.filter.resultType === 'withOutWarranties') {
                            tmpWithWithoutWarranties = 0;
                        }

                        var fileName = getFileName(parameters, tmpWithWithoutWarranties);

                        var exportUrl = url.resolve('/Warranty/Link/SearchExport') + '?' +
                                'Product=' + encodeURIComponent(parameters.Product) + "&" +
                                'PriceVATEx=' + encodeURIComponent(parameters.PriceVATEx) + "&" +
                                'Location=' + encodeURIComponent(parameters.Location) + "&" +
                                'Date=' + encodeURIComponent(parameters.Date) + "&" +
                                'Department=' + encodeURIComponent(parameters.Department) + "&" +
                                'CategoryId=' + encodeURIComponent(parameters.CategoryId) + "&" +
                                'typeCode=' + encodeURIComponent(parameters.WarrantyTypeCode) + "&" +
                                'withWarranties=' + encodeURIComponent(tmpWithWithoutWarranties) + "&" +
                                'fileName=' + encodeURIComponent(fileName);

                        return url.open(exportUrl);
                    };

                    var getFileName = function (parameters, productWithoutWarranties) {
                        var f = '';
                        if (productWithoutWarranties) {
                            f = 'ProductsWithWarranties';
                        } else {
                            f = 'ProductsWithoutWarranties';
                        }

                        f += '_' + moment().format('YYYYMMDD');

                        if (parameters.Location) {
                            f += '_' + parameters.Location;
                        }
                        if (parameters.Department) {
                            f += '_' + parameters.Department;
                        }
                        if (parameters.CategoryId) {
                            f += '_' + parameters.CategoryId;
                        }

                        return f + ".csv";
                    };

                    $scope.isFreeWarranty = function (warrantyLink) {
                        return warrantyLink.TypeCode === 'F' ? 'Yes' : 'No';
                    };

                    $scope.dateOptions = {
                        changeYear: true,
                        changeMonth: true,
                        dateFormat: "D, d MM, yy"
                    };

                    $scope.culture = localisation.getSettings();

                    $scope.urlLink = function (name) {
                        return url.resolve('/Warranty/Link/Get?name=') + name;
                    };

                    $scope.urlWarranty = function (id) {
                        return url.resolve('/Warranty/Warranties/') + id;
                    };

                    $scope.urlPromo = function (id) {
                        return url.resolve('/Warranty/WarrantyPromotions/') + id;
                    };

                    $scope.warrantyPromotionMatch = function (result) {
                        if (!result.promotion) {
                            return;
                        }
                        if (result.promotion.Promotion.WarrantyId) {
                            return 'Promotion match on warranty Id';
                        } else {
                            return 'Promotion match on lowest level';
                        }
                    };

                    $scope.getResultPriceDate = function (result) {
                        var formattedDate = moment(result.price.EffectiveDate).format('YYYY-MM-DD');
                        return formattedDate;
                    };

                    function initData () {
                        if (!$scope.filter) {
                            $scope.filter = {};
                        }
                        if (!$scope.filter.SearchType) {
                            $scope.filter.SearchType = 'SingleProduct';
                        }
                        if (!$scope.filter.product) {
                            $scope.filter.product = '';
                        }
                        if (!$scope.filter.WarrantyType) {
                            $scope.filter.WarrantyType = '';
                        }
                        if (!$scope.filter.SearchAllProducts) {
                            $scope.filter.SearchAllProducts = false;
                        }
                        if (!$scope.filter.resultType) {
                            $scope.filter.resultType = 'withWarranties';
                        }
                        if (!$scope.filter.PageIndex) {
                            $scope.filter.PageIndex = '1';
                        }
                        if (!$scope.filter.PageSize) {
                            $scope.filter.PageSize = '100';
                        }
                        if (!$scope.warrantiesCount) {
                            $scope.warrantiesCount = '0';
                        }
                        if (!$scope.noWarrantiesCount) {
                            $scope.noWarrantiesCount = '0';
                        }
                    }

                    function resetData () {
                        if ($scope.filter === null) {
                            $scope.filter = {};
                        }

                        $scope.filter.product = null;
                        $scope.filter.price = null;
                        $scope.filter.sellDate = null;
                        $scope.filter.location = null;
                        $scope.filter.Department = null;
                        $scope.filter.CategoryId = null;
                        $scope.filter.WarrantyType = '';
                        $scope.filter.resultType = 'withWarranties';

                        $scope.warrantiesCount = '0';
                        $scope.noWarrantiesCount = '0';
                        $scope.results = [];
                        $scope.resultsNoWarranties = [];

                        $scope.productItem.Level_1 = null;
                        $scope.productItem.Level_2 = null;

                        $scope.PageCountWarranties = null;
                        $scope.PageCountNoWarranties = null;
                        $scope.PageIndex = null;
                        $scope.PageSize = null;
                    }
                };

                simulatorCtrl.$inject = ['$scope', '$location', '$rootScope', '$filter', 'xhr', '$anchorScroll', 'Enum'];
                app().controller('simulatorCtrl', simulatorCtrl);
                return angular.bootstrap($el, ['myApp']);
            }
        };
    });