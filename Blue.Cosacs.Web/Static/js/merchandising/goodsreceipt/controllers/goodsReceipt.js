define([
    'angular',
    'underscore',
    'url',
    'confirm',
    'moment',
    'lib/select2',
    'jquery',
    'datepicker'
],
function (angular, _, url, confirm, moment) {
    'use strict';

    return function ($scope, $timeout, $location, pageHelper, user, goodsReceiptResourceProvider, purchaseResourceProvider, vendorResourceProvider, locationResourceProvider, userResourceProvider) {
        var beforeEditClone = {};

        $scope.editing = false;
        $scope.saving = false;
        $scope.userCanEdit = user.hasPermission('GoodsReceiptEdit');
        $scope.dateFormat = pageHelper.dateFormat;
        $scope.selectedPurchaseOrderId = 0;
        $scope.addedPurchaseOrders = [];
        $scope.today = moment().format('YYYY-MM-DD');

        $scope.$watch('receipt', function (receipt) {
            updateMode(receipt);
            updateTitle(receipt || {});
            initializeEditMode();
            configureDatePicker();

            if ($scope.mode === 'edit' && $scope.receipt.purchaseOrders.length > 0) {
                $scope.receipt.vendorId = $scope.receipt.purchaseOrders[0].vendorId;
            }

            $scope.vendorsList = _.uniq(_.map($scope.receipt.purchaseOrders, function(po) {
                return { vendorId : po.vendorId, vendor : po.vendor };
            }));
        });

        function configureDatePicker() {
            $timeout(function () {
                $('.dateReceived').datepicker('option', 'maxDate', new Date());
            }, 0);
        }

        function updateMode(receipt) {
            if (!receipt.id) {
                $scope.mode = 'create';
                $scope.readonly = false;
            } else if (receipt.status === 'Completed' || receipt.status === 'Cancelled') {
                $scope.mode = 'view';
                $scope.readonly = true;
            } else {
                $scope.mode = 'edit';
                $scope.readonly = !$scope.userCanEdit;
            }
        }

        function isCreateMode() {
            return $scope.mode === 'create';
        }

        function isEditMode() {
            return $scope.mode === 'edit';
        }

        function canSave(form) {
            return !$scope.readonly && $scope.editing && !$scope.saving && form.$valid && $scope.receipt.purchaseOrders.length > 0 && $scope.receipt.locationId > 0;
        }

        function canPrint() {
            return !$scope.editing && ((!$scope.receipt.costConfirmed && $scope.isConfirmed) || $scope.receipt.costConfirmed) && !$scope.saving;
        }

        function canEdit() {
            return !$scope.readonly && $scope.mode !== 'view' && !$scope.editing && !$scope.saving;
        }

        function canVendorReturn() {
            return user.hasPermission("VendorReturnApprove") && canPrint();
        }

        function canVerifyCosts() {
            return !$scope.editing && (!$scope.receipt.costConfirmed && !$scope.isConfirmed) && user.hasPermission("GoodsReceiptVerify");
        }

        function addPurchaseOrder() {
            if (!_.findWhere($scope.receipt.purchaseOrders, { id: $scope.selectedPurchaseOrderId })) {
                purchaseResourceProvider.getForReceipt($scope.selectedPurchaseOrderId).then(function (pos) {
                    $scope.selectedPurchaseOrderId = 0;
                    $scope.receipt.purchaseOrders.push(pos);
                    $scope.purchaseOrders = _.reject($scope.purchaseOrders, function (item) {
                        if (Number.parseInt(item.purchaseOrderId, 10) === pos.id) {
                            item.quantityCancelled = 0;
                            $scope.addedPurchaseOrders.push(item);
                            return true;
                        }
                        return false;
                    });
                });
            }
        }

        function remove(purchaseOrder) {
            $scope.receipt.purchaseOrders = _.reject($scope.receipt.purchaseOrders, function (item) {
                if (item == purchaseOrder) {

                    var po = _.findWhere($scope.addedPurchaseOrders, { purchaseOrderId: item.id.toString() });

                    if (po) {
                        $scope.purchaseOrders.push(po);
                    }

                    $scope.addedPurchaseOrders = _.reject($scope.addedPurchaseOrders, function (addedPo) {
                        return addedPo.purchaseOrderId === item.id;
                    });

                    return true;
                }
                return false;
            });
        }

        function save(form) {
            if (!canSave(form)) {
                return;
            }

            $scope.saving = true;
            goodsReceiptResourceProvider
                .save($scope.receipt)
                .then(function(receipt) {
                    $scope.receipt = receipt;
                    updateMode(receipt);
                    updateTitle(receipt);
                    updateRoute(receipt);
                    updateStatus();
                    pageHelper.notification.show('Goods receipt saved successfully');
                    $scope.saving = false;
                    $scope.editing = false;
                }, function(err) {
                    $scope.saving = false;
                    if (err && err.message) {
                        pageHelper.notification.show(err.message);
                    }
                });
        }

        function saveComments(form) {
            if (!canSave(form)) {
                return;
            }

            $scope.saving = true;
            goodsReceiptResourceProvider
                .saveComments($scope.receipt)
                .then(
                    function () {
                        pageHelper.notification.show('Goods receipt saved successfully');
                        $scope.saving = false;
                        $scope.editing = false;
                    }, function (err) {
                        if (err && err.message) {
                            pageHelper.notification.show(err.message);
                        }
                        $scope.saving = false;
                        $scope.editing = false;
                    });
        }


        function cancel() {
            $scope.receipt = beforeEditClone;
            beforeEditClone = {};

            $scope.editing = false;
        }

        function edit() {
            if (!canEdit()) {
                return;
            }

            beforeEditClone = angular.copy($scope.receipt);
            $scope.editing = true;
        }

        function vendorReturn() {
            if (!canVendorReturn()) {
                return;
            }
            url.open('/Merchandising/VendorReturn/New/' + $scope.receipt.id);
        }

        function verifyCosts() {
            if (!canVerifyCosts()) {
                return;
            }
            url.open('/Merchandising/GoodsReceipt/VerifyCost/' + $scope.receipt.id);
        }

        function updateTitle(receipt) {
            pageHelper.setTitle(receipt.id ? 'Goods Receipt #' + receipt.id : 'Create Goods Receipt');
        }

        function updateRoute(receipt) {
            $location.path(url.resolve('Merchandising/GoodsReceipt/Detail/' + receipt.id));
        }

        function print(includeCost) {
            confirm('This action will be audited. Would you like to continue?',
                'Audit Confirmation', function (agree) {
                    if (agree) {
                        if (includeCost) {
                            url.open('/Merchandising/GoodsReceipt/PrintWithCost/' + $scope.receipt.id);
                        } else {
                            url.open('/Merchandising/GoodsReceipt/Print/' + $scope.receipt.id);
                        }
                    }
                });
        }

        function initializeEditMode() {
            if ($scope.mode === 'create') {
                edit();
            }
        }

        function approve() {
            goodsReceiptResourceProvider.approve($scope.receipt.id, $scope.receipt.comments).then(function (result) {
                $scope.receipt.approvedById = result.id;
                $scope.receipt.approvedBy = result.name;
                $scope.receipt.dateApproved = result.dateApproved;
                $scope.editing = false;
                pageHelper.notification.show('Goods receipt approved successfully');
            }, function (err) {
                pageHelper.notification.show('There was problem approving the receipt');
            });
        }

        function generateUrl(link) {
            return url.resolve(link);
        }

        function initializePageData() {

            vendorResourceProvider.getList({ includeInactive: true }).then(function (vendors) {
                $scope.vendors = vendors;
            });

            locationResourceProvider.getList().then(function (locations) {
                $scope.locations = locations;
            });

            if ($scope.userCanEdit) {
                userResourceProvider.get().then(function (users) {
                    $scope.users = users;
                });
            }
        }

        $scope.$watch('receipt.vendorId', function (val) {
            if (typeof val !== 'undefined' && val !== null) {

                $scope.receipt.vendor = _.findWhere($scope.vendors, { id: val });

                if (isCreateMode()) {
                    purchaseResourceProvider.notReceived(val).then(function(pos) {
                        $scope.purchaseOrders = pos;
                        if (pos.length === 0) {
                            pageHelper.notification.show('No pending purchase orders found for this vendor');
                        }
                    });
                }
            } else {
                $scope.receipt.vendor = null;
            }
        }, true);

        var approvePermission = user.hasPermission("GoodsReceiptApprove");

        function updateStatus() {
            $scope.status = !$scope.receipt.costConfirmed ? "Awaiting Costing" : (!$scope.receipt.dateApproved ? "Awaiting Approval" : "Approved");
        }

        $scope.$watch('receipt.approvedById', function (approvedById) {
            $scope.isApproved = approvedById > 0;
            updateStatus();
        });

        $scope.$watch('receipt.costConfirmed', function (costConfirmed) {
            $scope.isConfirmed = !!costConfirmed;
            updateStatus();
        });

        function canApprove() {
            return !$scope.editing && !$scope.isApproved && approvePermission;
        }

        function vendorsLocked() {
            return typeof $scope.vendors === 'undefined' ||
                $scope.receipt.purchaseOrders.length > 0;
        }

        function locationsLocked() {
            return false;
        }

        function canChangeReceivedBy() {
            return typeof $scope.users !== 'undefined' && $scope.users.length > 0;
        }

        function updateLocation() {
            if ($scope.receipt) {
                $scope.receipt.location = $scope.locations[$scope.receipt.locationId];
            }
        }

        $scope.isCreateMode = isCreateMode;
        $scope.isEditMode = isEditMode;
        $scope.save = save;
        $scope.saveComments = saveComments;
        $scope.canSave = canSave;
        $scope.canEdit = canEdit;
        $scope.canApprove = canApprove;
        $scope.canVendorReturn = canVendorReturn;
        $scope.canVerifyCosts = canVerifyCosts;
        $scope.edit = edit;
        $scope.verifyCosts = verifyCosts;
        $scope.print = print;
        $scope.canPrint = canPrint;
        $scope.addPurchaseOrder = addPurchaseOrder;
        $scope.remove = remove;
        $scope.vendorReturn = vendorReturn;
        $scope.generateUrl = generateUrl;
        $scope.approve = approve;
        $scope.cancel = cancel;
        $scope.vendorsLocked = vendorsLocked;
        $scope.locationsLocked = locationsLocked;
        $scope.updateLocation = updateLocation;
        $scope.canChangeReceivedBy = canChangeReceivedBy;
        initializePageData();
    };
});
