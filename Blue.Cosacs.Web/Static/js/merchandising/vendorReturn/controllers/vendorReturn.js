define([
        'angular',
        'underscore',
        'url',
        'moment'
    ],
    function (angular, _, url, moment) {
        'use strict';

        return function ($scope, $filter, $location, pageHelper, vendorReturnResourceProvider, user) {
            $scope.saving = false;
            $scope.creating = false;

            $scope.$watch('vendorReturn', function (vendorReturn) {
                if (!vendorReturn.id) {
                    $scope.creating = true;
                }
                updateTitle(vendorReturn || {});
            });

            function updateTitle(vendorReturn) {
                pageHelper.setTitle(vendorReturn.id ? 'Vendor Return #' + vendorReturn.id : 'Create Vendor Return');
            }

            function canCreate() {
                return !$scope.saving && $scope.creating && $scope.vendorReturnForm.$valid && totalReturns() > 0;
            }

            function canApprove() {
                return !$scope.saving && !$scope.creating && !$scope.vendorReturn.approvedDate && user.hasPermission('VendorReturnApprove');
            }

            function canPrint() {
                return !$scope.saving && !$scope.creating;
            }

            function create() {
                if (!canCreate()) {
                    return;
                }

                var model = {};
                model.goodsReceiptId = $scope.vendorReturn.goodsReceiptId;
                model.comments = $scope.vendorReturn.comments;
                model.vendorReturnProducts = getVendorReturnProducts();
                model.referenceNumber = $scope.vendorReturn.referenceNumber;

                vendorReturnResourceProvider
                    .save(model)
                    .then(function (vendorReturn) {
                        $scope.vendorReturn = vendorReturn;
                        $scope.saving = false;
                        $scope.creating = false;
                        updateRoute(vendorReturn);
                        updateTitle(vendorReturn);
                        pageHelper.notification.show('Vendor return created');
                    }, function (err) {
                        $scope.saving = false;
                        if (err && err.message) {
                            pageHelper.notification.show(err.message);
                        }
                    });
            }

            function approve() {
                vendorReturnResourceProvider.approve($scope.vendorReturn.id, $scope.vendorReturn.referenceNumber, $scope.vendorReturn.comments, moment().startOf('day').toDate())
                    .then(function (result) {
                        $scope.vendorReturn.approvedById = result.id;
                        $scope.vendorReturn.approvedBy = result.name;
                        $scope.vendorReturn.approvedDate = result.dateApproved;
                        $scope.editing = false;
                        pageHelper.notification.show('Return to vendor approved successfully');
                    }, function (err) {
                    });
            }

            function generateUrl(link) {
                return url.resolve(link);
            }

            function updateRoute(vendorReturn) {
                $location.path(url.resolve('Merchandising/VendorReturn/Detail/' + vendorReturn.id));
            }

            function validateQuantityReturned(formField, product) {
                formField.$setValidity('ngMax', quantityReturnedIsValid(product.quantityReturned, product.quantityRemaining || 0));
            }

            function quantityReturnedIsValid(returned, remaining) {
                return returned <= remaining;
            }

            function print() {
                if (!canPrint) {
                    return;
                }
                url.open('/Merchandising/VendorReturn/Print/' + $scope.vendorReturn.id);
            }

            function printWithCost() {
                if (!canPrint) {
                    return;
                }
                url.open('/Merchandising/VendorReturn/PrintWithCost/' + $scope.vendorReturn.id);
            }

            function getVendorReturnProducts() {
                return _.chain($scope.vendorReturn.purchaseOrders)
                    .map(function (po) {
                        return po.products;
                    })
                    .flatten(true)
                    .value();
            }

            function sum(set, selector) {
                return _.chain(set)
                    .map(selector)
                    .reduce(function (memo, n) {
                        return memo + (n || 0);
                    }, 0)
                    .value();
            }

            function totalReturns() {
                return sum(getVendorReturnProducts(), function (p) {
                    return p.quantityReturned;
                });
            }

            function totalUnitCost() {
                return sum(getVendorReturnProducts(), function (p) {
                    return p.lastLandedCost;
                });
            }

            function totalLineCost() {
                return sum(getVendorReturnProducts(), function (p) {
                    return p.quantityReturned * p.lastLandedCost;
                });
            }

            $scope.canCreate = canCreate;
            $scope.create = create;
            $scope.canApprove = canApprove;
            $scope.approve = approve;
            $scope.canPrint = canPrint;
            $scope.print = print;
            $scope.printWithCost = printWithCost;
            $scope.validateQuantityReturned = validateQuantityReturned;
            $scope.generateUrl = generateUrl;
            $scope.totalUnitCost = totalUnitCost;
            $scope.totalLineCost = totalLineCost;
        };
    });
