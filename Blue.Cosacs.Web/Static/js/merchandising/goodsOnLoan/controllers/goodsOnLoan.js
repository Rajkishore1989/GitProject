define([
    'angular',
    'underscore',
    'url',
    'lib/bootstrap/tooltip',
    'moment'
],

function (angular, _, url, moment) {
    'use strict';

    var settingsSources = [
            'Blue.Config.ContactType'
    ];

    return function ($scope, $location, pageHelper, user, repo, locationResourceProvider, $timeout, serviceRequestResourceProvider, productResourceProvider) {
        var defaultTooltip = 'Please enter a numeric value between 1 and 20000';
        $scope.quantityTooltip = defaultTooltip;

        $scope.editing = true;
        $scope.saving = false;
        $scope.hasEditPermission = user.hasPermission("GoodsOnLoanEdit");
        $scope.dateFormat = pageHelper.dateFormat;
        $scope.serviceRequestEndpoint = 'Merchandising/GoodsOnLoan/SearchServiceRequests';
        $scope.serviceRequestPlaceholder = 'Enter a service request id or customer id';

        var beforeEditClone = {};

        pageHelper.getSettings(settingsSources, function (options) {
            $scope.options = options;
            $scope.$apply();
        });

        //$timeout(function () {
        //    // current jqueryui datepicker directive doesnt support setting mindate
        //    var date = new Date();
        //    $('#expectedCollectionDate').datepicker('option', 'minDate', date);
        //    $('#preferredDeliveryDate').datepicker('option', 'minDate', date);
        //
        //}, 0);

        function updatePreferredDeliveryDate() {
            $timeout(function () {
                $('#preferredDeliveryDate').datepicker('option', 'maxDate', new Date($scope.vm.expectedCollectionDate));
            }, 0);
        }

        $scope.$watch('vm', function (vm) {
            vm.contacts = vm.contacts || [];
            vm.deliveryContactDetails = vm.deliveryContactDetails || [];
            if (vm.contacts.length < 1) {
                $scope.addContact();
            }

            if (vm.deliveryContactDetails.length < 1) {
                $scope.addDeliveryContact();
            }

            if (!$scope.vm.type) {
                $scope.vm.type = 'business';
            }

            if ($scope.locations && $scope.locations.length < 1) {
                locationResourceProvider.getList().then(function (locations) {
                $scope.locations = locations;
                });
            }
        });

        $scope.addContact = function () {
            $scope.vm.contacts.push({
                key: 'Email',
                value: ''
            });
        };

        $scope.addDeliveryContact = function() {
            $scope.vm.deliveryContactDetails.push({
                key: 'Email',
                value: ''
            });
        };

        $scope.removeContact = function (contact) {
            $scope.vm.contacts = _.reject($scope.vm.contacts, function (c) { return c === contact; });
        };

        $scope.removeDeliveryContact = function(contact) {
            $scope.vm.deliveryContactDetails = _.reject($scope.vm.deliveryContactDetails, function(c) {
                return c === contact;
            });
        };
        
        function setType(type) {
            $scope.vm = { products : []};
            $scope.vm.type = type;

            if (type == 'customer') {
                $scope.vm.businessName = null;
            } else {
                $scope.vm.customerId = null;
            }
        }

        function canSave(goodsOnLoan) {

            return $scope.editing && !$scope.saving && $scope.hasEditPermission && $scope.goodsOnLoan.products.length > 0 && $scope.goodsOnLoan.stockLocationId > 0 && goodsOnLoan.$valid;
        }

        function canAddComments() {
            return $scope.hasEditPermission && !$scope.saving;
        }

        function canEdit() {
            return $scope.goodsOnLoan && !$scope.vm.collectedDate && !$scope.saving;
        }

        function canCollect() {
            return !$scope.vm.collectedDate &&!$scope.editing && !$scope.saving && $scope.hasEditPermission && isCreated();
        }

        function canPrintDeliveryNote() {
            return !$scope.saving && isCreated();
        }

        function canPrintCollectionNote() {
            return !$scope.saving && isCreated();
        }

        function canEditProduct() {
            return $scope.goodsOnLoan &&
                $scope.goodsOnLoan.stockLocationId > 0;
        }  

        function canAddProduct(form) {
            return canEditProduct(form) &&
                form.$valid;
        }

        function isCreated() {
            return $scope.goodsOnLoan.id > 0;
        }

        function showProducts() {
            return $scope.goodsOnLoan.products.length > 0;
        }

        function addProduct(product, form) {

            if (!canAddProduct(form))
                return;
            
            if (product.productId > 0) {
                var existing = _.find($scope.goodsOnLoan.products, function(p) {
                    return p.sku === product.sku;
                });

                if (!existing) {
                    $scope.goodsOnLoan.products.push(product);
                    $scope.newProduct = {};
                } else {
                    pageHelper.notification.showPersistent("Product has already been added.");
                }
            }
        }

        function updateTitle(goodsOnLoan) {
            pageHelper.setTitle(goodsOnLoan.id ? 'Goods on Loan #' + goodsOnLoan.id : 'Create Goods on Loan');
        }

        function edit() {
            if ($scope.hasEditPermission) {
                beforeEditClone = angular.copy($scope.vm);
                $scope.editing = true;
                $scope.goodsOnLoan.expectedCollectionDate =  moment($scope.goodsOnLoan.expectedCollectionDate).format('YYYY-MM-DD');
            }
        }

        function cancel() {
            $scope.vm = beforeEditClone;
            beforeEditClone = {};
            $scope.editing = false;
        }

        function save() {
            $scope.saving = true;

            repo.save($scope.goodsOnLoan)
                .then(function(gol) {
                    $scope.saving = false;
                    $scope.editing = false;
                    $scope.vm = gol;
                    updateTitle(gol);
                    $location.path(url.resolve('Merchandising/goodsOnLoan/Detail/' + gol.id));
                    pageHelper.notification.show("Goods on Loan saved.");
                }, function(err) {
                    $scope.saving = false;
                    if (err && err.message) {
                        pageHelper.notification.showPersistent(err.message);
                    }
                });
        }

        function collect() {
            $scope.saving = true;

            repo.collect($scope.goodsOnLoan.id)
               .then(function (gol) {
                   $scope.saving = false;
                   $scope.editing = false;
                   $scope.vm = gol;
                   updateTitle(gol);
                   pageHelper.notification.show("Goods on Loan saved as collected.");
               }, function (err) {
                   $scope.saving = false;
                   if (err && err.message) {
                       pageHelper.notification.showPersistent(err.message);
                   }
               });
        }

        function removeProduct(id) {
            $scope.goodsOnLoan.products = _.reject($scope.goodsOnLoan.products, function (r) {
                return r.productId === id;
            });
        }

        function getSearchParams() {
            return {
                locationId: $scope.goodsOnLoan.stockLocationId
            };
        }

        function processSearchResult(searchResult) {
            if (searchResult) {
                $scope.newProduct = searchResult;
                updateQuantityTooltip();
            }
        }

        function updateQuantityTooltip() {
            productResourceProvider.availability($scope.newProduct.productId, $scope.vm.stockLocationId)
                .then(function (amount) {
                    $scope.amount = amount;
                });
        }

        function checkQuantity() {
            var tooltip = ($scope.goodsOnLoan && $scope.newProduct.quantity > $scope.amount) ?
                'Please note that the entered quantity exceeds the current stock available at this stock location (' + $scope.amount + ' available).' : defaultTooltip;

            $('#quantity').attr('data-original-title', tooltip);
            $('#quantity').tooltip({ trigger: 'focus' }).tooltip('enable').tooltip('show');
        }

        function serviceRequestResultFormat(data) {
            return "<table><tr><td><b> " + data.id + " </b></td><td> : </td><td> " + data.customerId + "</td><td>" + data.customer + "</td></tr></table>";
        }

        function serviceRequestItemFormat(data) {
            return data.requestId;
        }

        function processServiceSearchResult(searchResult) {
            if (searchResult) {
                serviceRequestResourceProvider.getCustomerDetails(searchResult.id).then(function (sr) {
                    $scope.vm.serviceRequestId = searchResult.id;
                    $scope.vm.customerId = sr.customerId;
                    $scope.vm.title = sr.title;
                    $scope.vm.firstName = sr.firstName;
                    $scope.vm.lastName = sr.lastName;
                    $scope.vm.addressLine1 = sr.addressLine1;
                    $scope.vm.addressLine2 = sr.addressLine2;
                    $scope.vm.townCity = sr.townCity;
                    $scope.vm.postCode = sr.postCode;
                    $scope.vm.addressNotes = sr.notes;

                    $scope.vm.contacts = [];
                    _.each(sr.contacts, function(contact) {
                        $scope.vm.contacts.push({
                            key: contact.type,
                            value: contact.value
                        });
                    });
                });
            }
        }

        function mapServiceRequest(source, dest) {
            dest.id = source.requestId;
            dest.customerId = source.customerId;
            dest.customer = source.customer;
            return dest;
        }

        function lineCost(product) {
            return product.quantity * product.averageWeightedCost;
        }

        function totalLineCost() {
            if ($scope.goodsOnLoan.products.length > 0) {
                return _.reduce($scope.goodsOnLoan.products, function(sum, el) {
                    return sum + (el.averageWeightedCost * el.quantity);
                }, 0);
            }
            return 0;
        }
       
        $scope.$watch('vm', function (vm) {
            $scope.goodsOnLoan = vm || {};

            if (vm.id > 0)
                $scope.editing = false;

            locationResourceProvider.getList(false).then(function (locations) {
                $scope.locations = locations;
            });
            
            updateTitle(vm);
        });

        
        function printDeliveryNote() {
            if (!canPrintDeliveryNote) {
                return;
            }
            url.open('/Merchandising/GoodsOnLoan/PrintDeliveryNote/' + $scope.goodsOnLoan.id);
        }

        function printCollectionNote() {
            if (!canPrintCollectionNote) {
                return;
            }
            url.open('/Merchandising/GoodsOnLoan/PrintCollectionNote/' + $scope.goodsOnLoan.id);
        }

        $scope.resolve = url.resolve;
        $scope.canAddComments = canAddComments;
        $scope.canEdit = canEdit;
        $scope.canEditProduct = canEditProduct;
        $scope.canAddProduct = canAddProduct;
        $scope.canSave = canSave;
        $scope.canPrintDeliveryNote = canPrintDeliveryNote;
        $scope.canPrintCollectionNote = canPrintCollectionNote;
        $scope.printDeliveryNote = printDeliveryNote;
        $scope.printCollectionNote = printCollectionNote;
        $scope.addProduct = addProduct;
        $scope.removeProduct = removeProduct;
        $scope.showProducts = showProducts;
        $scope.isCreated = isCreated;
        $scope.save = save;
        $scope.edit = edit;
        $scope.lineCost = lineCost;
        $scope.totalLineCost = totalLineCost;
        $scope.setType = setType;
        $scope.cancel = cancel;
        $scope.collect = collect;
        $scope.canCollect = canCollect;
        $scope.updatePreferredDeliveryDate = updatePreferredDeliveryDate;
        $scope.checkQuantity = checkQuantity;
        $scope.processSearchResult = processSearchResult;
        $scope.getSearchParams = getSearchParams;
        $scope.processServiceSearchResult = processServiceSearchResult;
        $scope.mapServiceRequest = mapServiceRequest;
        $scope.serviceRequestResultFormat = serviceRequestResultFormat;
        $scope.serviceRequestItemFormat = serviceRequestItemFormat;
    };
});
