/*global define, module, inject, describe, beforeEach, afterEach, it, expect*/
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

		describe('SalesController:: Basket ::', function () {
			var scope, createController, $httpBackend;
			var setWarrantySearchExpectation = function (price, itemNumber) {
				$httpBackend.expectPOST('/Warranty/Link/Search', {
					Location: 900,
					PriceVATEx: price,
					Product: itemNumber
				}).respond({
					"ProductPrice": 591.33,
					"Items": [{
						"warrantyLink": {
							"LinkId": 1,
							"LinkName": "link 1",
							"ProductMatch": false,
							"LevelMatch": 10,
							"Id": 2,
							"Number": "133122",
							"Description": "warranty 1",
							"Length": 12,
							"TaxRate": 15.00,
							"IsFree": false,
							"IsDeleted": false,
							"WarrantyTags": [],
							"RenewalChildren": null,
							"RenewalParents": null
						},
						"price": {
							"WarrantyId": 1,
							"Date": "\/Date(1388489550745)\/",
							"Branch": 900,
							"BranchType": "C",
							"CostPrice": 50.0000,
							"RetailPrice": 80.0000
						},
						"promotion": null
					}, {
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
				});
			};
			var setFreeWarrantySearchExpectation = function (price, itemNumber) {
				$httpBackend.expectPOST('/Warranty/Link/Search', {
					Location: 900,
					PriceVATEx: price,
					Product: itemNumber,
					isFree: true
				}).respond({
					"ProductPrice": 591.33,
					"Items": [{
						"warrantyLink": {
							"LinkId": 1,
							"LinkName": "link 1",
							"ProductMatch": false,
							"LevelMatch": 10,
							"Id": 2,
							"Number": "999111",
							"Description": "free warranty 1",
							"Length": 12,
							"TaxRate": 15.00,
							"IsFree": true,
							"IsDeleted": false,
							"WarrantyTags": [],
							"RenewalChildren": null,
							"RenewalParents": null
						},
						"price": {
							"WarrantyId": 4,
							"Date": "\/Date(1388489550745)\/",
							"Branch": 900,
							"BranchType": "C",
							"CostPrice": 50.0000,
							"RetailPrice": 0.0000
						},
						"promotion": null
					}]
				});
			};

			beforeEach(inject(function (_$httpBackend_, $rootScope, $controller) {
				$httpBackend = _$httpBackend_;
                $httpBackend.expectPOST('/Config/DecisionTable/Load/').respond('{}');
                $httpBackend.when('GET', /Merchandising\/Catalogue\/GetInstallations\?itemNumber=[a-zA-Z0-9]+/).respond([]);

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
						$scope: salesScope
					});
				};
			}));

			it('should add search item to the cart', function () {
				createController();
				$httpBackend.flush();
				setFreeWarrantySearchExpectation(591.33, '245425');
				setWarrantySearchExpectation(591.33, '245425');
				scope.cart.searchItem = {
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					Description1: 'Item description 1',
					Description2: 'Item description 2'
				};
				scope.addSearchItem();
				$httpBackend.flush();

				expect(scope.cart.items.length).toBe(1);
			});

			it('should populate the tax amount when adding the item to the cart', function () {
				createController();
				$httpBackend.flush();
				setFreeWarrantySearchExpectation(591.33, '245425');
				setWarrantySearchExpectation(591.33, '245425');
				scope.cart.searchItem = {
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					Description1: 'Item description 1',
					Description2: 'Item description 2',
					TaxAmount: 5.91
				};
				scope.addSearchItem();
				$httpBackend.flush();

				expect(scope.cart.items[0].taxAmount).toBe(5.91);
			});

			it('should populate the tax rate when adding the item to the cart', function () {
				createController();
				$httpBackend.flush();
				setFreeWarrantySearchExpectation(591.33, '245425');
				setWarrantySearchExpectation(591.33, '245425');
				scope.cart.searchItem = {
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					Description1: 'Item description 1',
					Description2: 'Item description 2',
					TaxRate: 10
				};
				scope.addSearchItem();
				$httpBackend.flush();

				expect(scope.cart.items[0].taxRate).toBe(10);
			});

			it('should populate the tax exclusive price when adding the item to the cart', function () {
				createController();
				$httpBackend.flush();
				setFreeWarrantySearchExpectation(591.33, '245425');
				setWarrantySearchExpectation(591.33, '245425');
				scope.cart.searchItem = {
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					Description1: 'Item description 1',
					Description2: 'Item description 2',
					TaxRate: 10,
					TaxExclusivePrice: 541.33
				};
				scope.addSearchItem();
				$httpBackend.flush();

				expect(scope.cart.items[0].taxExclusivePrice).toBe(541.33);
			});

			it('when adding an item to the cart it should search for warranties ', function () {
				createController();
				$httpBackend.flush();
				setFreeWarrantySearchExpectation(591.33, '245425');
				setWarrantySearchExpectation(591.33, '245425');
				scope.cart.searchItem = {
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					Description1: 'Item description 1',
					Description2: 'Item description 2'
				};
				scope.addSearchItem();
				$httpBackend.flush();
			});

			it('should add all available warranties to the cart item', function () {
				createController();
				$httpBackend.flush();
				setFreeWarrantySearchExpectation(591.33, '245425');
				setWarrantySearchExpectation(591.33, '245425');
				scope.cart.searchItem = {
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					Description1: 'Item description 1',
					Description2: 'Item description 2'
				};
				scope.addSearchItem();
				$httpBackend.flush();

				expect(scope.cart.items[0].availableWarranties).toBeDefined();
				expect(scope.cart.items[0].availableWarranties.length).toBe(2);
			});

			it('should automatically add the free warranties as a selected warranty', function () {
				createController();
				$httpBackend.flush();
				setFreeWarrantySearchExpectation(591.33, '245425');
				setWarrantySearchExpectation(591.33, '245425');
				scope.cart.searchItem = {
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					Description1: 'Item description 1',
					Description2: 'Item description 2'
				};
				scope.addSearchItem();
				$httpBackend.flush();

				expect(scope.cart.items[0].warranties).toBeDefined();
				expect(scope.cart.items[0].warranties.length).toBe(1);
			});

			it('should set the free warranty term on the duration field', function () {
				createController();
				$httpBackend.flush();
				setFreeWarrantySearchExpectation(591.33, '245425');
				setWarrantySearchExpectation(591.33, '245425');
				scope.cart.searchItem = {
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					Description1: 'Item description 1',
					Description2: 'Item description 2'
				};
				scope.addSearchItem();
				$httpBackend.flush();

				expect(scope.cart.items[0].warranties).toBeDefined();
				expect(scope.cart.items[0].warranties[0].duration).toBe(12);
			});

			it('should add the selected warranty to the warranty list and remove from available warranties', function () {
				createController();
				$httpBackend.flush();

				scope.cart.items.push({
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					Description1: 'Item description 1',
					Description2: 'Item description 2',
					availableWarranties: [{
						"warrantyLink": {
							"LinkId": 1,
							"LinkName": "link 1",
							"ProductMatch": false,
							"LevelMatch": 10,
							"Id": 2,
							"Number": "133122",
							"Description": "warranty 1",
							"Length": 12,
							"TaxRate": 15.00,
							"IsFree": false,
							"IsDeleted": false,
							"WarrantyTags": [],
							"RenewalChildren": null,
							"RenewalParents": null
						},
						"price": {
							"WarrantyId": 1,
							"Date": "\/Date(1388489550745)\/",
							"Branch": 900,
							"BranchType": "C",
							"CostPrice": 50.0000,
							"RetailPrice": 80.0000
						},
						"promotion": null
					}, {
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
				});

				scope.addWarranty({
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
				}, scope.cart.items[0]);

				expect(scope.cart.items[0].warranties).toBeDefined();
				expect(scope.cart.items[0].warranties.length).toBe(1);
				expect(scope.cart.items[0].availableWarranties.length).toBe(1);
			});

			it('should set the selected warranty duration from the warranty length', function () {
				createController();
				$httpBackend.flush();

				scope.cart.items.push({
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					Description1: 'Item description 1',
					Description2: 'Item description 2',
					availableWarranties: [{
						"warrantyLink": {
							"LinkId": 1,
							"LinkName": "link 1",
							"ProductMatch": false,
							"LevelMatch": 10,
							"Id": 2,
							"Number": "133122",
							"Description": "warranty 1",
							"Length": 12,
							"TaxRate": 15.00,
							"IsFree": false,
							"IsDeleted": false,
							"WarrantyTags": [],
							"RenewalChildren": null,
							"RenewalParents": null
						},
						"price": {
							"WarrantyId": 1,
							"Date": "\/Date(1388489550745)\/",
							"Branch": 900,
							"BranchType": "C",
							"CostPrice": 50.0000,
							"RetailPrice": 80.0000
						},
						"promotion": null
					}, {
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
				});

				scope.addWarranty({
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
				}, scope.cart.items[0]);

				expect(scope.cart.items[0].warranties).toBeDefined();
				expect(scope.cart.items[0].warranties[0].duration).toBe(12);
			});

			it('should add the cost of the selected warranty to the cart total', function () {
				createController();
				$httpBackend.flush();

				scope.cart.items.push({
					itemNumber: '245425',
					taxExclusivePrice: 591.33,
					description: 'Item description',
					quantity: 1,
					availableWarranties: [{
						"warrantyLink": {
							"LinkId": 1,
							"LinkName": "link 1",
							"ProductMatch": false,
							"LevelMatch": 10,
							"Id": 2,
							"Number": "133122",
							"Description": "warranty 1",
							"Length": 12,
							"TaxRate": 15.00,
							"IsFree": false,
							"IsDeleted": false,
							"WarrantyTags": [],
							"RenewalChildren": null,
							"RenewalParents": null
						},
						"price": {
							"WarrantyId": 1,
							"Date": "\/Date(1388489550745)\/",
							"Branch": 900,
							"BranchType": "C",
							"CostPrice": 50.0000,
							"RetailPrice": 80.0000
						},
						"promotion": null
					}, {
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
				});

				scope.addWarranty({
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
				}, scope.cart.items[0]);

				expect(scope.cart.total).toBe(591.33 + 100);
				expect(scope.cart.balance).toBe(591.33 + 100);
			});

			it('should remove the deleted warranty from the warranty list and move it to the available warranties', function () {
				createController();
				$httpBackend.flush();

				scope.cart.items.push({
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					Description1: 'Item description 1',
					Description2: 'Item description 2',
					warranties: [{
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
					}],
					availableWarranties: [{
						"warrantyLink": {
							"LinkId": 1,
							"LinkName": "link 1",
							"ProductMatch": false,
							"LevelMatch": 10,
							"Id": 1,
							"Number": "133122",
							"Description": "warranty 1",
							"Length": 12,
							"TaxRate": 15.00,
							"IsFree": false,
							"IsDeleted": false,
							"WarrantyTags": [],
							"RenewalChildren": null,
							"RenewalParents": null
						},
						"price": {
							"WarrantyId": 1,
							"Date": "\/Date(1388489550745)\/",
							"Branch": 900,
							"BranchType": "C",
							"CostPrice": 50.0000,
							"RetailPrice": 80.0000
						},
						"promotion": null
					}]
				});

				scope.removeWarranty(0, scope.cart.items[0]);

				expect(scope.cart.items[0].warranties).toBeDefined();
				expect(scope.cart.items[0].warranties.length).toBe(0);
				expect(scope.cart.items[0].availableWarranties.length).toBe(2);
			});

			it('should remove the deleted warranty from the warranty list even when there is a free warranty', function () {
				createController();
				$httpBackend.flush();

				scope.cart.items.push({
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					Description1: 'Item description 1',
					Description2: 'Item description 2',
					warranties: [{
						"warrantyLink": {
							"LinkId": 1,
							"LinkName": "link 1",
							"ProductMatch": false,
							"LevelMatch": 10,
							"Id": 3,
							"Number": "1331422",
							"Description": "warranty 4",
							"Length": 12,
							"TaxRate": 15.00,
							"IsFree": true,
							"IsDeleted": false,
							"WarrantyTags": [],
							"RenewalChildren": null,
							"RenewalParents": null
						},
						"price": null,
						"promotion": null
					}, {
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
					}],
					availableWarranties: [{
						"warrantyLink": {
							"LinkId": 1,
							"LinkName": "link 1",
							"ProductMatch": false,
							"LevelMatch": 10,
							"Id": 1,
							"Number": "133122",
							"Description": "warranty 1",
							"Length": 12,
							"TaxRate": 15.00,
							"IsFree": false,
							"IsDeleted": false,
							"WarrantyTags": [],
							"RenewalChildren": null,
							"RenewalParents": null
						},
						"price": {
							"WarrantyId": 1,
							"Date": "\/Date(1388489550745)\/",
							"Branch": 900,
							"BranchType": "C",
							"CostPrice": 50.0000,
							"RetailPrice": 80.0000
						},
						"promotion": null
					}]
				});

				scope.removeWarranty(1, scope.cart.items[0]);

				expect(scope.cart.items[0].warranties).toBeDefined();
				expect(scope.cart.items[0].warranties.length).toBe(1);
				expect(scope.cart.items[0].warranties[0].warrantyLink.Id).toBe(3);
				expect(scope.cart.items[0].availableWarranties.length).toBe(2);
			});

			it('should subtract the cost of the removed warranty from the cart total', function () {
				createController();
				$httpBackend.flush();

				scope.cart.items.push({
					itemNumber: '245425',
					taxExclusivePrice: 591.33,
					description: 'Item description 1',
					quantity: 1,
					warranties: [{
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
					}],
					availableWarranties: [{
						"warrantyLink": {
							"LinkId": 1,
							"LinkName": "link 1",
							"ProductMatch": false,
							"LevelMatch": 10,
							"Id": 2,
							"Number": "133122",
							"Description": "warranty 1",
							"Length": 12,
							"TaxRate": 15.00,
							"IsFree": false,
							"IsDeleted": false,
							"WarrantyTags": [],
							"RenewalChildren": null,
							"RenewalParents": null
						},
						"price": {
							"WarrantyId": 1,
							"Date": "\/Date(1388489550745)\/",
							"Branch": 900,
							"BranchType": "C",
							"CostPrice": 50.0000,
							"RetailPrice": 80.0000
						},
						"promotion": null
					}]
				});

				scope.removeWarranty(0, scope.cart.items[0]);

				expect(scope.cart.total).toBe(591.33);
				expect(scope.cart.balance).toBe(591.33);
			});

			it('should include warranty cost when calculating basket total', function () {
				createController();
				$httpBackend.flush();

				scope.cart.items.push({
					itemNumber: '245425',
					taxExclusivePrice: 591.33,
					quantity: 1,
					description: 'Item description',
					warranties: [{
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
					}, {
						"warrantyLink": {
							"LinkId": 1,
							"LinkName": "link 1",
							"ProductMatch": false,
							"LevelMatch": 10,
							"Id": 2,
							"Number": "999111",
							"Description": "free warranty 1",
							"Length": 12,
							"TaxRate": 15.00,
							"IsFree": true,
							"IsDeleted": false,
							"WarrantyTags": [],
							"RenewalChildren": null,
							"RenewalParents": null
						},
						"price": {
							"WarrantyId": 4,
							"Date": "\/Date(1388489550745)\/",
							"Branch": 900,
							"BranchType": "C",
							"CostPrice": 50.0000,
							"RetailPrice": 0.0000
						},
						"promotion": null
					}]
				});

				setFreeWarrantySearchExpectation(164.75, '32434');
				setWarrantySearchExpectation(164.75, '32434');
				scope.cart.searchItem = {
					ItemNoWarrantyLink: '32434',
					CashPrice: 164.75,
					TaxExclusivePrice: 164.75,
					Description1: 'Item description 1',
					Description2: 'Item description 2'
				};
				scope.addSearchItem();

				expect(scope.cart.total).toBe(856.08);
				expect(scope.cart.balance).toBe(856.08);

				$httpBackend.flush();
			});

			it('should only allow adding 1 extended warranty when there is only 1 item', function () {
				createController();
				$httpBackend.flush();

				scope.cart.items.push({
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					TaxExclusivePrice: 591.33,
					quantity: 1,
					Description1: 'Item description 1',
					Description2: 'Item description 2',
					warranties: [{
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
					}],
					availableWarranties: [{
						"warrantyLink": {
							"LinkId": 1,
							"LinkName": "link 1",
							"ProductMatch": false,
							"LevelMatch": 10,
							"Id": 2,
							"Number": "133122",
							"Description": "warranty 1",
							"Length": 12,
							"TaxRate": 15.00,
							"IsFree": false,
							"IsDeleted": false,
							"WarrantyTags": [],
							"RenewalChildren": null,
							"RenewalParents": null
						},
						"price": {
							"WarrantyId": 1,
							"Date": "\/Date(1388489550745)\/",
							"Branch": 900,
							"BranchType": "C",
							"CostPrice": 50.0000,
							"RetailPrice": 80.0000
						},
						"promotion": null
					}]
				});

				scope.addWarranty({
					"warrantyLink": {
						"LinkId": 1,
						"LinkName": "link 1",
						"ProductMatch": false,
						"LevelMatch": 10,
						"Id": 2,
						"Number": "133122",
						"Description": "warranty 1",
						"Length": 12,
						"TaxRate": 15.00,
						"IsFree": false,
						"IsDeleted": false,
						"WarrantyTags": [],
						"RenewalChildren": null,
						"RenewalParents": null
					},
					"price": {
						"WarrantyId": 1,
						"Date": "\/Date(1388489550745)\/",
						"Branch": 900,
						"BranchType": "C",
						"CostPrice": 50.0000,
						"RetailPrice": 80.0000
					},
					"promotion": null
				}, scope.cart.items[0]);

				expect(scope.cart.items[0].warranties).toBeDefined();
				expect(scope.cart.items[0].warranties.length).toBe(1);
				expect(scope.cart.items[0].availableWarranties.length).toBe(1);
			});

			it('should allow adding extended warranty when item has a free warranty', function () {
				createController();
				$httpBackend.flush();

				scope.cart.items.push({
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					quantity: 1,
					Description1: 'Item description 1',
					Description2: 'Item description 2',
					warranties: [{
						"warrantyLink": {
							"LinkId": 1,
							"LinkName": "link 1",
							"ProductMatch": false,
							"LevelMatch": 10,
							"Id": 3,
							"Number": "133122",
							"Description": "warranty 4",
							"Length": 12,
							"TaxRate": 15.00,
							"IsFree": true,
							"IsDeleted": false,
							"WarrantyTags": [],
							"RenewalChildren": null,
							"RenewalParents": null
						},
						"price": null,
						"promotion": null
					}],
					availableWarranties: [{
						"warrantyLink": {
							"LinkId": 1,
							"LinkName": "link 1",
							"ProductMatch": false,
							"LevelMatch": 10,
							"Id": 2,
							"Number": "133122",
							"Description": "warranty 1",
							"Length": 12,
							"TaxRate": 15.00,
							"IsFree": false,
							"IsDeleted": false,
							"WarrantyTags": [],
							"RenewalChildren": null,
							"RenewalParents": null
						},
						"price": {
							"WarrantyId": 1,
							"Date": "\/Date(1388489550745)\/",
							"Branch": 900,
							"BranchType": "C",
							"CostPrice": 50.0000,
							"RetailPrice": 80.0000
						},
						"promotion": null
					}, {
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
				});

				scope.addWarranty({
					"warrantyLink": {
						"LinkId": 1,
						"LinkName": "link 1",
						"ProductMatch": false,
						"LevelMatch": 10,
						"Id": 2,
						"Number": "133122",
						"Description": "warranty 1",
						"Length": 12,
						"TaxRate": 15.00,
						"IsFree": false,
						"IsDeleted": false,
						"WarrantyTags": [],
						"RenewalChildren": null,
						"RenewalParents": null
					},
					"price": {
						"WarrantyId": 1,
						"Date": "\/Date(1388489550745)\/",
						"Branch": 900,
						"BranchType": "C",
						"CostPrice": 50.0000,
						"RetailPrice": 80.0000
					},
					"promotion": null
				}, scope.cart.items[0]);

				expect(scope.cart.items[0].warranties).toBeDefined();
				expect(scope.cart.items[0].warranties.length).toBe(2);
				expect(scope.cart.items[0].availableWarranties.length).toBe(1);
			});

			it('should add the selected warranty but keep in list of available warranties when one or more quantity of the item do not have a warranty', function () {
				createController();
				$httpBackend.flush();

				scope.cart.items.push({
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					quantity: 2,
					Description1: 'Item description 1',
					Description2: 'Item description 2',
					availableWarranties: [{
						"warrantyLink": {
							"LinkId": 1,
							"LinkName": "link 1",
							"ProductMatch": false,
							"LevelMatch": 10,
							"Id": 2,
							"Number": "133122",
							"Description": "warranty 1",
							"Length": 12,
							"TaxRate": 15.00,
							"IsFree": false,
							"IsDeleted": false,
							"WarrantyTags": [],
							"RenewalChildren": null,
							"RenewalParents": null
						},
						"price": {
							"WarrantyId": 1,
							"Date": "\/Date(1388489550745)\/",
							"Branch": 900,
							"BranchType": "C",
							"CostPrice": 50.0000,
							"RetailPrice": 80.0000
						},
						"promotion": null
					}, {
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
				});

				scope.addWarranty({
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
				}, scope.cart.items[0]);

				expect(scope.cart.items[0].warranties).toBeDefined();
				expect(scope.cart.items[0].warranties.length).toBe(1);
				expect(scope.cart.items[0].availableWarranties.length).toBe(2);
			});

			it('should remove the deleted warranty but only add to available warranties if not already in there', function () {
				createController();
				$httpBackend.flush();

				scope.cart.items.push({
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					quantity: 2,
					Description1: 'Item description 1',
					Description2: 'Item description 2',
					warranties: [{
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
					}],
					availableWarranties: [{
						"warrantyLink": {
							"LinkId": 1,
							"LinkName": "link 1",
							"ProductMatch": false,
							"LevelMatch": 10,
							"Id": 2,
							"Number": "133122",
							"Description": "warranty 1",
							"Length": 12,
							"TaxRate": 15.00,
							"IsFree": false,
							"IsDeleted": false,
							"WarrantyTags": [],
							"RenewalChildren": null,
							"RenewalParents": null
						},
						"price": {
							"WarrantyId": 1,
							"Date": "\/Date(1388489550745)\/",
							"Branch": 900,
							"BranchType": "C",
							"CostPrice": 50.0000,
							"RetailPrice": 80.0000
						},
						"promotion": null
					}, {
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
				});

				scope.removeWarranty(0, scope.cart.items[0]);

				expect(scope.cart.items[0].warranties).toBeDefined();
				expect(scope.cart.items[0].warranties.length).toBe(0);
				expect(scope.cart.items[0].availableWarranties.length).toBe(2);
			});

			it('should only remove one instance of the deleted warranty when 2 have been added', function () {
				createController();
				$httpBackend.flush();

				scope.cart.items.push({
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					quantity: 2,
					Description1: 'Item description 1',
					Description2: 'Item description 2',
					warranties: [{
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
					}, {
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
					}],
					availableWarranties: [{
						"warrantyLink": {
							"LinkId": 1,
							"LinkName": "link 1",
							"ProductMatch": false,
							"LevelMatch": 10,
							"Id": 1,
							"Number": "133122",
							"Description": "warranty 1",
							"Length": 12,
							"TaxRate": 15.00,
							"IsFree": false,
							"IsDeleted": false,
							"WarrantyTags": [],
							"RenewalChildren": null,
							"RenewalParents": null
						},
						"price": {
							"WarrantyId": 1,
							"Date": "\/Date(1388489550745)\/",
							"Branch": 900,
							"BranchType": "C",
							"CostPrice": 50.0000,
							"RetailPrice": 80.0000
						},
						"promotion": null
					}]
				});

				scope.removeWarranty(1, scope.cart.items[0]);

				expect(scope.cart.items[0].warranties).toBeDefined();
				expect(scope.cart.items[0].warranties.length).toBe(1);
				expect(scope.cart.items[0].availableWarranties.length).toBe(2);
			});

			it('should add another free warranty if available when item quantity is increased', function () {
				createController();
				$httpBackend.flush();

				var item = {
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					quantity: 1,
					Description1: 'Item description 1',
					Description2: 'Item description 2'
				};

				scope.cart.items.push(item);
				item.warranties = [{
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
				}, {
					"warrantyLink": {
						"LinkId": 2,
						"LinkName": "link 2",
						"ProductMatch": false,
						"LevelMatch": 10,
						"Id": 3,
						"Number": "56767",
						"Description": "warranty 3",
						"Length": 12,
						"TaxRate": 15.00,
						"IsFree": true,
						"IsDeleted": false,
						"WarrantyTags": [],
						"RenewalChildren": null,
						"RenewalParents": null
					},
					"price": null,
					"promotion": null
				}];
				item.availableWarranties = [{
					"warrantyLink": {
						"LinkId": 1,
						"LinkName": "link 1",
						"ProductMatch": false,
						"LevelMatch": 10,
						"Id": 1,
						"Number": "133122",
						"Description": "warranty 1",
						"Length": 12,
						"TaxRate": 15.00,
						"IsFree": false,
						"IsDeleted": false,
						"WarrantyTags": [],
						"RenewalChildren": null,
						"RenewalParents": null
					},
					"price": {
						"WarrantyId": 1,
						"Date": "\/Date(1388489550745)\/",
						"Branch": 900,
						"BranchType": "C",
						"CostPrice": 50.0000,
						"RetailPrice": 80.0000
					},
					"promotion": null
				}];

				scope.increaseQuantity(item);

				expect(scope.cart.items[0].quantity).toBe(2);
				expect(scope.cart.items[0].warranties.length).toBe(3);
				var freeWarranties = _.filter(scope.cart.items[0].warranties, function (w) {
					return w.warrantyLink.IsFree === true;
				});
				expect(freeWarranties.length).toBe(2);
			});

			it('should show all warranties in available list when item quantity is increased', function () {
				createController();
				$httpBackend.flush();

				var item = {
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					quantity: 1,
					Description1: 'Item description 1',
					Description2: 'Item description 2'
				};

				scope.cart.items.push(item);
				item.warranties = [{
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
				}, {
					"warrantyLink": {
						"LinkId": 2,
						"LinkName": "link 2",
						"ProductMatch": false,
						"LevelMatch": 10,
						"Id": 3,
						"Number": "56767",
						"Description": "warranty 3",
						"Length": 12,
						"TaxRate": 15.00,
						"IsFree": true,
						"IsDeleted": false,
						"WarrantyTags": [],
						"RenewalChildren": null,
						"RenewalParents": null
					},
					"price": null,
					"promotion": null
				}];
				item.availableWarranties = [{
					"warrantyLink": {
						"LinkId": 1,
						"LinkName": "link 1",
						"ProductMatch": false,
						"LevelMatch": 10,
						"Id": 1,
						"Number": "133122",
						"Description": "warranty 1",
						"Length": 12,
						"TaxRate": 15.00,
						"IsFree": false,
						"IsDeleted": false,
						"WarrantyTags": [],
						"RenewalChildren": null,
						"RenewalParents": null
					},
					"price": {
						"WarrantyId": 1,
						"Date": "\/Date(1388489550745)\/",
						"Branch": 900,
						"BranchType": "C",
						"CostPrice": 50.0000,
						"RetailPrice": 80.0000
					},
					"promotion": null
				}];

				scope.increaseQuantity(item);

				expect(item.availableWarranties.length).toBe(2);
				expect(item.availableWarranties[1].warrantyLink.Id).toBe(2);
			});

			it('should update cart total when item quantity is increased', function () {
				createController();
				$httpBackend.flush();

				var item = {
					ItemNoWarrantyLink: '245425',
					taxExclusivePrice: 591.33,
					quantity: 1,
					Description1: 'Item description 1',
					Description2: 'Item description 2'
				};

				scope.cart.items.push(item);
				item.warranties = [{
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
				}, {
					"warrantyLink": {
						"LinkId": 2,
						"LinkName": "link 2",
						"ProductMatch": false,
						"LevelMatch": 10,
						"Id": 3,
						"Number": "56767",
						"Description": "warranty 3",
						"Length": 12,
						"TaxRate": 15.00,
						"IsFree": true,
						"IsDeleted": false,
						"WarrantyTags": [],
						"RenewalChildren": null,
						"RenewalParents": null
					},
					"price": null,
					"promotion": null
				}];
				item.availableWarranties = [{
					"warrantyLink": {
						"LinkId": 1,
						"LinkName": "link 1",
						"ProductMatch": false,
						"LevelMatch": 10,
						"Id": 1,
						"Number": "133122",
						"Description": "warranty 1",
						"Length": 12,
						"TaxRate": 15.00,
						"IsFree": false,
						"IsDeleted": false,
						"WarrantyTags": [],
						"RenewalChildren": null,
						"RenewalParents": null
					},
					"price": {
						"WarrantyId": 1,
						"Date": "\/Date(1388489550745)\/",
						"Branch": 900,
						"BranchType": "C",
						"CostPrice": 50.0000,
						"RetailPrice": 80.0000
					},
					"promotion": null
				}];

				expect(scope.cart.total).toBe(0);
				expect(scope.cart.balance).toBe(0);

				scope.increaseQuantity(item);

				expect(scope.cart.total).toBe(1282.66);
				expect(scope.cart.balance).toBe(1282.66);
			});

			it('should update cart total when item quantity is decreased', function () {
				createController();
				$httpBackend.flush();

				var item = {
					ItemNoWarrantyLink: '245425',
					taxExclusivePrice: 591.33,
					quantity: 1,
					Description1: 'Item description 1',
					Description2: 'Item description 2'
				};

				scope.cart.items.push(item);
				item.warranties = [{
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
				}, {
					"warrantyLink": {
						"LinkId": 2,
						"LinkName": "link 2",
						"ProductMatch": false,
						"LevelMatch": 10,
						"Id": 3,
						"Number": "56767",
						"Description": "warranty 3",
						"Length": 12,
						"TaxRate": 15.00,
						"IsFree": true,
						"IsDeleted": false,
						"WarrantyTags": [],
						"RenewalChildren": null,
						"RenewalParents": null
					},
					"price": null,
					"promotion": null
				}];
				item.availableWarranties = [{
					"warrantyLink": {
						"LinkId": 1,
						"LinkName": "link 1",
						"ProductMatch": false,
						"LevelMatch": 10,
						"Id": 1,
						"Number": "133122",
						"Description": "warranty 1",
						"Length": 12,
						"TaxRate": 15.00,
						"IsFree": false,
						"IsDeleted": false,
						"WarrantyTags": [],
						"RenewalChildren": null,
						"RenewalParents": null
					},
					"price": {
						"WarrantyId": 1,
						"Date": "\/Date(1388489550745)\/",
						"Branch": 900,
						"BranchType": "C",
						"CostPrice": 50.0000,
						"RetailPrice": 80.0000
					},
					"promotion": null
				}];

				expect(scope.cart.total).toBe(0);
				expect(scope.cart.balance).toBe(0);

				scope.increaseQuantity(item);

				expect(scope.cart.total).toBe(1282.66);
				expect(scope.cart.balance).toBe(1282.66);

				scope.decreaseQuantity(item);

				expect(scope.cart.total).toBe(691.33);
				expect(scope.cart.balance).toBe(691.33);
			});

			it('should remove warranties from available list when item quantity is decreased', function () {
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
				item.warranties = [{
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
				}, {
					"warrantyLink": {
						"LinkId": 2,
						"LinkName": "link 2",
						"ProductMatch": false,
						"LevelMatch": 10,
						"Id": 3,
						"Number": "56767",
						"Description": "warranty 3",
						"Length": 12,
						"TaxRate": 15.00,
						"IsFree": true,
						"IsDeleted": false,
						"WarrantyTags": [],
						"RenewalChildren": null,
						"RenewalParents": null
					},
					"price": null,
					"promotion": null
				}];
				item.availableWarranties = [{
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
				}, {
					"warrantyLink": {
						"LinkId": 1,
						"LinkName": "link 1",
						"ProductMatch": false,
						"LevelMatch": 10,
						"Id": 1,
						"Number": "133122",
						"Description": "warranty 1",
						"Length": 12,
						"TaxRate": 15.00,
						"IsFree": false,
						"IsDeleted": false,
						"WarrantyTags": [], 
						"RenewalChildren": null,
						"RenewalParents": null
					},
					"price": {
						"WarrantyId": 1,
						"Date": "\/Date(1388489550745)\/",
						"Branch": 900,
						"BranchType": "C",
						"CostPrice": 50.0000,
						"RetailPrice": 80.0000
					},
					"promotion": null
				}];

				scope.decreaseQuantity(item);

				expect(item.availableWarranties.length).toBe(1);
				expect(item.availableWarranties[0].warrantyLink.Id).toBe(1);
			});

			it('should remove one free warranty from selected list when item quantity is decreased', function () {
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
				item.warranties = [{
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
				}, {
					"warrantyLink": {
						"LinkId": 2,
						"LinkName": "link 2",
						"ProductMatch": false,
						"LevelMatch": 10,
						"Id": 3,
						"Number": "56767",
						"Description": "warranty 3",
						"Length": 12,
						"TaxRate": 15.00,
						"IsFree": true,
						"IsDeleted": false,
						"WarrantyTags": [],
						"RenewalChildren": null,
						"RenewalParents": null
					},
					"price": null,
					"promotion": null
				}, {
					"warrantyLink": {
						"LinkId": 2,
						"LinkName": "link 2",
						"ProductMatch": false,
						"LevelMatch": 10,
						"Id": 3,
						"Number": "56767",
						"Description": "warranty 3",
						"Length": 12,
						"TaxRate": 15.00,
						"IsFree": true,
						"IsDeleted": false,
						"WarrantyTags": [],
						"RenewalChildren": null,
						"RenewalParents": null
					},
					"price": null,
					"promotion": null
				}];
				item.availableWarranties = [{
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
				}, {
					"warrantyLink": {
						"LinkId": 1,
						"LinkName": "link 1",
						"ProductMatch": false,
						"LevelMatch": 10,
						"Id": 1,
						"Number": "133122",
						"Description": "warranty 1",
						"Length": 12,
						"TaxRate": 15.00,
						"IsFree": false,
						"IsDeleted": false,
						"WarrantyTags": [],
						"RenewalChildren": null,
						"RenewalParents": null
					},
					"price": {
						"WarrantyId": 1,
						"Date": "\/Date(1388489550745)\/",
						"Branch": 900,
						"BranchType": "C",
						"CostPrice": 50.0000,
						"RetailPrice": 80.0000
					},
					"promotion": null
				}];

				scope.decreaseQuantity(item);

				expect(scope.cart.items[0].warranties.length).toBe(2);

				var freeWarranty = _.filter(scope.cart.items[0].warranties, function (w) {
					return w.warrantyLink.IsFree === true;
				});
				expect(freeWarranty).toBeDefined();

				var extendedWarranty = _.filter(scope.cart.items[0].warranties, function (w) {
					return w.warrantyLink.IsFree === false;
				});
				expect(extendedWarranty).toBeDefined();
			});

			it('should remove extended warranty from selected list when item quantity is decreased if more than one has been added', function () {
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
				item.warranties = [{
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
				}, {
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
				}, {
					"warrantyLink": {
						"LinkId": 2,
						"LinkName": "link 2",
						"ProductMatch": false,
						"LevelMatch": 10,
						"Id": 3,
						"Number": "56767",
						"Description": "warranty 3",
						"Length": 12,
						"TaxRate": 15.00,
						"IsFree": true,
						"IsDeleted": false,
						"WarrantyTags": [],
						"RenewalChildren": null,
						"RenewalParents": null
					},
					"price": null,
					"promotion": null
				}, {
					"warrantyLink": {
						"LinkId": 2,
						"LinkName": "link 2",
						"ProductMatch": false,
						"LevelMatch": 10,
						"Id": 3,
						"Number": "56767",
						"Description": "warranty 3",
						"Length": 12,
						"TaxRate": 15.00,
						"IsFree": true,
						"IsDeleted": false,
						"WarrantyTags": [],
						"RenewalChildren": null,
						"RenewalParents": null
					},
					"price": null,
					"promotion": null
				}];

				item.availableWarranties = [{
					"warrantyLink": {
						"LinkId": 1,
						"LinkName": "link 1",
						"ProductMatch": false,
						"LevelMatch": 10,
						"Id": 1,
						"Number": "133122",
						"Description": "warranty 1",
						"Length": 12,
						"TaxRate": 15.00,
						"IsFree": false,
						"IsDeleted": false,
						"WarrantyTags": [],
						"RenewalChildren": null,
						"RenewalParents": null
					},
					"price": {
						"WarrantyId": 1,
						"Date": "\/Date(1388489550745)\/",
						"Branch": 900,
						"BranchType": "C",
						"CostPrice": 50.0000,
						"RetailPrice": 80.0000
					},
					"promotion": null
				}];

				scope.decreaseQuantity(item);

				expect(scope.cart.items[0].warranties.length).toBe(2);

				var freeWarranty = _.filter(scope.cart.items[0].warranties, function (w) {
					return w.warrantyLink.IsFree === true;
				});
				expect(freeWarranty).toBeDefined();

				var extendedWarranty = _.filter(scope.cart.items[0].warranties, function (w) {
					return w.warrantyLink.IsFree === false;
				});
				expect(extendedWarranty).toBeDefined();
			});

			it('should remove extended warranty cost when item quantity is decreased if more than one has been added', function () {
				createController();
				$httpBackend.flush();

				var item = {
					ItemNoWarrantyLink: '245425',
					taxExclusivePrice: 591.33,
					quantity: 2,
					Description1: 'Item description 1',
					Description2: 'Item description 2'
				};

				scope.cart.items.push(item);
				item.warranties = [{
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
				}, {
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
				}, {
					"warrantyLink": {
						"LinkId": 2,
						"LinkName": "link 2",
						"ProductMatch": false,
						"LevelMatch": 10,
						"Id": 3,
						"Number": "56767",
						"Description": "warranty 3",
						"Length": 12,
						"TaxRate": 15.00,
						"IsFree": true,
						"IsDeleted": false,
						"WarrantyTags": [],
						"RenewalChildren": null,
						"RenewalParents": null
					},
					"price": null,
					"promotion": null
				}, {
					"warrantyLink": {
						"LinkId": 2,
						"LinkName": "link 2",
						"ProductMatch": false,
						"LevelMatch": 10,
						"Id": 3,
						"Number": "56767",
						"Description": "warranty 3",
						"Length": 12,
						"TaxRate": 15.00,
						"IsFree": true,
						"IsDeleted": false,
						"WarrantyTags": [],
						"RenewalChildren": null,
						"RenewalParents": null
					},
					"price": null,
					"promotion": null
				}];

				item.availableWarranties = [{
					"warrantyLink": {
						"LinkId": 1,
						"LinkName": "link 1",
						"ProductMatch": false,
						"LevelMatch": 10,
						"Id": 1,
						"Number": "133122",
						"Description": "warranty 1",
						"Length": 12,
						"TaxRate": 15.00,
						"IsFree": false,
						"IsDeleted": false,
						"WarrantyTags": [],
						"RenewalChildren": null,
						"RenewalParents": null
					},
					"price": {
						"WarrantyId": 1,
						"Date": "\/Date(1388489550745)\/",
						"Branch": 900,
						"BranchType": "C",
						"CostPrice": 50.0000,
						"RetailPrice": 80.0000
					},
					"promotion": null
				}];

				scope.cart.total = scope.cart.balance = 1382.66;

				scope.decreaseQuantity(item);

				expect(scope.cart.total).toBe(691.33);
			});

			it('should not allow to decrease item quantity when more than one type of extended warranty has been added', function () {
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
				item.warranties = [{
					"warrantyLink": {
						"LinkId": 2,
						"LinkName": "link 2",
						"ProductMatch": false,
						"LevelMatch": 10,
						"Id": 3,
						"Number": "56767",
						"Description": "warranty 3",
						"Length": 12,
						"TaxRate": 15.00,
						"IsFree": true,
						"IsDeleted": false,
						"WarrantyTags": [],
						"RenewalChildren": null,
						"RenewalParents": null
					},
					"price": null,
					"promotion": null
				}, {
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
				}, {
					"warrantyLink": {
						"LinkId": 2,
						"LinkName": "link 2",
						"ProductMatch": false,
						"LevelMatch": 10,
						"Id": 3,
						"Number": "56767",
						"Description": "warranty 3",
						"Length": 12,
						"TaxRate": 15.00,
						"IsFree": true,
						"IsDeleted": false,
						"WarrantyTags": [],
						"RenewalChildren": null,
						"RenewalParents": null
					},
					"price": null,
					"promotion": null
				}, {
					"warrantyLink": {
						"LinkId": 1,
						"LinkName": "link 1",
						"ProductMatch": false,
						"LevelMatch": 10,
						"Id": 1,
						"Number": "133122",
						"Description": "warranty 1",
						"Length": 12,
						"TaxRate": 15.00,
						"IsFree": false,
						"IsDeleted": false,
						"WarrantyTags": [],
						"RenewalChildren": null,
						"RenewalParents": null
					},
					"price": {
						"WarrantyId": 1,
						"Date": "\/Date(1388489550745)\/",
						"Branch": 900,
						"BranchType": "C",
						"CostPrice": 50.0000,
						"RetailPrice": 80.0000
					},
					"promotion": null
				}];

				item.availableWarranties = [];

				scope.decreaseQuantity(item);

				expect(scope.cart.items[0].warranties.length).toBe(4);

				var freeWarranty = _.filter(scope.cart.items[0].warranties, function (w) {
					return w.warrantyLink.IsFree === true;
				});
				expect(freeWarranty).toBeDefined();
				expect(freeWarranty.length).toBe(2);

				var extendedWarranty = _.filter(scope.cart.items[0].warranties, function (w) {
					return w.warrantyLink.IsFree === false;
				});
				expect(extendedWarranty).toBeDefined();
				expect(extendedWarranty.length).toBe(2);
			});

			it('should set flag to indicate when extended warranty cannot be added', function () {
				createController();
				$httpBackend.flush();

				scope.cart.items.push({
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					Description1: 'Item description 1',
					Description2: 'Item description 2',
					availableWarranties: [{
						"warrantyLink": {
							"LinkId": 1,
							"LinkName": "link 1",
							"ProductMatch": false,
							"LevelMatch": 10,
							"Id": 2,
							"Number": "133122",
							"Description": "warranty 1",
							"Length": 12,
							"TaxRate": 15.00,
							"IsFree": false,
							"IsDeleted": false,
							"WarrantyTags": [],
							"RenewalChildren": null,
							"RenewalParents": null
						},
						"price": {
							"WarrantyId": 1,
							"Date": "\/Date(1388489550745)\/",
							"Branch": 900,
							"BranchType": "C",
							"CostPrice": 50.0000,
							"RetailPrice": 80.0000
						},
						"promotion": null
					}, {
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
				});

				scope.addWarranty({
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
				}, scope.cart.items[0]);

				expect(scope.cart.items[0].canAddWarranty).toBe(false);
			});

			it('should update flag to indicate when extended warranty can be added if quantity is increased', function () {
				createController();
				$httpBackend.flush();

				scope.cart.items.push({
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					Description1: 'Item description 1',
					Description2: 'Item description 2',
					availableWarranties: [{
						"warrantyLink": {
							"LinkId": 1,
							"LinkName": "link 1",
							"ProductMatch": false,
							"LevelMatch": 10,
							"Id": 2,
							"Number": "133122",
							"Description": "warranty 1",
							"Length": 12,
							"TaxRate": 15.00,
							"IsFree": false,
							"IsDeleted": false,
							"WarrantyTags": [],
							"RenewalChildren": null,
							"RenewalParents": null
						},
						"price": {
							"WarrantyId": 1,
							"Date": "\/Date(1388489550745)\/",
							"Branch": 900,
							"BranchType": "C",
							"CostPrice": 50.0000,
							"RetailPrice": 80.0000
						},
						"promotion": null
					}, {
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
				});

				scope.addWarranty({
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
				}, scope.cart.items[0]);

				scope.increaseQuantity(scope.cart.items[0]);
				expect(scope.cart.items[0].canAddWarranty).toBe(true);
			});

			it('should update flag to indicate when extended warranty cannot be added if quantity is decreased', function () {
				createController();
				$httpBackend.flush();

				scope.cart.items.push({
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					quantity: 1,
					Description1: 'Item description 1',
					Description2: 'Item description 2',
					availableWarranties: [{
						"warrantyLink": {
							"LinkId": 1,
							"LinkName": "link 1",
							"ProductMatch": false,
							"LevelMatch": 10,
							"Id": 2,
							"Number": "133122",
							"Description": "warranty 1",
							"Length": 12,
							"TaxRate": 15.00,
							"IsFree": false,
							"IsDeleted": false,
							"WarrantyTags": [],
							"RenewalChildren": null,
							"RenewalParents": null
						},
						"price": {
							"WarrantyId": 1,
							"Date": "\/Date(1388489550745)\/",
							"Branch": 900,
							"BranchType": "C",
							"CostPrice": 50.0000,
							"RetailPrice": 80.0000
						},
						"promotion": null
					}, {
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
				});

				scope.addWarranty({
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
				}, scope.cart.items[0]);

				scope.increaseQuantity(scope.cart.items[0]);
				scope.decreaseQuantity(scope.cart.items[0]);
				expect(scope.cart.items[0].canAddWarranty).toBe(false);
			});

			it('should allow adding extended warranty if quantity is decreased as long as quantity is greater than added warranties', function () {
				createController();
				$httpBackend.flush();

				scope.cart.items.push({
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					quantity: 1,
					Description1: 'Item description 1',
					Description2: 'Item description 2',
					availableWarranties: [{
						"warrantyLink": {
							"LinkId": 1,
							"LinkName": "link 1",
							"ProductMatch": false,
							"LevelMatch": 10,
							"Id": 2,
							"Number": "133122",
							"Description": "warranty 1",
							"Length": 12,
							"TaxRate": 15.00,
							"IsFree": false,
							"IsDeleted": false,
							"WarrantyTags": [],
							"RenewalChildren": null,
							"RenewalParents": null
						},
						"price": {
							"WarrantyId": 1,
							"Date": "\/Date(1388489550745)\/",
							"Branch": 900,
							"BranchType": "C",
							"CostPrice": 50.0000,
							"RetailPrice": 80.0000
						},
						"promotion": null
					}, {
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
				});

				scope.addWarranty({
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
				}, scope.cart.items[0]);

				scope.increaseQuantity(scope.cart.items[0]);
				scope.increaseQuantity(scope.cart.items[0]);
				scope.decreaseQuantity(scope.cart.items[0]);
				expect(scope.cart.items[0].canAddWarranty).toBe(true);
			});

			it('should remove the deleted warranty from the warranty list and move it to the available warranties', function () {
				createController();
				$httpBackend.flush();

				scope.cart.items.push({
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					Description1: 'Item description 1',
					Description2: 'Item description 2',
					warranties: [{
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
					}],
					availableWarranties: [{
						"warrantyLink": {
							"LinkId": 1,
							"LinkName": "link 1",
							"ProductMatch": false,
							"LevelMatch": 10,
							"Id": 1,
							"Number": "133122",
							"Description": "warranty 1",
							"Length": 12,
							"TaxRate": 15.00,
							"IsFree": false,
							"IsDeleted": false,
							"WarrantyTags": [],
							"RenewalChildren": null,
							"RenewalParents": null
						},
						"price": {
							"WarrantyId": 1,
							"Date": "\/Date(1388489550745)\/",
							"Branch": 900,
							"BranchType": "C",
							"CostPrice": 50.0000,
							"RetailPrice": 80.0000
						},
						"promotion": null
					}]
				});

				scope.removeWarranty(0, scope.cart.items[0]);

				expect(scope.cart.items[0].canAddWarranty).toBe(true);
			});

			it('should restrict the edited warranty duration to be no more than the warranty length', function () {
				createController();
				$httpBackend.flush();

				scope.cart.items.push({
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					Description1: 'Item description 1',
					Description2: 'Item description 2',
					warranties: [{
						"duration": 20,
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
					}],
					availableWarranties: [{
						"warrantyLink": {
							"LinkId": 1,
							"LinkName": "link 1",
							"ProductMatch": false,
							"LevelMatch": 10,
							"Id": 1,
							"Number": "133122",
							"Description": "warranty 1",
							"Length": 12,
							"TaxRate": 15.00,
							"IsFree": false,
							"IsDeleted": false,
							"WarrantyTags": [],
							"RenewalChildren": null,
							"RenewalParents": null
						},
						"price": {
							"WarrantyId": 1,
							"Date": "\/Date(1388489550745)\/",
							"Branch": 900,
							"BranchType": "C",
							"CostPrice": 50.0000,
							"RetailPrice": 80.0000
						},
						"promotion": null
					}]
				});
				
				scope.restrictWarrantyMaximumDuration(scope.cart.items[0].warranties[0]);
			});

			it('should set a flag to indicate that a warranty is being purchased', function () {
				createController();
				$httpBackend.flush();

				scope.cart.items.push({
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					Description1: 'Item description 1',
					Description2: 'Item description 2',
					availableWarranties: [{
						"warrantyLink": {
							"LinkId": 1,
							"LinkName": "link 1",
							"ProductMatch": false,
							"LevelMatch": 10,
							"Id": 2,
							"Number": "133122",
							"Description": "warranty 1",
							"Length": 12,
							"TaxRate": 15.00,
							"IsFree": false,
							"IsDeleted": false,
							"WarrantyTags": [],
							"RenewalChildren": null,
							"RenewalParents": null
						},
						"price": {
							"WarrantyId": 1,
							"Date": "\/Date(1388489550745)\/",
							"Branch": 900,
							"BranchType": "C",
							"CostPrice": 50.0000,
							"RetailPrice": 80.0000
						},
						"promotion": null
					}, {
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
				});

				scope.addWarranty({
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
				}, scope.cart.items[0]);

				expect(scope.cart.warrantyBeingPurchased).toBe(true);
			});

			it('should clear flag that indicates that a warranty is being purchased if all warranties are removed', function () {
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

				item.warranties = [{
					"warrantyLink": {
						"LinkId": 2,
						"LinkName": "link 2",
						"ProductMatch": false,
						"LevelMatch": 10,
						"Id": 3,
						"Number": "56767",
						"Description": "warranty 3",
						"Length": 12,
						"TaxRate": 15.00,
						"IsFree": true,
						"IsDeleted": false,
						"WarrantyTags": [],
						"RenewalChildren": null,
						"RenewalParents": null
					},
					"price": null,
					"promotion": null
				}, {
					"warrantyLink": {
						"LinkId": 2,
						"LinkName": "link 2",
						"ProductMatch": false,
						"LevelMatch": 10,
						"Id": 3,
						"Number": "56767",
						"Description": "warranty 3",
						"Length": 12,
						"TaxRate": 15.00,
						"IsFree": true,
						"IsDeleted": false,
						"WarrantyTags": [],
						"RenewalChildren": null,
						"RenewalParents": null
					},
					"price": null,
					"promotion": null
				}];

				var warranty1 = {
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
				};

				var warranty2 = {
					"warrantyLink": {
						"LinkId": 1,
						"LinkName": "link 1",
						"ProductMatch": false,
						"LevelMatch": 10,
						"Id": 1,
						"Number": "133122",
						"Description": "warranty 1",
						"Length": 12,
						"TaxRate": 15.00,
						"IsFree": false,
						"IsDeleted": false,
						"WarrantyTags": [],
						"RenewalChildren": null,
						"RenewalParents": null
					},
					"price": {
						"WarrantyId": 1,
						"Date": "\/Date(1388489550745)\/",
						"Branch": 900,
						"BranchType": "C",
						"CostPrice": 50.0000,
						"RetailPrice": 80.0000
					},
					"promotion": null
				};

				scope.addWarranty(warranty1, item);
				scope.addWarranty(warranty2, item);

				scope.removeWarranty(3, item);
				expect(scope.cart.warrantyBeingPurchased).toBe(true);

				scope.removeWarranty(2, item);
				expect(scope.cart.warrantyBeingPurchased).toBe(false);
			});

			it('should allow increasing and decreasing quantity when there are no available warranties', function () {
				createController();
				$httpBackend.flush();

				var item = {
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					quantity: 1,
					Description1: 'Item description 1',
					Description2: 'Item description 2'
				};

				scope.cart.items.push(item);

				scope.increaseQuantity(item);
				scope.decreaseQuantity(item);
			});

			it('should add the item tax amount to the cart total', function () {
				createController();
				$httpBackend.flush();

				setFreeWarrantySearchExpectation(591.33, '245425');
				setWarrantySearchExpectation(591.33, '245425');

				scope.cart.searchItem = {
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					TaxExclusivePrice: 591.33,
					Description1: 'Item description 1',
					Description2: 'Item description 2',
					TaxAmount: 5.91
				};
				scope.addSearchItem();
				$httpBackend.flush();

				expect(scope.cart.total).toBe(591.33 + 5.91);
			});

			it('should include warranty tax amount in cart total', function () {
				createController();
				$httpBackend.flush();

				scope.cart.items.push({
					itemNumber: '245425',
					taxExclusivePrice: 591.33,
					description: 'Item description',
					quantity: 1,
					availableWarranties: [{
						"warrantyLink": {
							"LinkId": 1,
							"LinkName": "link 1",
							"ProductMatch": false,
							"LevelMatch": 10,
							"Id": 2,
							"Number": "133122",
							"Description": "warranty 1",
							"Length": 12,
							"TaxRate": 15.00,
							"IsFree": false,
							"IsDeleted": false,
							"WarrantyTags": [],
							"RenewalChildren": null,
							"RenewalParents": null
						},
						"price": {
							"WarrantyId": 1,
							"Date": "\/Date(1388489550745)\/",
							"Branch": 900,
							"BranchType": "C",
							"CostPrice": 50.0000,
							"RetailPrice": 80.0000
						},
						"promotion": null
					}, {
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
				});
				
				scope.cart.total = 0;

				scope.addWarranty({
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
						"RetailPrice": 100.0000,
						"TaxAmount": 12.5
					},
					"promotion": null
				}, scope.cart.items[0]);

				expect(scope.cart.total).toBe(591.33 + 112.5);
			});

			afterEach(function () {
				$httpBackend.verifyNoOutstandingExpectation();
				$httpBackend.verifyNoOutstandingRequest();
			});
		});
	});
});