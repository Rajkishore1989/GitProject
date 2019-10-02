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

    var settingsSources = [
     'Blue.Cosacs.Merchandising.ReferenceNumberType'
    ];

    return function ($scope, $timeout, $location, pageHelper, user, goodsReceiptResourceProvider, purchaseResourceProvider, vendorResourceProvider, locationResourceProvider, userResourceProvider) {
        var beforeEditClone = {};

        $scope.editing = false;
        $scope.saving = false;
        $scope.adding = false;
        $scope.userCanEdit = !user.hasPermission('GoodsReceiptEdit');
        $scope.dateFormat = pageHelper.dateFormat;
        $scope.selectedProduct = 0;

        $scope.today = moment().format('YYYY-MM-DD');

        $scope.$watch('receipt', function (receipt) {
            updateMode(receipt);
            updateTitle(receipt || {});
            initializeEditMode();
            initializeReferenceNumbers(receipt);
            updateMinDate();
        });

        function updateMinDate() {
            $timeout(function () {
                $('.dateReceived').datepicker('option', 'maxDate', new Date());
                $('.dateReceived').datepicker('setDate', new Date());

                if ($scope.mode === 'create') {
                    $scope.receipt.dateReceived = moment().local().format('YYYY-MM-DD');
                }
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
                $scope.readonly = $scope.userCanEdit;
            }
        }

        function cancel() {
            $scope.receipt = beforeEditClone;
            beforeEditClone = {};

            $scope.editing = false;
        }

        function isCreateMode() {
            return $scope.mode === 'create';
        }

        function isEditMode() {
            return $scope.mode === 'edit';
        }

        function canSave(form) {
            return !$scope.readonly && $scope.editing && !$scope.saving && !$scope.editingProduct && form.$valid &&
                $scope.receipt.products.length > 0 &&
                _.all($scope.receipt.products, function (prod) {
                    return prod.productId > 0 && prod.quantityReceived > 0;
                });
        }

        function canEdit() {
            return !$scope.readonly && $scope.mode !== 'view' && !$scope.editing && !$scope.saving;
        }

        function canAddProduct() {
            
            return !$scope.editingProduct && ($scope.receipt.products.length === 0 ||
                _.all($scope.receipt.products, function (prod) {
                    return prod.productId > 0;
                }));
        }

        function addProduct() {
            $scope.receipt.products.push({
                productId: 0,
                quantity: 0,
                comments: "",
                description: "",
                lastLandedCost: 0,
                totalLandedCost: 0
            });

            $scope.adding = true;
        }

        function remove(idx) {
            $scope.receipt.products.splice(idx, 1);
        }

        function save(form) {
            if (!canSave(form)) {
                return;
            }

            $scope.saving = true;
            goodsReceiptResourceProvider
                .save($scope.receipt)
                .then(
                    function (receipt) {
                        $scope.receipt = receipt;
                        updateMode(receipt);
                        updateTitle(receipt);
                        updateRoute(receipt);
                        pageHelper.notification.show('Direct receipt saved successfully');
                        $scope.saving = false;
                        $scope.editing = false;
                    }, function (err) {
                        if (err && err.message) {
                            pageHelper.notification.show(err.message);
                        }
                        
                        $scope.saving = false;
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
                        pageHelper.notification.show('Direct receipt saved successfully');
                        $scope.saving = false;
                        $scope.editing = false;
                    }, function (err) {
                        if (err && err.message) {
                            pageHelper.notification.show(err.message);
                        }

                        $scope.saving = false;
                    });
        }

        function edit() {
            if (!canEdit()) {
                return;
            }

            beforeEditClone = angular.copy($scope.receipt);
            $scope.editing = true;
        }

        function updateTitle(receipt) {
            pageHelper.setTitle(receipt.id ? 'Direct Receipt #' + receipt.id : 'Create Direct Receipt');
        }

        function updateRoute(receipt) {
            $location.path(url.resolve('Merchandising/GoodsReceiptDirect/Detail/' + receipt.id));
        }

        function print(includeCost) {
            confirm('This action will be audited. Would you like to continue?',
                'Audit Confirmation', function(agree) {
                    if (agree) {
                        if (includeCost) {
                            url.open('/Merchandising/GoodsReceiptDirect/PrintWithCost/' + $scope.receipt.id);
                        } else {
                            url.open('/Merchandising/GoodsReceiptDirect/Print/' + $scope.receipt.id);
                        }
                    }
                });
        }

        function initializeEditMode() {
            if ($scope.mode === 'create') {
                edit();
            }
        }

        var approvePermission = user.hasPermission("GoodsReceiptApprove");

        $scope.$watch('receipt.approvedById', function (approvedById) {
            $scope.status = approvedById > 0 ? "Approved" : "Awaiting Approval";
            $scope.isApproved = approvedById > 0;
        });

        function canApprove() {
            return !$scope.editing && !$scope.isApproved && approvePermission;
        }

        function approve() {
            goodsReceiptResourceProvider.approve($scope.receipt.id, $scope.receipt.comments).then(function (result) {
                $scope.receipt.approvedById = result.id;
                $scope.receipt.approvedBy = result.name;
                $scope.receipt.dateApproved = result.dateApproved;
                pageHelper.notification.show('Direct receipt approved successfully');
            }, function(err) {
                pageHelper.notification.show('There was problem approving the receipt');
            });
        }

        function lineCost(product) {
            return product.quantityReceived * product.unitLandedCost;
        }

        function generateUrl(link) {
            return url.resolve(link);
        }

        function canAddReference() {
            return ($scope.editing) && ($scope.receipt.referenceNumbers.length === 0 || _.all($scope.receipt.referenceNumbers, function (ref) {
                return ref.key !== '' &&
                     ref.value !== '';
            }));
        }

        function addReferenceNumber() {
            if (canAddReference()) {
                $scope.receipt.referenceNumbers.push({
                    key: 'Container Number',
                    value: ''
                });
            }
        }

        function canAddItems() {
            return $scope.receipt.vendorId > 0 && $scope.receipt.locationId > 0;
        }

        function removeReferenceNumber(referenceNumber) {
            $scope.receipt.referenceNumbers = _.reject($scope.receipt.referenceNumbers, function (n) { return n === referenceNumber; });
        }

        function initializeReferenceNumbers(receipt) {
            receipt.referenceNumbers = receipt.referenceNumbers || [];
        }

        function initializePageData() {

            pageHelper.getSettings(settingsSources, function (options) {
                $scope.options = options;
                $scope.$apply();
            });

            vendorResourceProvider.getList({ includeInactive: true }).then(function (vendors) {
                $scope.vendors = vendors;
            });

            vendorResourceProvider.get().then(function (vendors) {
                $scope.vendorsFull = vendors;
            });

            locationResourceProvider.getList().then(function (locations) {
                $scope.locations = locations;
            });

            userResourceProvider.get().then(function (users) {
                $scope.users = users;
            });
        }


        function vendorsLocked() {
            return typeof $scope.vendors === 'undefined' ||
                $scope.receipt.products.length > 0;
        }

        function locationsLocked() {
            return typeof $scope.locations === 'undefined' ||
               $scope.receipt.products.length > 0;
        }

        function canChangeReceivedBy() {
            return typeof $scope.users !== 'undefined' &&
                $scope.users.length > 0;
        }

        function canRemove() {
            return isCreateMode() || $scope.editing;
        }


        function updateLocation() {
            $scope.receipt.location = $scope.locations[$scope.receipt.locationId];
        }

        function updateVendor() {
            $scope.receipt.vendor = _.find($scope.vendorsFull, function (vendor) {
                return vendor.id == $scope.receipt.vendorId;
            });
        }

        function canVendorReturn() {
            return !$scope.editing && user.hasPermission("VendorReturnApprove");
        }

        function vendorReturn() {
            if (!canVendorReturn()) {
                return;
            }
            url.open('/Merchandising/VendorReturnDirect/New/' + $scope.receipt.id);
        }

        $scope.$watch('receipt.vendorId', function (val) {
            if (!isEditMode()) {
                $scope.receipt.vendor = _.findWhere($scope.vendors, { id: $scope.receipt.vendorId });
            }
        }, true);

        $scope.$watch('receipt.locationId', function (val) {
            if (!isEditMode()) {
                $scope.receipt.location = _.findWhere($scope.locations, { id: $scope.receipt.locationId });
            }
        }, true);

        $scope.$watch('receipt.receivedById', function (val) {
            if (!isEditMode()) {
                $scope.receipt.receivedBy = _.findWhere($scope.users, { id: $scope.receipt.receivedById });
            }
        }, true);

        $scope.isCreateMode = isCreateMode;
        $scope.isEditMode = isEditMode;
        $scope.save = save;
        $scope.saveComments = saveComments;
        $scope.canSave = canSave;
        $scope.canEdit = canEdit;
        $scope.edit = edit;
        $scope.print = print;
        $scope.addProduct = addProduct;
        $scope.canAddProduct = canAddProduct;
        $scope.remove = remove;
        $scope.generateUrl = generateUrl;
        $scope.canApprove = canApprove;
        $scope.approve = approve;
        $scope.canAddReference = canAddReference;
        $scope.addReferenceNumber = addReferenceNumber;
        $scope.removeReferenceNumber = removeReferenceNumber;
        $scope.vendorsLocked = vendorsLocked;
        $scope.locationsLocked = locationsLocked;
        $scope.canChangeReceivedBy = canChangeReceivedBy;
        $scope.cancel = cancel;
        $scope.canRemove = canRemove;
        $scope.canAddItems = canAddItems;
        $scope.lineCost = lineCost;
        $scope.updateLocation = updateLocation;
        $scope.updateVendor = updateVendor;
        $scope.canVendorReturn = canVendorReturn;
        $scope.vendorReturn = vendorReturn;
        initializePageData();
    };
});
