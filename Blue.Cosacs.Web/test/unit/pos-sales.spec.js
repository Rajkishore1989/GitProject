/*global define, module, inject, describe, beforeEach, afterEach, it, expect, spyOn*/
define(['jquery', 'angular', 'angular.mock', 'Sales/pos'], function ($, angular, angularMock, salesController) {
    'use strict';

    describe('POS Controllers', function () {

        beforeEach(function () {
            salesController.init($('html'));
            module('myApp');
            sessionStorage.User = JSON.stringify({
                "BranchNumber": 900,
                "BranchName": "BRIDGETOWN 900",
                "MenuItems": []
            });
        });


        describe('SalesController:: Sales ::', function () {
            var scope, createController, $httpBackend, $dialog;

            beforeEach(inject(function (_$httpBackend_, $rootScope, $controller, _$dialog_) {
                $dialog = _$dialog_;
                $httpBackend = _$httpBackend_;

                $httpBackend.when('POST', '/Config/DecisionTable/Load/').respond('{}');
                $httpBackend.when('GET', '/Static/js/Sales/Templates/receiptCodeEntry.html').respond('<div></div>');

                scope = $rootScope.$new();
                createController = function () {
                    return $controller('SalesController', {
                        $scope: scope,
                        $dialog: $dialog
                    });
                };

                spyOn($dialog, 'messageBox').andCallThrough();
                spyOn(scope, '$broadcast').andCallThrough();
            }));

            it('should should create an empty cart', function () {
                createController();
                $httpBackend.flush();
                expect(scope.cart).toBeDefined();
            });

            it('should show the Product view by default', function () {
                createController();
                $httpBackend.flush();
                expect(scope.views.productSearch.visible).toBe(true);
            });

            it('should save the order when the sale is completed', function () {
                createController();
                $httpBackend.flush();

                var order = {
                    "items": [{
                        "itemNumber": "106136",
                        "price": 1,
                        "isZeroPrice": false,
                        "quantity": 2,
                        "description": "32P 720P LCD TV HD CINESP 32P 720P LCD TV HD CINESPEED D",
                        "$$hashKey": "026",
                        "canAddWarranty": true,
                        "installations": [{
                            "Id": 26261,
                            "ItemNo": "LCDINST1",
                            "ItemDescription": "LCD SET INSTALLATION     ",
                            "ItemDescription2": "LCD SET INSTALLATION",
                            "CostPrice": 0,
                            "UnitPriceHP": 0,
                            "UnitPriceCash": 0,
                            "TaxRate": 12.5,
                            "IUPC": "LCDINST1",
                            "ItemID": 26261,
                            "$$hashKey": "02A"
                        }],
                        "warranties": [{
                            "warrantyLink": {
                                "LinkId": 2,
                                "LinkName": "link 2",
                                "ProductMatch": false,
                                "LevelMatch": 10,
                                "Id": 2,
                                "Number": "9124134",
                                "Description": "warranty 2",
                                "Length": 12,
                                "TaxRate": 15.00,
                                "IsFree": false,
                                "IsDeleted": false,
                                "WarrantyTags": [],
                                "RenewalChildren": null,
                                "RenewalParents": null
                            },
                            "price": {
                                "WarrantyId": 2,
                                "Date": "\/Date(1388489550745)\/",
                                "Branch": 900,
                                "BranchType": "C",
                                "CostPrice": 60.0000,
                                "RetailPrice": 100.0000
                            },
                            "promotion": null
                        }]
                    }, {
                        "itemNumber": "521005",
                        "price": 494.67,
                        "isZeroPrice": false,
                        "quantity": 1,
                        "description": "SHINDAIWA                 300S CHAINSAW",
                        "$$hashKey": "1O1",
                        "availableWarranties": [],
                        "canAddWarranty": false,
                        "availableInstallations": []
                    }],
                    "total": 496.67,
                    "paymentsTotal": 500,
                    "changeTotal": 3.329999999999984,
                    "balance": 0,
                    "customer": {
                        "contacts": [{
                            "type": "Email",
                            "value": "",
                            "$$hashKey": "006"
                        }, {
                            "type": "HomePhone",
                            "value": "",
                            "$$hashKey": "008"
                        }, {
                            "type": "MobilePhone",
                            "value": "",
                            "$$hashKey": "00A"
                        }]
                    },
                    "payments": [{
                        "method": "Debit Card",
                        "amount": 200,
                        "$$hashKey": "1O3"
                    }, {
                        "method": "Cash",
                        "amount": 300
                    }],
                    "warrantyBeingPurchased": false,
                    "saleComplete": false,
                    "searchItem": null
                };

                $httpBackend.expectPOST('/Sales/Orders/Save', order).respond({
                    Valid: true,
                    Errors: []
                });

                scope.$emit('pos:sale:completed', order);
                $httpBackend.flush();

                expect(scope.cart.saleComplete).toBe(true);
            });

            it('should ask for current sale to be cancelled when there is an item in the basket and a refund/exchange is started', function () {
                createController();
                $httpBackend.flush();

                var item = {
                    ItemNoWarrantyLink: '245425',
                    CashPrice: 591.33,
                    quantity: 2,
                    Description1: 'Item description 1',
                    Description2: 'Item description 2'
                };
                scope.cart.items.push(item);

                scope.refundOrExchange();

                expect($dialog.messageBox).toHaveBeenCalled();
            });

            it('should save the order when the refund/exchange if finalised', function () {
                createController();
                $httpBackend.flush();

                scope.cart = {
                    "items": [],
                    "total": 0,
                    "paymentsTotal": 0,
                    "credit": 16.89,
                    "changeTotal": 0,
                    "balance": -16.89,
                    "customer": {
                        "contacts": [{
                            "type": "Email",
                            "value": ""
                        }, {
                            "type": "HomePhone",
                            "value": ""
                        }, {
                            "type": "MobilePhone",
                            "value": ""
                        }]
                    },
                    "payments": [],
                    "warrantyBeingPurchased": false,
                    "saleComplete": false,
                    "searchItem": null,
                    "originalOrder": {
                        "ReceiptNumber": "4y7467456",
                        "Order": {
                            "Total": 2515.89,
                            "PaymentsTotal": 0,
                            "ChangeTotal": 0,
                            "Balance": 0,
                            "Customer": null,
                            "Payments": [{
                                "Method": "Cash",
                                "Amount": 2515.89
                            }],
                            "SaleComplete": false,
                            "items": [{
                                "ItemNumber": "000500",
                                "Price": 16.89,
                                "Quantity": 1,
                                "Description": "WHIRLPOOL WHIRLPOOL",
                                "Installations": null,
                                "Warranties": null,
                                "$$hashKey": "02U",
                                "exchange": true,
                                "exchangeQuantity": 1
                            }, {
                                "ItemNumber": "300047",
                                "Price": 2499,
                                "Quantity": 2,
                                "Description": "FRIGIDAIRE FRIGIDAIRE",
                                "Installations": null,
                                "Warranties": null,
                                "$$hashKey": "02W"
                            }]
                        }
                    },
                    "authorisationPending": false,
                    "authorisedBy": {
                        "Id": 99999,
                        "Login": "99999",
                        "Name": "System Administrator"
                    }
                };

                $httpBackend.expectPOST('/Sales/Orders/Save', scope.cart).respond({
                    Valid: true,
                    Errors: []
                });

                scope.finaliseSale();

                $httpBackend.flush();
            });

            it('should not allow the sale to be finalised when the refund/exchange has not been authorised', function () {
                createController();
                $httpBackend.flush();

                scope.cart = {
                    "items": [],
                    "total": 0,
                    "paymentsTotal": 0,
                    "credit": 16.89,
                    "changeTotal": 0,
                    "balance": -16.89,
                    "customer": {
                        "contacts": [{
                            "type": "Email",
                            "value": ""
                        }, {
                            "type": "HomePhone",
                            "value": ""
                        }, {
                            "type": "MobilePhone",
                            "value": ""
                        }]
                    },
                    "payments": [],
                    "warrantyBeingPurchased": false,
                    "saleComplete": false,
                    "searchItem": null,
                    "originalOrder": {
                        "ReceiptNumber": "4y7467456",
                        "Order": {
                            "Total": 2515.89,
                            "PaymentsTotal": 0,
                            "ChangeTotal": 0,
                            "Balance": 0,
                            "Customer": null,
                            "Payments": [{
                                "Method": "Cash",
                                "Amount": 2515.89
                            }],
                            "SaleComplete": false,
                            "items": [{
                                "ItemNumber": "000500",
                                "Price": 16.89,
                                "Quantity": 1,
                                "Description": "WHIRLPOOL WHIRLPOOL",
                                "Installations": null,
                                "Warranties": null,
                                "$$hashKey": "02U",
                                "exchange": true,
                                "exchangeQuantity": 1
                            }, {
                                "ItemNumber": "300047",
                                "Price": 2499,
                                "Quantity": 2,
                                "Description": "FRIGIDAIRE FRIGIDAIRE",
                                "Installations": null,
                                "Warranties": null,
                                "$$hashKey": "02W"
                            }]
                        }
                    },
                    "authorisationPending": false
                };

                var canFinalise = scope.enableFinaliseSale();

                expect(canFinalise).toBe(false);
            });

            it('should not allow the sale to be finalised when customer details have not been entered', function () {
                createController();
                $httpBackend.flush();

                scope.cart.authorisedBy = {
                    Id: 99999,
                    Login: "99999",
                    Name: "System Administrator"
                };
                scope.cart.itemBeingReturned = true;

                var canFinalise = scope.enableFinaliseSale();

                expect(canFinalise).toBe(false);
            });

            it('should not allow the sale to be finalised when payment is pending', function () {
                createController();
                $httpBackend.flush();

                scope.cart.authorisedBy = {
                    Id: 99999,
                    Login: "99999",
                    Name: "System Administrator"
                };
                scope.cart.itemBeingReturned = true;
                scope.cart.customer.CustomerTitle = 'Mr';
                scope.cart.customer.CustomerFirstName = 'Ziggy';
                scope.cart.customer.CustomerLastName = 'Stardust';
                scope.cart.customer.CustomerAddressLine1 = 'Red dust lane';
                scope.cart.customer.CustomerTownOrCity = 'Mars';
                scope.cart.customer.CustomerPostcode = '656536';

                scope.cart.balance = 14;

                var canFinalise = scope.enableFinaliseSale();

                expect(canFinalise).toBe(false);
            });

            it('should not show the finalise button when sale is completed', function () {
                createController();
                $httpBackend.flush();

                scope.cart.authorisedBy = {
                    Id: 99999,
                    Login: "99999",
                    Name: "System Administrator"
                };
                scope.cart.itemBeingReturned = true;
                scope.cart.customer.CustomerTitle = 'Mr';
                scope.cart.customer.CustomerFirstName = 'Ziggy';
                scope.cart.customer.CustomerLastName = 'Stardust';
                scope.cart.customer.CustomerAddressLine1 = 'Red dust lane';
                scope.cart.customer.CustomerTownOrCity = 'Mars';
                scope.cart.customer.CustomerPostcode = '656536';

                scope.cart.balance = 0;
                scope.cart.saleComplete = true;

                var canFinalise = scope.enableFinaliseSale();

                expect(canFinalise).toBe(false);
            });

            it('should broadcast event for manual return', function () {
                createController();
                $httpBackend.flush();

                scope.manualReturn();

                expect(scope.$broadcast).toHaveBeenCalledWith('pos:return:manual');
            });

            afterEach(function () {
                $httpBackend.verifyNoOutstandingExpectation();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });
    });
});