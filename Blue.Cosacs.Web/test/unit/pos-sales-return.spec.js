/*global define, module, inject, describe, beforeEach, afterEach, it, expect, spyOn*/
define(['jquery', 'angular', 'angular.mock', 'Sales/pos'], function ($, angular, angularMock, salesController) {
    'use strict';

    describe('POS Controllers', function () {

        beforeEach(function () {
            salesController.init($('html'));
            module('myApp');
            localStorage.User = JSON.stringify({
                "BranchNumber": 900,
                "BranchName": "BRIDGETOWN 900",
                "MenuItems": []
            });
        });


        describe('SalesController:: Returns ::', function () {
            var scope, createController, $httpBackend, $dialog, rootScope;

            beforeEach(inject(function (_$httpBackend_, $rootScope, $controller, _$dialog_) {

                $dialog = _$dialog_;
                $httpBackend = _$httpBackend_;
                rootScope = $rootScope;

                $httpBackend.when('POST', '/Config/DecisionTable/Load/').respond('{}');

                var salesScope = $rootScope.$new();
                var createSalesController = function () {
                    return $controller('SalesController', {
                        $scope: salesScope
                    });
                };

                scope = salesScope.$new();
                createController = function () {
                    createSalesController();
                    return $controller('BasketController', {
                        $scope: salesScope,
                        $dialog: $dialog
                    });
                };

                spyOn($dialog, 'messageBox').andCallThrough();
                spyOn($dialog, 'dialog').andCallThrough();
                spyOn(rootScope, '$broadcast').andCallThrough();
            }));

            it('should request order details from server', function () {
                createController();
                $httpBackend.flush();

                $httpBackend.expectGET('Sales/Pos/GetItemsForReceipt?receiptNumber=123123').respond({});
                scope.$emit('pos:receipt:load', '123123');
                $httpBackend.flush();
            });

            it('should populate retrieved order details as original order', function () {
                createController();
                $httpBackend.flush();

                $httpBackend.expectGET('Sales/Pos/GetItemsForReceipt?receiptNumber=123123').respond({
                    ReceiptNumber: '123123',
                    Order: {
                        Items: [{
                            itemNumber: '245425',
                            price: 591.33,
                            description: 'Item description',
                            quantity: 1
                        }]
                    }
                });

                scope.$emit('pos:receipt:load', '123123');
                $httpBackend.flush();

                expect(scope.cart.originalOrder).toBeDefined();
                expect(scope.cart.originalOrder.ReceiptNumber).toBe('123123');
            });

            it('should mark the item as being returned', function () {
                createController();
                $httpBackend.flush();

                scope.cart.originalOrder = {
                    ReceiptNumber: '123123',
                    Order: {
                        items: [{
                            itemNumber: '245425',
                            price: 591.33,
                            description: 'Item description',
                            quantity: 1
                        }, {
                            itemNumber: '785465',
                            price: 291.33,
                            description: 'Item description',
                            quantity: 1
                        }]
                    }
                };

                scope.returnItem(scope.cart.originalOrder.Order.items[0]);

                expect(scope.cart.originalOrder.Order.items[0].returned).toBe(true);
            });

            it('should set the return quantity for item being returned', function () {
                createController();
                $httpBackend.flush();

                scope.cart.originalOrder = {
                    ReceiptNumber: '123123',
                    Order: {
                        items: [{
                            itemNumber: '245425',
                            price: 591.33,
                            description: 'Item description',
                            quantity: 1
                        }, {
                            itemNumber: '785465',
                            price: 291.33,
                            description: 'Item description',
                            quantity: 1
                        }]
                    }
                };

                scope.returnItem(scope.cart.originalOrder.Order.items[0]);

                expect(scope.cart.originalOrder.Order.items[0].returnQuantity).toBe(1);
            });

            it('should set return quantity the same as item quantity by default', function () {
                createController();
                $httpBackend.flush();

                scope.cart.originalOrder = {
                    ReceiptNumber: '123123',
                    Order: {
                        items: [{
                            itemNumber: '245425',
                            price: 591.33,
                            description: 'Item description',
                            quantity: 1
                        }, {
                            itemNumber: '785465',
                            price: 291.33,
                            description: 'Item description',
                            quantity: 2
                        }]
                    }
                };

                scope.returnItem(scope.cart.originalOrder.Order.items[1]);

                expect(scope.cart.originalOrder.Order.items[1].returnQuantity).toBe(2);
            });

            it('should decrease return quantity', function () {
                createController();
                $httpBackend.flush();

                scope.cart.originalOrder = {
                    ReceiptNumber: '123123',
                    Order: {
                        items: [{
                            itemNumber: '245425',
                            price: 591.33,
                            description: 'Item description',
                            quantity: 1
                        }, {
                            itemNumber: '785465',
                            price: 291.33,
                            description: 'Item description',
                            quantity: 2,
                            returnQuantity: 2
                        }]
                    }
                };

                scope.decreaseReturnQuantity(scope.cart.originalOrder.Order.items[1]);

                expect(scope.cart.originalOrder.Order.items[1].returnQuantity).toBe(1);
            });

            it('should not reduce return quantity lower than one', function () {
                createController();
                $httpBackend.flush();

                scope.cart.originalOrder = {
                    ReceiptNumber: '123123',
                    Order: {
                        items: [{
                            itemNumber: '245425',
                            price: 591.33,
                            description: 'Item description',
                            quantity: 1
                        }, {
                            itemNumber: '785465',
                            price: 291.33,
                            description: 'Item description',
                            quantity: 2,
                            returnQuantity: 2
                        }]
                    }
                };

                scope.decreaseReturnQuantity(scope.cart.originalOrder.Order.items[1]);
                scope.decreaseReturnQuantity(scope.cart.originalOrder.Order.items[1]);

                expect(scope.cart.originalOrder.Order.items[1].returnQuantity).toBe(1);
            });

            it('should increase the return quantity', function () {
                createController();
                $httpBackend.flush();

                scope.cart.originalOrder = {
                    ReceiptNumber: '123123',
                    Order: {
                        items: [{
                            itemNumber: '245425',
                            price: 591.33,
                            description: 'Item description',
                            quantity: 1
                        }, {
                            itemNumber: '785465',
                            price: 291.33,
                            description: 'Item description',
                            quantity: 2,
                            returnQuantity: 1
                        }]
                    }
                };

                scope.increaseReturnQuantity(scope.cart.originalOrder.Order.items[1]);

                expect(scope.cart.originalOrder.Order.items[1].returnQuantity).toBe(2);
            });

            it('should not increase the return quantity more than the item quantity', function () {
                createController();
                $httpBackend.flush();

                scope.cart.originalOrder = {
                    ReceiptNumber: '123123',
                    Order: {
                        items: [{
                            itemNumber: '245425',
                            price: 591.33,
                            description: 'Item description',
                            quantity: 1
                        }, {
                            itemNumber: '785465',
                            price: 291.33,
                            description: 'Item description',
                            quantity: 2,
                            returnQuantity: 1
                        }]
                    }
                };

                scope.increaseReturnQuantity(scope.cart.originalOrder.Order.items[1]);
                scope.increaseReturnQuantity(scope.cart.originalOrder.Order.items[1]);

                expect(scope.cart.originalOrder.Order.items[1].returnQuantity).toBe(2);
            });

            it('should clear the return flag', function () {
                createController();
                $httpBackend.flush();

                scope.cart.originalOrder = {
                    ReceiptNumber: '123123',
                    Order: {
                        items: [{
                            itemNumber: '245425',
                            price: 591.33,
                            description: 'Item description',
                            quantity: 1
                        }, {
                            itemNumber: '785465',
                            price: 291.33,
                            description: 'Item description',
                            quantity: 1
                        }]
                    }
                };

                scope.returnItem(scope.cart.originalOrder.Order.items[0]);
                scope.cancelReturn(scope.cart.originalOrder.Order.items[0]);

                expect(scope.cart.originalOrder.Order.items[0].returned).toBe(false);
            });

            it('should clear the return quantity', function () {
                createController();
                $httpBackend.flush();

                scope.cart.originalOrder = {
                    ReceiptNumber: '123123',
                    Order: {
                        items: [{
                            itemNumber: '245425',
                            price: 591.33,
                            description: 'Item description',
                            quantity: 1
                        }, {
                            itemNumber: '785465',
                            price: 291.33,
                            description: 'Item description',
                            quantity: 1
                        }]
                    }
                };

                scope.returnItem(scope.cart.originalOrder.Order.items[0]);
                scope.cancelReturn(scope.cart.originalOrder.Order.items[0]);

                expect(scope.cart.originalOrder.Order.items[0].returnQuantity).toBe(0);
            });

            it('should set authorisation required flag when an item is being returned', function () {
                createController();
                $httpBackend.flush();

                scope.cart.originalOrder = {
                    ReceiptNumber: '123123',
                    Order: {
                        items: [{
                            itemNumber: '245425',
                            price: 591.33,
                            description: 'Item description',
                            quantity: 1
                        }, {
                            itemNumber: '785465',
                            price: 291.33,
                            description: 'Item description',
                            quantity: 1
                        }]
                    }
                };

                scope.returnItem(scope.cart.originalOrder.Order.items[0]);

                expect(scope.cart.authorisationPending).toBe(true);
            });

            it('should clear authorisation required flag when no items are being returned', function () {
                createController();
                $httpBackend.flush();

                scope.cart.originalOrder = {
                    ReceiptNumber: '123123',
                    Order: {
                        items: [{
                            itemNumber: '245425',
                            price: 591.33,
                            description: 'Item description',
                            quantity: 1
                        }, {
                            itemNumber: '785465',
                            price: 291.33,
                            description: 'Item description',
                            quantity: 1
                        }]
                    }
                };

                scope.returnItem(scope.cart.originalOrder.Order.items[0]);
                scope.returnItem(scope.cart.originalOrder.Order.items[1]);

                scope.cancelReturn(scope.cart.originalOrder.Order.items[0]);

                expect(scope.cart.authorisationPending).toBe(true);

                scope.cancelReturn(scope.cart.originalOrder.Order.items[1]);
                expect(scope.cart.authorisationPending).toBe(false);
            });

            it('should add amount for returned item as credit', function () {
                createController();
                $httpBackend.flush();

                scope.cart.originalOrder = {
                    ReceiptNumber: '123123',
                    Order: {
                        items: [{
                            itemNumber: '245425',
                            price: 591.33,
                            description: 'Item description',
                            quantity: 1
                        }, {
                            itemNumber: '785465',
                            price: 291.33,
                            description: 'Item description',
                            quantity: 1
                        }]
                    }
                };

                scope.returnItem(scope.cart.originalOrder.Order.items[0]);

                expect(scope.cart.credit).toBe(591.33);
            });

            it('should remove credit amount for returned item when return is cancelled', function () {
                createController();
                $httpBackend.flush();

                scope.cart.originalOrder = {
                    ReceiptNumber: '123123',
                    Order: {
                        items: [{
                            itemNumber: '245425',
                            price: 591.33,
                            taxAmount: 59.1,
                            description: 'Item description',
                            quantity: 1
                        }, {
                            itemNumber: '785465',
                            price: 291.33,
                            description: 'Item description',
                            quantity: 1
                        }]
                    }
                };

                scope.returnItem(scope.cart.originalOrder.Order.items[0]);
                scope.cancelReturn(scope.cart.originalOrder.Order.items[0]);

                expect(scope.cart.credit).toBe(0);
            });

            it('should update balance when return is cancelled', function () {
                createController();
                $httpBackend.flush();

                scope.cart.originalOrder = {
                    ReceiptNumber: '123123',
                    Order: {
                        items: [{
                            itemNumber: '245425',
                            price: 591.33,
                            description: 'Item description',
                            quantity: 1
                        }, {
                            itemNumber: '785465',
                            price: 291.33,
                            description: 'Item description',
                            quantity: 1
                        }]
                    }
                };

                scope.returnItem(scope.cart.originalOrder.Order.items[0]);

                expect(scope.cart.balance).toBe(-591.33);

                scope.cancelReturn(scope.cart.originalOrder.Order.items[0]);
                expect(scope.cart.balance).toBe(0);
            });

            it('should reduce credit amount for returned item when quantity is decreased', function () {
                createController();
                $httpBackend.flush();

                scope.cart.originalOrder = {
                    ReceiptNumber: '123123',
                    Order: {
                        items: [{
                            itemNumber: '245425',
                            price: 591.33,
                            taxAmount: 59.1,
                            description: 'Item description',
                            quantity: 2
                        }, {
                            itemNumber: '785465',
                            price: 291.33,
                            description: 'Item description',
                            quantity: 1
                        }]
                    }
                };

                scope.returnItem(scope.cart.originalOrder.Order.items[0]);

                expect(scope.cart.credit).toBe(Math.round((591.33 + 59.1) * 2 * 100) / 100);

                scope.decreaseReturnQuantity(scope.cart.originalOrder.Order.items[0]);

                expect(scope.cart.credit).toBe(Math.round((591.33 + 59.1) * 100) / 100);
            });

            it('should update balance when return quantity is decreased', function () {
                createController();
                $httpBackend.flush();

                scope.cart.originalOrder = {
                    ReceiptNumber: '123123',
                    Order: {
                        items: [{
                            itemNumber: '245425',
                            price: 591.33,
                            taxAmount: 59.1,
                            description: 'Item description',
                            quantity: 2
                        }, {
                            itemNumber: '785465',
                            price: 291.33,
                            description: 'Item description',
                            quantity: 1
                        }]
                    }
                };

                scope.returnItem(scope.cart.originalOrder.Order.items[0]);

                expect(scope.cart.balance).toBe(Math.round((-591.33 - 59.1) * 2 * 100) / 100);

                scope.decreaseReturnQuantity(scope.cart.originalOrder.Order.items[0]);

                expect(scope.cart.balance).toBe(Math.round((-591.33 - 59.1) * 100) / 100);
            });

            it('should increase credit amount for returned item when quantity is increased', function () {
                createController();
                $httpBackend.flush();

                scope.cart.originalOrder = {
                    ReceiptNumber: '123123',
                    Order: {
                        items: [{
                            itemNumber: '245425',
                            price: 591.33,
                            taxAmount: 59.1,
                            description: 'Item description',
                            quantity: 2
                        }, {
                            itemNumber: '785465',
                            price: 291.33,
                            description: 'Item description',
                            quantity: 1
                        }]
                    }
                };

                scope.returnItem(scope.cart.originalOrder.Order.items[0]);
                scope.decreaseReturnQuantity(scope.cart.originalOrder.Order.items[0]);
                scope.increaseReturnQuantity(scope.cart.originalOrder.Order.items[0]);

                expect(scope.cart.credit).toBe(Math.round((591.33 + 59.1) * 2 * 100) / 100);
            });

            it('should factor in credit amount when calculating balance due', function () {
                createController();
                $httpBackend.flush();

                scope.cart.originalOrder = {
                    ReceiptNumber: '123123',
                    Order: {
                        items: [{
                            itemNumber: '245425',
                            price: 591.33,
                            description: 'Item description',
                            quantity: 1
                        }, {
                            itemNumber: '785465',
                            price: 291.33,
                            description: 'Item description',
                            quantity: 1
                        }]
                    }
                };

                scope.returnItem(scope.cart.originalOrder.Order.items[0]);

                expect(scope.cart.balance).toBe(-591.33);
            });

            it('should factor in credit amount when return quantity is decreased', function () {
                createController();
                $httpBackend.flush();

                scope.cart.originalOrder = {
                    ReceiptNumber: '123123',
                    Order: {
                        items: [{
                            itemNumber: '245425',
                            price: 591.33,
                            description: 'Item description',
                            quantity: 2
                        }, {
                            itemNumber: '785465',
                            price: 291.33,
                            description: 'Item description',
                            quantity: 1
                        }]
                    }
                };

                scope.returnItem(scope.cart.originalOrder.Order.items[0]);

                expect(scope.cart.balance).toBe(-591.33 * 2);

                scope.decreaseReturnQuantity(scope.cart.originalOrder.Order.items[0]);

                expect(scope.cart.balance).toBe(-591.33);
            });

            it('should factor in credit amount when return quantity is increased', function () {
                createController();
                $httpBackend.flush();

                scope.cart.originalOrder = {
                    ReceiptNumber: '123123',
                    Order: {
                        items: [{
                            itemNumber: '245425',
                            price: 591.33,
                            description: 'Item description',
                            quantity: 2
                        }, {
                            itemNumber: '785465',
                            price: 291.33,
                            description: 'Item description',
                            quantity: 1
                        }]
                    }
                };

                scope.returnItem(scope.cart.originalOrder.Order.items[0]);
                scope.decreaseReturnQuantity(scope.cart.originalOrder.Order.items[0]);
                scope.increaseReturnQuantity(scope.cart.originalOrder.Order.items[0]);

                expect(scope.cart.balance).toBe(-591.33 * 2);
            });

            it('should save details of the authorisation on the cart', function () {
                createController();
                $httpBackend.flush();

                scope.cart.originalOrder = {
                    ReceiptNumber: '123123',
                    Order: {
                        items: [{
                            itemNumber: '245425',
                            price: 591.33,
                            description: 'Item description',
                            quantity: 2
                        }, {
                            itemNumber: '785465',
                            price: 291.33,
                            description: 'Item description',
                            quantity: 1
                        }]
                    }
                };

                var user = {
                    Id: '8455',
                    Login: 'manager',
                    Name: 'The Manager'
                };

                scope.$emit('authorisationSuccess', {
                    authorisedBy: user
                });

                expect(scope.cart.authorisedBy).toBeDefined();
                expect(scope.cart.authorisedBy).toBe(user);
            });

            it('should show the basket view when exchange/refund is selected', function () {
                createController();
                $httpBackend.flush();

                $httpBackend.expectGET('Sales/Pos/GetItemsForReceipt?receiptNumber=123123').respond({
                    ReceiptNumber: '123123',
                    Order: {
                        Items: [{
                            itemNumber: '245425',
                            price: 591.33,
                            description: 'Item description',
                            quantity: 1
                        }]
                    }
                });

                scope.$emit('pos:receipt:load', '123123');
                $httpBackend.flush();

                expect(scope.views.itemList.visible).toBe(true);
            });

            it('should set a flag when an item is being returned/exchanged', function () {
                createController();
                $httpBackend.flush();

                scope.cart.originalOrder = {
                    ReceiptNumber: '123123',
                    Order: {
                        items: [{
                            itemNumber: '245425',
                            price: 591.33,
                            description: 'Item description',
                            quantity: 2
                        }, {
                            itemNumber: '785465',
                            price: 291.33,
                            description: 'Item description',
                            quantity: 1
                        }]
                    }
                };

                scope.returnItem(scope.cart.originalOrder.Order.items[0]);

                expect(scope.cart.itemBeingReturned).toBeDefined();
                expect(scope.cart.itemBeingReturned).toBe(true);
            });

            it('should clear the item being returned flag when a return/exchange is cancelled', function () {
                createController();
                $httpBackend.flush();

                scope.cart.originalOrder = {
                    ReceiptNumber: '123123',
                    Order: {
                        items: [{
                            itemNumber: '245425',
                            price: 591.33,
                            description: 'Item description',
                            quantity: 2
                        }, {
                            itemNumber: '785465',
                            price: 291.33,
                            description: 'Item description',
                            quantity: 1
                        }]
                    }
                };

                scope.returnItem(scope.cart.originalOrder.Order.items[0]);
                scope.cancelReturn(scope.cart.originalOrder.Order.items[0]);

                expect(scope.cart.itemBeingReturned).toBe(false);
            });

            it('should mark the free warranty as being returned when the item is returned', function () {
                createController();
                $httpBackend.flush();

                scope.cart.originalOrder = {
                    ReceiptNumber: "235764",
                    Order: {
                        Total: 2515.89,
                        PaymentsTotal: 0,
                        ChangeTotal: 0,
                        Balance: 0,
                        Customer: {
                            CustomerTitle: 'asd',
                            CustomerFirstName: 'asd',
                            CustomerLastName: 'asd',
                            CustomerAddressLine1: 'asd',
                            CustomerTownOrCity: 'asd',
                            CustomerPostcode: 'asd'
                        },
                        Payments: [{
                            Method: 'Cash',
                            Amount: 2515.89
                        }],
                        SaleComplete: false,
                        items: [{
                            itemNumber: "000500",
                            price: 16.89,
                            quantity: 1,
                            description: "WHIRLPOOL WHIRLPOOL",
                            Installations: null,
                            warranties: [{
                                warrantyLink: {
                                    Id: 15,
                                    Number: "1356426546",
                                    description: "Manufacturer warranty",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: true
                                },
                                price: {
                                    RetailPrice: 0,
                                    returnAmount: 0
                                }
                            }]
                        }, {
                            itemNumber: "300047",
                            price: 2499,
                            quantity: 2,
                            description: "FRIGIDAIRE FRIGIDAIRE",
                            Installations: null,
                            warranties: [{
                                warrantyLink: {
                                    Id: 15,
                                    Number: "1356426546",
                                    description: "Manufacturer warranty",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: true
                                },
                                price: {
                                    RetailPrice: 0,
                                    ReturnAmount: 0
                                }
                            }, {
                                warrantyLink: {
                                    Id: 15,
                                    Number: "1356426546",
                                    description: "Manufacturer warranty",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: true
                                },
                                price: {
                                    RetailPrice: 0,
                                    ReturnAmount: 0
                                }
                            }, {
                                warrantyLink: {
                                    Id: 35,
                                    Number: "782464365",
                                    description: "Extended warranty",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: false
                                },
                                price: {
                                    RetailPrice: 249.99,
                                    ReturnAmount: 199.99
                                }
                            }]
                        }]
                    }
                };

                scope.returnItem(scope.cart.originalOrder.Order.items[0]);

                expect(scope.cart.originalOrder.Order.items[0].warranties[0].returned).toBeDefined();
                expect(scope.cart.originalOrder.Order.items[0].warranties[0].returned).toBe(true);
            });

            it('should mark the extended warranty as being returned when there is only one item and one warranty', function () {
                createController();
                $httpBackend.flush();

                scope.cart.originalOrder = {
                    ReceiptNumber: "235764",
                    Order: {
                        Total: 2515.89,
                        PaymentsTotal: 0,
                        ChangeTotal: 0,
                        Balance: 0,
                        Customer: {
                            CustomerTitle: 'asd',
                            CustomerFirstName: 'asd',
                            CustomerLastName: 'asd',
                            CustomerAddressLine1: 'asd',
                            CustomerTownOrCity: 'asd',
                            CustomerPostcode: 'asd'
                        },
                        Payments: [{
                            Method: 'Cash',
                            Amount: 2515.89
                        }],
                        SaleComplete: false,
                        items: [{
                            itemNumber: "000500",
                            price: 16.89,
                            quantity: 1,
                            description: "WHIRLPOOL WHIRLPOOL",
                            Installations: null,
                            warranties: [{
                                warrantyLink: {
                                    Id: 15,
                                    Number: "1356426546",
                                    description: "Manufacturer warranty",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: true
                                },
                                price: {
                                    RetailPrice: 0,
                                    ReturnAmount: 0
                                }
                            }]
                        }, {
                            itemNumber: "300047",
                            price: 2499,
                            quantity: 1,
                            description: "FRIGIDAIRE FRIGIDAIRE",
                            Installations: null,
                            warranties: [{
                                warrantyLink: {
                                    Id: 15,
                                    Number: "1356426546",
                                    description: "Manufacturer warranty",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: true
                                },
                                price: {
                                    RetailPrice: 0,
                                    ReturnAmount: 0
                                }
                            }, {
                                warrantyLink: {
                                    Id: 35,
                                    Number: "782464365",
                                    description: "Extended warranty",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: false
                                },
                                price: {
                                    RetailPrice: 249.99,
                                    ReturnAmount: 199.99
                                }
                            }]
                        }]
                    }
                };

                scope.returnItem(scope.cart.originalOrder.Order.items[1]);

                expect(scope.cart.originalOrder.Order.items[1].warranties[1].returned).toBeDefined();
                expect(scope.cart.originalOrder.Order.items[1].warranties[1].returned).toBe(true);
            });

            it('should add the return amount for the extended warranty to the credit amount when item is being returned', function () {
                createController();
                $httpBackend.flush();

                scope.cart.originalOrder = {
                    ReceiptNumber: "235764",
                    Order: {
                        total: 2515.89,
                        paymentsTotal: 0,
                        changeTotal: 0,
                        balance: 0,
                        Customer: {
                            CustomerTitle: 'asd',
                            CustomerFirstName: 'asd',
                            CustomerLastName: 'asd',
                            CustomerAddressLine1: 'asd',
                            CustomerTownOrCity: 'asd',
                            CustomerPostcode: 'asd'
                        },
                        payments: [{
                            Method: 'Cash',
                            Amount: 2515.89
                        }],
                        saleComplete: false,
                        items: [{
                            itemNumber: "000500",
                            price: 16.89,
                            quantity: 1,
                            description: "WHIRLPOOL WHIRLPOOL",
                            installations: null,
                            warranties: [{
                                warrantyLink: {
                                    Id: 15,
                                    Number: "1356426546",
                                    description: "Manufacturer warranty",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: true
                                },
                                price: {
                                    RetailPrice: 0,
                                    returnAmount: 0
                                }
                            }]
                        }, {
                            itemNumber: "300047",
                            price: 2499,
                            quantity: 1,
                            description: "FRIGIDAIRE FRIGIDAIRE",
                            Installations: null,
                            warranties: [{
                                warrantyLink: {
                                    Id: 15,
                                    Number: "1356426546",
                                    description: "Manufacturer warranty",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: true
                                },
                                price: {
                                    RetailPrice: 0,
                                    ReturnAmount: 0
                                }
                            }, {
                                warrantyLink: {
                                    Id: 35,
                                    Number: "782464365",
                                    description: "Extended warranty",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: false
                                },
                                price: {
                                    RetailPrice: 249.99,
                                    ReturnTaxAmount: 25,
                                    ReturnAmount: 199.99
                                }
                            }]
                        }]
                    }
                };

                scope.returnItem(scope.cart.originalOrder.Order.items[1]);

                expect(scope.cart.credit).toBe(2499 + 199.99 + 25);
            });

            it('should mark all the warranties as being returned when there are multiple items and warranties', function () {
                createController();
                $httpBackend.flush();

                scope.cart.originalOrder = {
                    ReceiptNumber: "235764",
                    Order: {
                        Total: 2515.89,
                        PaymentsTotal: 0,
                        ChangeTotal: 0,
                        Balance: 0,
                        Customer: {
                            CustomerTitle: 'asd',
                            CustomerFirstName: 'asd',
                            CustomerLastName: 'asd',
                            CustomerAddressLine1: 'asd',
                            CustomerTownOrCity: 'asd',
                            CustomerPostcode: 'asd'
                        },
                        Payments: [{
                            Method: 'Cash',
                            Amount: 2515.89
                        }],
                        SaleComplete: false,
                        items: [{
                            itemNumber: "000500",
                            price: 16.89,
                            quantity: 1,
                            description: "WHIRLPOOL WHIRLPOOL",
                            Installations: null,
                            warranties: [{
                                Id: 15,
                                Number: "1356426546",
                                description: "Manufacturer warranty",
                                Length: 12,
                                TaxRate: 12.5,
                                RetailPrice: 0,
                                returnAmount: 0,
                                IsFree: true
                            }]
                        }, {
                            itemNumber: "300047",
                            price: 2499,
                            quantity: 2,
                            description: "FRIGIDAIRE FRIGIDAIRE",
                            Installations: null,
                            warranties: [{
                                warrantyLink: {
                                    Id: 15,
                                    Number: "1356426546",
                                    description: "Manufacturer warranty",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: true
                                }, price: {
                                    RetailPrice: 0,
                                    ReturnAmount: 0
                                }
                            }, {
                                warrantyLink: {
                                    Id: 15,
                                    Number: "1356426546",
                                    description: "Manufacturer warranty",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: true
                                }, price: {
                                    RetailPrice: 0,
                                    ReturnAmount: 0
                                }
                            }, {
                                warrantyLink: {
                                    Id: 35,
                                    Number: "782464365",
                                    description: "Extended warranty 1",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: false
                                }, price: {
                                    RetailPrice: 349.99,
                                    ReturnAmount: 299.99
                                }
                            }, {
                                warrantyLink: {
                                    Id: 37,
                                    Number: "567567565",
                                    description: "Extended warranty 2",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: false
                                }, price: {
                                    RetailPrice: 249.99,
                                    ReturnAmount: 199.99
                                }
                            }]
                        }]
                    }
                };

                scope.returnItem(scope.cart.originalOrder.Order.items[1]);

                expect(scope.cart.originalOrder.Order.items[1].warranties[0].returned).toBeDefined();
                expect(scope.cart.originalOrder.Order.items[1].warranties[0].returned).toBe(true);

                expect(scope.cart.originalOrder.Order.items[1].warranties[1].returned).toBeDefined();
                expect(scope.cart.originalOrder.Order.items[1].warranties[1].returned).toBe(true);

                expect(scope.cart.originalOrder.Order.items[1].warranties[2].returned).toBeDefined();
                expect(scope.cart.originalOrder.Order.items[1].warranties[2].returned).toBe(true);

                expect(scope.cart.originalOrder.Order.items[1].warranties[3].returned).toBeDefined();
                expect(scope.cart.originalOrder.Order.items[1].warranties[3].returned).toBe(true);
            });

            it('should keep all the warranties when the return of an item is cancelled', function () {
                createController();
                $httpBackend.flush();

                scope.cart.originalOrder = {
                    ReceiptNumber: "235764",
                    Order: {
                        Total: 2515.89,
                        PaymentsTotal: 0,
                        ChangeTotal: 0,
                        Balance: 0,
                        Customer: {
                            CustomerTitle: 'asd',
                            CustomerFirstName: 'asd',
                            CustomerLastName: 'asd',
                            CustomerAddressLine1: 'asd',
                            CustomerTownOrCity: 'asd',
                            CustomerPostcode: 'asd'
                        },
                        Payments: [{
                            Method: 'Cash',
                            Amount: 2515.89
                        }],
                        SaleComplete: false,
                        items: [{
                            itemNumber: "000500",
                            price: 16.89,
                            quantity: 1,
                            description: "WHIRLPOOL WHIRLPOOL",
                            Installations: null,
                            warranties: [{
                                Id: 15,
                                Number: "1356426546",
                                description: "Manufacturer warranty",
                                Length: 12,
                                TaxRate: 12.5,
                                RetailPrice: 0,
                                returnAmount: 0,
                                IsFree: true
                            }]
                        }, {
                            itemNumber: "300047",
                            price: 2499,
                            quantity: 2,
                            description: "FRIGIDAIRE FRIGIDAIRE",
                            Installations: null,
                            warranties: [{
                                warrantyLink: {
                                    Id: 15,
                                    Number: "1356426546",
                                    description: "Manufacturer warranty",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: true
                                }, price: {
                                    RetailPrice: 0,
                                    ReturnAmount: 0
                                }
                            }, {
                                warrantyLink: {
                                    Id: 15,
                                    Number: "1356426546",
                                    description: "Manufacturer warranty",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: true
                                }, price: {
                                    RetailPrice: 0,
                                    ReturnAmount: 0
                                }
                            }, {
                                warrantyLink: {
                                    Id: 35,
                                    Number: "782464365",
                                    description: "Extended warranty 1",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: false
                                }, price: {
                                    RetailPrice: 349.99,
                                    ReturnAmount: 299.99
                                }
                            }, {
                                warrantyLink: {
                                    Id: 37,
                                    Number: "567567565",
                                    description: "Extended warranty 2",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: false
                                }, price: {
                                    RetailPrice: 249.99,
                                    ReturnAmount: 199.99
                                }
                            }]
                        }]
                    }
                };

                scope.returnItem(scope.cart.originalOrder.Order.items[1]);
                scope.cancelReturn(scope.cart.originalOrder.Order.items[1]);

                expect(scope.cart.originalOrder.Order.items[1].warranties[0].returned).toBe(false);
                expect(scope.cart.originalOrder.Order.items[1].warranties[1].returned).toBe(false);
                expect(scope.cart.originalOrder.Order.items[1].warranties[2].returned).toBe(false);
                expect(scope.cart.originalOrder.Order.items[1].warranties[3].returned).toBe(false);
            });

            it('should remove the credit amount for the warranties when the return of an item is cancelled', function () {
                createController();
                $httpBackend.flush();

                scope.cart.originalOrder = {
                    ReceiptNumber: "235764",
                    Order: {
                        Total: 2515.89,
                        PaymentsTotal: 0,
                        ChangeTotal: 0,
                        Balance: 0,
                        Customer: {
                            CustomerTitle: 'asd',
                            CustomerFirstName: 'asd',
                            CustomerLastName: 'asd',
                            CustomerAddressLine1: 'asd',
                            CustomerTownOrCity: 'asd',
                            CustomerPostcode: 'asd'
                        },
                        Payments: [{
                            Method: 'Cash',
                            Amount: 2515.89
                        }],
                        SaleComplete: false,
                        items: [{
                            itemNumber: "000500",
                            price: 16.89,
                            quantity: 1,
                            description: "WHIRLPOOL WHIRLPOOL",
                            Installations: null,
                            warranties: [{
                                Id: 15,
                                Number: "1356426546",
                                description: "Manufacturer warranty",
                                Length: 12,
                                TaxRate: 12.5,
                                RetailPrice: 0,
                                returnAmount: 0,
                                IsFree: true
                            }]
                        }, {
                            itemNumber: "300047",
                            price: 2499,
                            quantity: 2,
                            description: "FRIGIDAIRE FRIGIDAIRE",
                            Installations: null,
                            warranties: [{
                                warrantyLink: {
                                    Id: 15,
                                    Number: "1356426546",
                                    description: "Manufacturer warranty",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: true
                                }, price: {
                                    RetailPrice: 0,
                                    ReturnAmount: 0
                                }
                            }, {
                                warrantyLink: {
                                    Id: 15,
                                    Number: "1356426546",
                                    description: "Manufacturer warranty",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: true
                                }, price: {
                                    RetailPrice: 0,
                                    ReturnAmount: 0
                                }
                            }, {
                                warrantyLink: {
                                    Id: 35,
                                    Number: "782464365",
                                    description: "Extended warranty 1",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: false
                                }, price: {
                                    RetailPrice: 349.99,
                                    ReturnAmount: 299.99
                                }
                            }, {
                                warrantyLink: {
                                    Id: 37,
                                    Number: "567567565",
                                    description: "Extended warranty 2",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: false
                                }, price: {
                                    RetailPrice: 249.99,
                                    ReturnAmount: 199.99
                                }
                            }]
                        }]
                    }
                };

                scope.returnItem(scope.cart.originalOrder.Order.items[1]);
                scope.cancelReturn(scope.cart.originalOrder.Order.items[1]);

                expect(scope.cart.credit).toBe(0);
            });

            it('should allow the warranty to be kept', function () {
                createController();
                $httpBackend.flush();

                scope.cart.originalOrder = {
                    ReceiptNumber: "235764",
                    Order: {
                        Total: 2515.89,
                        PaymentsTotal: 0,
                        ChangeTotal: 0,
                        Balance: 0,
                        Customer: {
                            CustomerTitle: 'asd',
                            CustomerFirstName: 'asd',
                            CustomerLastName: 'asd',
                            CustomerAddressLine1: 'asd',
                            CustomerTownOrCity: 'asd',
                            CustomerPostcode: 'asd'
                        },
                        Payments: [{
                            Method: 'Cash',
                            Amount: 2515.89
                        }],
                        SaleComplete: false,
                        items: [{
                            itemNumber: "000500",
                            price: 16.89,
                            quantity: 1,
                            description: "WHIRLPOOL WHIRLPOOL",
                            Installations: null,
                            warranties: [{
                                Id: 15,
                                Number: "1356426546",
                                description: "Manufacturer warranty",
                                Length: 12,
                                TaxRate: 12.5,
                                RetailPrice: 0,
                                returnAmount: 0,
                                IsFree: true
                            }]
                        }, {
                            itemNumber: "300047",
                            price: 2499,
                            quantity: 2,
                            description: "FRIGIDAIRE FRIGIDAIRE",
                            Installations: null,
                            warranties: [{
                                warrantyLink: {
                                    Id: 15,
                                    Number: "1356426546",
                                    description: "Manufacturer warranty",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: true
                                }, price: {
                                    RetailPrice: 0,
                                    ReturnAmount: 0
                                }
                            }, {
                                warrantyLink: {
                                    Id: 15,
                                    Number: "1356426546",
                                    description: "Manufacturer warranty",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: true
                                }, price: {
                                    RetailPrice: 0,
                                    ReturnAmount: 0
                                }
                            }, {
                                warrantyLink: {
                                    Id: 35,
                                    Number: "782464365",
                                    description: "Extended warranty 1",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: false
                                }, price: {
                                    RetailPrice: 349.99,
                                    ReturnAmount: 299.99
                                }
                            }, {
                                warrantyLink: {
                                    Id: 37,
                                    Number: "567567565",
                                    description: "Extended warranty 2",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: false
                                }, price: {
                                    RetailPrice: 249.99,
                                    ReturnAmount: 199.99
                                }
                            }]
                        }]
                    }
                };

                scope.returnItem(scope.cart.originalOrder.Order.items[1]);
                scope.decreaseReturnQuantity(scope.cart.originalOrder.Order.items[1]);

                scope.cancelReturnWarranty(2, scope.cart.originalOrder.Order.items[1]);

                expect(scope.cart.originalOrder.Order.items[1].warranties[0].returned).toBe(true);
                expect(scope.cart.originalOrder.Order.items[1].warranties[1].returned).toBe(true);
                expect(scope.cart.originalOrder.Order.items[1].warranties[2].returned).toBe(false);
                expect(scope.cart.originalOrder.Order.items[1].warranties[3].returned).toBe(true);
            });

            it('should remove the credit amount for the warranty when the return of the warranty is cancelled', function () {
                createController();
                $httpBackend.flush();

                scope.cart.originalOrder = {
                    ReceiptNumber: "235764",
                    Order: {
                        Total: 2515.89,
                        PaymentsTotal: 0,
                        ChangeTotal: 0,
                        Balance: 0,
                        Customer: {
                            CustomerTitle: 'asd',
                            CustomerFirstName: 'asd',
                            CustomerLastName: 'asd',
                            CustomerAddressLine1: 'asd',
                            CustomerTownOrCity: 'asd',
                            CustomerPostcode: 'asd'
                        },
                        Payments: [{
                            Method: 'Cash',
                            Amount: 2515.89
                        }],
                        SaleComplete: false,
                        items: [{
                            itemNumber: "000500",
                            price: 16.89,
                            quantity: 1,
                            description: "WHIRLPOOL WHIRLPOOL",
                            Installations: null,
                            warranties: [{
                                Id: 15,
                                Number: "1356426546",
                                description: "Manufacturer warranty",
                                Length: 12,
                                TaxRate: 12.5,
                                RetailPrice: 0,
                                returnAmount: 0,
                                IsFree: true
                            }]
                        }, {
                            itemNumber: "300047",
                            price: 2499,
                            quantity: 2,
                            description: "FRIGIDAIRE FRIGIDAIRE",
                            Installations: null,
                            warranties: [{
                                warrantyLink: {
                                    Id: 15,
                                    Number: "1356426546",
                                    description: "Manufacturer warranty",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: true
                                }, price: {
                                    RetailPrice: 0,
                                    ReturnAmount: 0
                                }
                            }, {
                                warrantyLink: {
                                    Id: 15,
                                    Number: "1356426546",
                                    description: "Manufacturer warranty",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: true
                                }, price: {
                                    RetailPrice: 0,
                                    ReturnAmount: 0
                                }
                            }, {
                                warrantyLink: {
                                    Id: 35,
                                    Number: "782464365",
                                    description: "Extended warranty 1",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: false
                                }, price: {
                                    RetailPrice: 349.99,
                                    ReturnAmount: 299.99
                                }
                            }, {
                                warrantyLink: {
                                    Id: 37,
                                    Number: "567567565",
                                    description: "Extended warranty 2",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: false
                                }, price: {
                                    RetailPrice: 249.99,
                                    ReturnAmount: 199.99,
                                    ReturnTaxAmount: 25
                                }
                            }]
                        }]
                    }
                };

                scope.returnItem(scope.cart.originalOrder.Order.items[1]);
                scope.decreaseReturnQuantity(scope.cart.originalOrder.Order.items[1]);

                scope.cancelReturnWarranty(2, scope.cart.originalOrder.Order.items[1]);

                expect(scope.cart.credit).toBe(2499 + 199.99 + 25);
                expect(scope.cart.balance).toBe(-2499 - 199.99 - 25);
            });

            it('should not allow the warranty to be kept when there is only one item which already has a warranty', function () {
                createController();
                $httpBackend.flush();

                scope.cart.originalOrder = {
                    ReceiptNumber: "235764",
                    Order: {
                        Total: 2515.89,
                        PaymentsTotal: 0,
                        ChangeTotal: 0,
                        Balance: 0,
                        Customer: {
                            CustomerTitle: 'asd',
                            CustomerFirstName: 'asd',
                            CustomerLastName: 'asd',
                            CustomerAddressLine1: 'asd',
                            CustomerTownOrCity: 'asd',
                            CustomerPostcode: 'asd'
                        },
                        Payments: [{
                            Method: 'Cash',
                            Amount: 2515.89
                        }],
                        SaleComplete: false,
                        items: [{
                            itemNumber: "000500",
                            price: 16.89,
                            quantity: 1,
                            description: "WHIRLPOOL WHIRLPOOL",
                            Installations: null,
                            warranties: [{
                                Id: 15,
                                Number: "1356426546",
                                description: "Manufacturer warranty",
                                Length: 12,
                                TaxRate: 12.5,
                                RetailPrice: 0,
                                returnAmount: 0,
                                IsFree: true
                            }]
                        }, {
                            itemNumber: "300047",
                            price: 2499,
                            quantity: 2,
                            description: "FRIGIDAIRE FRIGIDAIRE",
                            Installations: null,
                            warranties: [{
                                warrantyLink: {
                                    Id: 15,
                                    Number: "1356426546",
                                    description: "Manufacturer warranty",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: true
                                }, price: {
                                    RetailPrice: 0,
                                    ReturnAmount: 0
                                }
                            }, {
                                warrantyLink: {
                                    Id: 15,
                                    Number: "1356426546",
                                    description: "Manufacturer warranty",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: true
                                }, price: {
                                    RetailPrice: 0,
                                    ReturnAmount: 0
                                }
                            }, {
                                warrantyLink: {
                                    Id: 35,
                                    Number: "782464365",
                                    description: "Extended warranty 1",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: false
                                }, price: {
                                    RetailPrice: 349.99,
                                    ReturnAmount: 299.99
                                }
                            }, {
                                warrantyLink: {
                                    Id: 37,
                                    Number: "567567565",
                                    description: "Extended warranty 2",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: false
                                }, price: {
                                    RetailPrice: 249.99,
                                    ReturnAmount: 199.99
                                }
                            }]
                        }]
                    }
                };

                scope.returnItem(scope.cart.originalOrder.Order.items[1]);
                scope.decreaseReturnQuantity(scope.cart.originalOrder.Order.items[1]);

                scope.cancelReturnWarranty(2, scope.cart.originalOrder.Order.items[1]);
                scope.cancelReturnWarranty(3, scope.cart.originalOrder.Order.items[1]);

                expect(scope.cart.originalOrder.Order.items[1].warranties[0].returned).toBe(true);
                expect(scope.cart.originalOrder.Order.items[1].warranties[1].returned).toBe(true);
                expect(scope.cart.originalOrder.Order.items[1].warranties[2].returned).toBe(false);
                expect(scope.cart.originalOrder.Order.items[1].warranties[3].returned).toBe(true, 'Should not be allowed to return second warranty');
            });

            it('should set a flag on the item when a warranty can not be kept', function () {
                createController();
                $httpBackend.flush();

                scope.cart.originalOrder = {
                    ReceiptNumber: "235764",
                    Order: {
                        Total: 2515.89,
                        PaymentsTotal: 0,
                        ChangeTotal: 0,
                        Balance: 0,
                        Customer: {
                            CustomerTitle: 'asd',
                            CustomerFirstName: 'asd',
                            CustomerLastName: 'asd',
                            CustomerAddressLine1: 'asd',
                            CustomerTownOrCity: 'asd',
                            CustomerPostcode: 'asd'
                        },
                        Payments: [{
                            Method: 'Cash',
                            Amount: 2515.89
                        }],
                        SaleComplete: false,
                        items: [{
                            itemNumber: "000500",
                            price: 16.89,
                            quantity: 1,
                            description: "WHIRLPOOL WHIRLPOOL",
                            Installations: null,
                            warranties: [{
                                Id: 15,
                                Number: "1356426546",
                                description: "Manufacturer warranty",
                                Length: 12,
                                TaxRate: 12.5,
                                RetailPrice: 0,
                                returnAmount: 0,
                                IsFree: true
                            }]
                        }, {
                            itemNumber: "300047",
                            price: 2499,
                            quantity: 2,
                            description: "FRIGIDAIRE FRIGIDAIRE",
                            Installations: null,
                            warranties: [{
                                warrantyLink: {
                                    Id: 15,
                                    Number: "1356426546",
                                    description: "Manufacturer warranty",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: true
                                }, price: {
                                    RetailPrice: 0,
                                    ReturnAmount: 0
                                }
                            }, {
                                warrantyLink: {
                                    Id: 15,
                                    Number: "1356426546",
                                    description: "Manufacturer warranty",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: true
                                }, price: {
                                    RetailPrice: 0,
                                    ReturnAmount: 0
                                }
                            }, {
                                warrantyLink: {
                                    Id: 35,
                                    Number: "782464365",
                                    description: "Extended warranty 1",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: false
                                }, price: {
                                    RetailPrice: 349.99,
                                    ReturnAmount: 299.99
                                }
                            }, {
                                warrantyLink: {
                                    Id: 37,
                                    Number: "567567565",
                                    description: "Extended warranty 2",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: false
                                }, price: {
                                    RetailPrice: 249.99,
                                    ReturnAmount: 199.99
                                }
                            }]
                        }]
                    }
                };

                scope.returnItem(scope.cart.originalOrder.Order.items[1]);
                expect(scope.cart.originalOrder.Order.items[1].canWarrantyBeKept).toBe(false);
            });

            it('should set a flag on the item when a warranty can be kept', function () {
                createController();
                $httpBackend.flush();

                scope.cart.originalOrder = {
                    ReceiptNumber: "235764",
                    Order: {
                        Total: 2515.89,
                        PaymentsTotal: 0,
                        ChangeTotal: 0,
                        Balance: 0,
                        Customer: {
                            CustomerTitle: 'asd',
                            CustomerFirstName: 'asd',
                            CustomerLastName: 'asd',
                            CustomerAddressLine1: 'asd',
                            CustomerTownOrCity: 'asd',
                            CustomerPostcode: 'asd'
                        },
                        Payments: [{
                            Method: 'Cash',
                            Amount: 2515.89
                        }],
                        SaleComplete: false,
                        items: [{
                            itemNumber: "000500",
                            price: 16.89,
                            quantity: 1,
                            description: "WHIRLPOOL WHIRLPOOL",
                            Installations: null,
                            warranties: [{
                                Id: 15,
                                Number: "1356426546",
                                description: "Manufacturer warranty",
                                Length: 12,
                                TaxRate: 12.5,
                                RetailPrice: 0,
                                returnAmount: 0,
                                IsFree: true
                            }]
                        }, {
                            itemNumber: "300047",
                            price: 2499,
                            quantity: 2,
                            description: "FRIGIDAIRE FRIGIDAIRE",
                            Installations: null,
                            warranties: [{
                                warrantyLink: {
                                    Id: 15,
                                    Number: "1356426546",
                                    description: "Manufacturer warranty",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: true
                                }, price: {
                                    RetailPrice: 0,
                                    ReturnAmount: 0
                                }
                            }, {
                                warrantyLink: {
                                    Id: 15,
                                    Number: "1356426546",
                                    description: "Manufacturer warranty",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: true
                                }, price: {
                                    RetailPrice: 0,
                                    ReturnAmount: 0
                                }
                            }, {
                                warrantyLink: {
                                    Id: 35,
                                    Number: "782464365",
                                    description: "Extended warranty 1",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: false
                                }, price: {
                                    RetailPrice: 349.99,
                                    ReturnAmount: 299.99
                                }
                            }, {
                                warrantyLink: {
                                    Id: 37,
                                    Number: "567567565",
                                    description: "Extended warranty 2",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: false
                                }, price: {
                                    RetailPrice: 249.99,
                                    ReturnAmount: 199.99
                                }
                            }]
                        }]
                    }
                };

                scope.returnItem(scope.cart.originalOrder.Order.items[1]);
                scope.decreaseReturnQuantity(scope.cart.originalOrder.Order.items[1]);

                expect(scope.cart.originalOrder.Order.items[1].canWarrantyBeKept).toBe(true);
            });

            it('should not allow warranty to be kept when return quantity is increased', function () {
                createController();
                $httpBackend.flush();

                scope.cart.originalOrder = {
                    ReceiptNumber: "235764",
                    Order: {
                        Total: 2515.89,
                        PaymentsTotal: 0,
                        ChangeTotal: 0,
                        Balance: 0,
                        Customer: {
                            CustomerTitle: 'asd',
                            CustomerFirstName: 'asd',
                            CustomerLastName: 'asd',
                            CustomerAddressLine1: 'asd',
                            CustomerTownOrCity: 'asd',
                            CustomerPostcode: 'asd'
                        },
                        Payments: [{
                            Method: 'Cash',
                            Amount: 2515.89
                        }],
                        SaleComplete: false,
                        items: [{
                            itemNumber: "000500",
                            price: 16.89,
                            quantity: 1,
                            description: "WHIRLPOOL WHIRLPOOL",
                            Installations: null,
                            warranties: [{
                                Id: 15,
                                Number: "1356426546",
                                description: "Manufacturer warranty",
                                Length: 12,
                                TaxRate: 12.5,
                                RetailPrice: 0,
                                returnAmount: 0,
                                IsFree: true
                            }]
                        }, {
                            itemNumber: "300047",
                            price: 2499,
                            quantity: 2,
                            description: "FRIGIDAIRE FRIGIDAIRE",
                            Installations: null,
                            warranties: [{
                                warrantyLink: {
                                    Id: 15,
                                    Number: "1356426546",
                                    description: "Manufacturer warranty",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: true
                                }, price: {
                                    RetailPrice: 0,
                                    ReturnAmount: 0
                                }
                            }, {
                                warrantyLink: {
                                    Id: 15,
                                    Number: "1356426546",
                                    description: "Manufacturer warranty",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: true
                                }, price: {
                                    RetailPrice: 0,
                                    ReturnAmount: 0
                                }
                            }, {
                                warrantyLink: {
                                    Id: 35,
                                    Number: "782464365",
                                    description: "Extended warranty 1",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: false
                                }, price: {
                                    RetailPrice: 349.99,
                                    ReturnAmount: 299.99
                                }
                            }, {
                                warrantyLink: {
                                    Id: 37,
                                    Number: "567567565",
                                    description: "Extended warranty 2",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: false
                                }, price: {
                                    RetailPrice: 249.99,
                                    ReturnAmount: 199.99
                                }
                            }]
                        }]
                    }
                };

                scope.returnItem(scope.cart.originalOrder.Order.items[1]);
                scope.decreaseReturnQuantity(scope.cart.originalOrder.Order.items[1]);
                scope.increaseReturnQuantity(scope.cart.originalOrder.Order.items[1]);

                expect(scope.cart.originalOrder.Order.items[1].canWarrantyBeKept).toBe(false);
            });

            it('should mark warranty as being returned', function () {
                createController();
                $httpBackend.flush();

                scope.cart.originalOrder = {
                    ReceiptNumber: "235764",
                    Order: {
                        Total: 2515.89,
                        PaymentsTotal: 0,
                        ChangeTotal: 0,
                        Balance: 0,
                        Customer: {
                            CustomerTitle: 'asd',
                            CustomerFirstName: 'asd',
                            CustomerLastName: 'asd',
                            CustomerAddressLine1: 'asd',
                            CustomerTownOrCity: 'asd',
                            CustomerPostcode: 'asd'
                        },
                        Payments: [{
                            Method: 'Cash',
                            Amount: 2515.89
                        }],
                        SaleComplete: false,
                        items: [{
                            itemNumber: "000500",
                            price: 16.89,
                            quantity: 1,
                            description: "WHIRLPOOL WHIRLPOOL",
                            Installations: null,
                            warranties: [{
                                Id: 15,
                                Number: "1356426546",
                                description: "Manufacturer warranty",
                                Length: 12,
                                TaxRate: 12.5,
                                RetailPrice: 0,
                                returnAmount: 0,
                                IsFree: true
                            }]
                        }, {
                            itemNumber: "300047",
                            price: 2499,
                            quantity: 2,
                            description: "FRIGIDAIRE FRIGIDAIRE",
                            Installations: null,
                            warranties: [{
                                warrantyLink: {
                                    Id: 15,
                                    Number: "1356426546",
                                    description: "Manufacturer warranty",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: true
                                }, price: {
                                    RetailPrice: 0,
                                    ReturnAmount: 0
                                }
                            }, {
                                warrantyLink: {
                                    Id: 15,
                                    Number: "1356426546",
                                    description: "Manufacturer warranty",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: true
                                }, price: {
                                    RetailPrice: 0,
                                    ReturnAmount: 0
                                }
                            }, {
                                warrantyLink: {
                                    Id: 35,
                                    Number: "782464365",
                                    description: "Extended warranty 1",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: false
                                }, price: {
                                    RetailPrice: 349.99,
                                    ReturnAmount: 299.99
                                }
                            }, {
                                warrantyLink: {
                                    Id: 37,
                                    Number: "567567565",
                                    description: "Extended warranty 2",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: false
                                }, price: {
                                    RetailPrice: 249.99,
                                    ReturnAmount: 199.99
                                }
                            }]
                        }]
                    }
                };

                scope.returnWarranty(2, scope.cart.originalOrder.Order.items[1]);

                expect(scope.cart.originalOrder.Order.items[1].warranties[2].returned).toBe(true);
            });

            it('should add credit amount for the warranty being returned', function () {
                createController();
                $httpBackend.flush();

                scope.cart.originalOrder = {
                    ReceiptNumber: "235764",
                    Order: {
                        Total: 2515.89,
                        PaymentsTotal: 0,
                        ChangeTotal: 0,
                        Balance: 0,
                        Customer: {
                            CustomerTitle: 'asd',
                            CustomerFirstName: 'asd',
                            CustomerLastName: 'asd',
                            CustomerAddressLine1: 'asd',
                            CustomerTownOrCity: 'asd',
                            CustomerPostcode: 'asd'
                        },
                        Payments: [{
                            Method: 'Cash',
                            Amount: 2515.89
                        }],
                        SaleComplete: false,
                        items: [{
                            itemNumber: "000500",
                            price: 16.89,
                            quantity: 1,
                            description: "WHIRLPOOL WHIRLPOOL",
                            Installations: null,
                            warranties: [{
                                Id: 15,
                                Number: "1356426546",
                                description: "Manufacturer warranty",
                                Length: 12,
                                TaxRate: 12.5,
                                RetailPrice: 0,
                                returnAmount: 0,
                                IsFree: true
                            }]
                        }, {
                            itemNumber: "300047",
                            price: 2499,
                            quantity: 2,
                            description: "FRIGIDAIRE FRIGIDAIRE",
                            Installations: null,
                            warranties: [{
                                warrantyLink: {
                                    Id: 15,
                                    Number: "1356426546",
                                    description: "Manufacturer warranty",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: true
                                }, price: {
                                    RetailPrice: 0,
                                    ReturnAmount: 0
                                }
                            }, {
                                warrantyLink: {
                                    Id: 15,
                                    Number: "1356426546",
                                    description: "Manufacturer warranty",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: true
                                }, price: {
                                    RetailPrice: 0,
                                    ReturnAmount: 0
                                }
                            }, {
                                warrantyLink: {
                                    Id: 35,
                                    Number: "782464365",
                                    description: "Extended warranty 1",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: false
                                }, price: {
                                    RetailPrice: 349.99,
                                    ReturnAmount: 299.99,
                                    ReturnTaxAmount: 37.5
                                }
                            }, {
                                warrantyLink: {
                                    Id: 37,
                                    Number: "567567565",
                                    description: "Extended warranty 2",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: false
                                }, price: {
                                    RetailPrice: 249.99,
                                    ReturnAmount: 199.99
                                }
                            }]
                        }]
                    }
                };

                scope.returnWarranty(2, scope.cart.originalOrder.Order.items[1]);

                expect(scope.cart.credit).toBe(299.99 + 37.5);
            });

            it('should update balance to reflect credit amount for the warranty being returned', function () {
                createController();
                $httpBackend.flush();

                scope.cart.originalOrder = {
                    ReceiptNumber: "235764",
                    Order: {
                        Total: 2515.89,
                        PaymentsTotal: 0,
                        ChangeTotal: 0,
                        Balance: 0,
                        Customer: {
                            CustomerTitle: 'asd',
                            CustomerFirstName: 'asd',
                            CustomerLastName: 'asd',
                            CustomerAddressLine1: 'asd',
                            CustomerTownOrCity: 'asd',
                            CustomerPostcode: 'asd'
                        },
                        Payments: [{
                            Method: 'Cash',
                            Amount: 2515.89
                        }],
                        SaleComplete: false,
                        items: [{
                            itemNumber: "000500",
                            price: 16.89,
                            quantity: 1,
                            description: "WHIRLPOOL WHIRLPOOL",
                            Installations: null,
                            warranties: [{
                                Id: 15,
                                Number: "1356426546",
                                description: "Manufacturer warranty",
                                Length: 12,
                                TaxRate: 12.5,
                                RetailPrice: 0,
                                returnAmount: 0,
                                IsFree: true
                            }]
                        }, {
                            itemNumber: "300047",
                            price: 2499,
                            quantity: 2,
                            description: "FRIGIDAIRE FRIGIDAIRE",
                            Installations: null,
                            warranties: [{
                                warrantyLink: {
                                    Id: 15,
                                    Number: "1356426546",
                                    description: "Manufacturer warranty",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: true
                                }, price: {
                                    RetailPrice: 0,
                                    ReturnAmount: 0
                                }
                            }, {
                                warrantyLink: {
                                    Id: 15,
                                    Number: "1356426546",
                                    description: "Manufacturer warranty",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: true
                                }, price: {
                                    RetailPrice: 0,
                                    ReturnAmount: 0
                                }
                            }, {
                                warrantyLink: {
                                    Id: 35,
                                    Number: "782464365",
                                    description: "Extended warranty 1",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: false
                                }, price: {
                                    RetailPrice: 349.99,
                                    ReturnAmount: 299.99
                                }
                            }, {
                                warrantyLink: {
                                    Id: 37,
                                    Number: "567567565",
                                    description: "Extended warranty 2",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: false
                                }, price: {
                                    RetailPrice: 249.99,
                                    ReturnAmount: 199.99
                                }
                            }]
                        }]
                    }
                };

                scope.returnWarranty(2, scope.cart.originalOrder.Order.items[1]);

                expect(scope.cart.balance).toBe(-299.99);
            });

            it('should set a flag to indicate that the warranty can be kept when the warranty is returned', function () {
                createController();
                $httpBackend.flush();

                scope.cart.originalOrder = {
                    ReceiptNumber: "235764",
                    Order: {
                        Total: 2515.89,
                        PaymentsTotal: 0,
                        ChangeTotal: 0,
                        Balance: 0,
                        Customer: {
                            CustomerTitle: 'asd',
                            CustomerFirstName: 'asd',
                            CustomerLastName: 'asd',
                            CustomerAddressLine1: 'asd',
                            CustomerTownOrCity: 'asd',
                            CustomerPostcode: 'asd'
                        },
                        Payments: [{
                            Method: 'Cash',
                            Amount: 2515.89
                        }],
                        SaleComplete: false,
                        items: [{
                            itemNumber: "000500",
                            price: 16.89,
                            quantity: 1,
                            description: "WHIRLPOOL WHIRLPOOL",
                            Installations: null,
                            warranties: [{
                                Id: 15,
                                Number: "1356426546",
                                description: "Manufacturer warranty",
                                Length: 12,
                                TaxRate: 12.5,
                                RetailPrice: 0,
                                returnAmount: 0,
                                IsFree: true
                            }]
                        }, {
                            itemNumber: "300047",
                            price: 2499,
                            quantity: 2,
                            description: "FRIGIDAIRE FRIGIDAIRE",
                            Installations: null,
                            warranties: [{
                                warrantyLink: {
                                    Id: 15,
                                    Number: "1356426546",
                                    description: "Manufacturer warranty",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: true
                                }, price: {
                                    RetailPrice: 0,
                                    ReturnAmount: 0
                                }
                            }, {
                                warrantyLink: {
                                    Id: 15,
                                    Number: "1356426546",
                                    description: "Manufacturer warranty",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: true
                                }, price: {
                                    RetailPrice: 0,
                                    ReturnAmount: 0
                                }
                            }, {
                                warrantyLink: {
                                    Id: 35,
                                    Number: "782464365",
                                    description: "Extended warranty 1",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: false
                                }, price: {
                                    RetailPrice: 349.99,
                                    ReturnAmount: 299.99
                                }
                            }, {
                                warrantyLink: {
                                    Id: 37,
                                    Number: "567567565",
                                    description: "Extended warranty 2",
                                    Length: 12,
                                    TaxRate: 12.5,
                                    IsFree: false
                                }, price: {
                                    RetailPrice: 249.99,
                                    ReturnAmount: 199.99
                                }
                            }]
                        }]
                    }
                };

                scope.returnWarranty(2, scope.cart.originalOrder.Order.items[1]);

                expect(scope.cart.originalOrder.Order.items[1].canWarrantyBeKept).toBe(true);
            });

            it('should move contents of cart to originalOrder when manual return is selected', function () {
                createController();
                $httpBackend.flush();

                scope.cart.items.push({
                    itemNumber: '245425',
                    itemId: 1343,
                    price: 591.33,
                    description: 'Item description',
                    quantity: 1,
                    taxAmount: 59.1
                });

                scope.$emit('pos:return:manual');

                expect(scope.cart.originalOrder).toBeDefined();
                expect(scope.cart.originalOrder.Order).toBeDefined();
                expect(scope.cart.originalOrder.Order.items).toBeDefined();
                expect(scope.cart.originalOrder.Order.items[0]).toBeDefined();
                expect(scope.cart.originalOrder.Order.items[0].itemId).toBe(1343);
                expect(scope.cart.originalOrder.Order.items[0].itemNumber).toBe('245425');
                expect(scope.cart.originalOrder.Order.items[0].price).toBe(591.33);
                expect(scope.cart.originalOrder.Order.items[0].description).toBe('Item description');
                expect(scope.cart.originalOrder.Order.items[0].quantity).toBe(1);
            });

            it('should mark the originalOrder items as being returned when manual return is selected', function () {
                createController();
                $httpBackend.flush();

                scope.cart.items.push({
                    itemNumber: '245425',
                    itemId: 1343,
                    price: 591.33,
                    description: 'Item description',
                    quantity: 1
                });

                scope.$emit('pos:return:manual');

                expect(scope.cart.originalOrder.Order.items[0].returned).toBe(true);
            });

            it('should set the returnQuantity the same as item quantity when manual return is selected', function () {
                createController();
                $httpBackend.flush();

                scope.cart.items.push({
                    itemNumber: '245425',
                    itemId: 1343,
                    price: 591.33,
                    description: 'Item description',
                    quantity: 2
                });

                scope.$emit('pos:return:manual');

                expect(scope.cart.originalOrder.Order.items[0].returnQuantity).toBe(2);
            });

            it('should set ReceiptNumber as unknown when manual return is selected', function () {
                createController();
                $httpBackend.flush();

                scope.cart.items.push({
                    itemNumber: '245425',
                    itemId: 1343,
                    price: 591.33,
                    description: 'Item description',
                    quantity: 1
                });

                scope.$emit('pos:return:manual');

                expect(scope.cart.originalOrder.ReceiptNumber).toBe('UNKNOWN');
            });

            it('should clear contents of cart when manual return is selected', function () {
                createController();
                $httpBackend.flush();

                scope.cart.items.push({
                    itemNumber: '245425',
                    itemId: 1343,
                    price: 591.33,
                    description: 'Item description',
                    quantity: 1
                });

                scope.$emit('pos:return:manual');

                expect(scope.cart.items.length).toBe(0);
            });

            it('should set item total as credit amount when manual return is selected', function () {
                createController();
                $httpBackend.flush();

                scope.cart.items.push({
                    itemNumber: '245425',
                    itemId: 1343,
                    price: 591.33,
                    description: 'Item description',
                    quantity: 2
                });

                scope.$emit('pos:return:manual');

                expect(scope.cart.credit).toBe(591.33 * 2);
            });

            it('should update balance when manual return is selected', function () {
                createController();
                $httpBackend.flush();

                scope.cart.items.push({
                    itemNumber: '245425',
                    itemId: 1343,
                    price: 591.33,
                    description: 'Item description',
                    quantity: 1
                });

                scope.$emit('pos:return:manual');

                expect(scope.cart.balance).toBe(-591.33);
            });

            it('should update total amount when manual return is selected', function () {
                createController();
                $httpBackend.flush();

                scope.cart.items.push({
                    itemNumber: '245425',
                    itemId: 1343,
                    price: 591.33,
                    description: 'Item description',
                    quantity: 1
                });
                scope.cart.total = 591.33;

                scope.$emit('pos:return:manual');

                expect(scope.cart.total).toBe(0);
            });

            it('should set a flag to indicate when manual return is selected', function () {
                createController();
                $httpBackend.flush();

                scope.cart.items.push({
                    itemNumber: '245425',
                    itemId: 1343,
                    price: 591.33,
                    description: 'Item description',
                    quantity: 1
                });
                scope.cart.total = 591.33;

                scope.$emit('pos:return:manual');

                expect(scope.cart.manualReturn).toBe(true);
            });

            it('should set the authorisationPending flag when manual return is selected', function () {
                createController();
                $httpBackend.flush();

                scope.cart.items.push({
                    itemNumber: '245425',
                    itemId: 1343,
                    price: 591.33,
                    description: 'Item description',
                    quantity: 1
                });
                scope.cart.total = 591.33;

                scope.$emit('pos:return:manual');

                expect(scope.cart.authorisationPending).toBe(true);
            });

            it('should set the itemBeingReturned flag when manual return is selected', function () {
                createController();
                $httpBackend.flush();

                scope.cart.items.push({
                    itemNumber: '245425',
                    itemId: 1343,
                    price: 591.33,
                    description: 'Item description',
                    quantity: 1
                });
                scope.cart.total = 591.33;

                scope.$emit('pos:return:manual');

                expect(scope.cart.itemBeingReturned).toBe(true);
            });

            it('should show the basket view when manual return is selected', function () {
                createController();
                $httpBackend.flush();

                scope.$emit('pos:return:manual');

                expect(scope.views.itemList.visible).toBe(true);
            });

            it('should request authorisation for AuthoriseManualRefundExchange permission when it is a manual return', function () {
                createController();
                $httpBackend.flush();

                scope.cart.manualReturn = true;
                scope.requestManualReturnAuthorisation();

                expect(rootScope.$broadcast).toHaveBeenCalled();
                expect(rootScope.$broadcast.mostRecentCall.args[1].requiredPermission).toBe('AuthoriseManualRefundExchange');
            });

            it('should include tax amount in credit when item is returned', function () {
                createController();
                $httpBackend.flush();

                scope.cart.originalOrder = {
                    ReceiptNumber: '123123',
                    Order: {
                        items: [{
                            itemNumber: '245425',
                            price: 591.33,
                            description: 'Item description',
                            quantity: 1,
                            taxAmount: 59.1
                        }, {
                            itemNumber: '785465',
                            price: 291.33,
                            description: 'Item description',
                            quantity: 2,
                            taxAmount: 29.1
                        }]
                    }
                };

                scope.returnItem(scope.cart.originalOrder.Order.items[1]);

                expect(scope.cart.credit).toBe((291.33 + 29.1) * 2);
            });

            it('should populate tax amount when manual return is selected', function () {
                createController();
                $httpBackend.flush();

                scope.cart.items.push({
                    itemNumber: '245425',
                    itemId: 1343,
                    price: 591.33,
                    description: 'Item description',
                    quantity: 1,
                    taxAmount: 59.1
                });

                scope.$emit('pos:return:manual');

                expect(scope.cart.originalOrder.Order.items[0].taxAmount).toBe(59.1);
            });

            it('should include tax amount in credit amount when manual return is selected', function () {
                createController();
                $httpBackend.flush();

                scope.cart.items.push({
                    itemNumber: '245425',
                    itemId: 1343,
                    price: 591.33,
                    description: 'Item description',
                    quantity: 2,
                    taxAmount: 59.1
                });

                scope.$emit('pos:return:manual');

                expect(scope.cart.credit).toBe(Math.round((591.33 + 59.1) * 2 * 100) / 100);
            });

            afterEach(function () {
                $httpBackend.verifyNoOutstandingExpectation();
                $httpBackend.verifyNoOutstandingRequest();
            });
        });
    });
});