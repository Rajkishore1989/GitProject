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

		describe('SalesController :: Basket :: Installations', function () {
			var scope, createController, $httpBackend;
			var setInstallationSearchExpectation = function (itemNumber) {
				$httpBackend.expectGET('/Merchandising/Catalogue/GetInstallations?itemNumber=' + itemNumber).respond(
				[{
					"Id": 26260,
					"ItemNo": "LCDINST",
					"ItemDescription": "LCD WALL MOUNT",
					"ItemDescription2": "LCD WALL MOUNT",
					"CostPrice": 0.0000,
					"UnitPriceHP": 100.0000,
					"UnitPriceCash": 100.0000,
					"TaxAmount": 12.5,
					"TaxRate": 12.5,
					"IUPC": "LCDINST",
					"ItemID": 26260
				}, {
					"Id": 26261,
					"ItemNo": "LCDINST1",
					"ItemDescription": "LCD SET INSTALLATION",
					"ItemDescription2": "LCD SET INSTALLATION",
					"CostPrice": 0.0000,
					"UnitPriceHP": 150.0000,
					"UnitPriceCash": 150.0000,
					"TaxAmount": 18.75,
					"TaxRate": 12.5,
					"IUPC": "LCDINST1",
					"ItemID": 26261
				}]);
			};

			beforeEach(inject(function (_$httpBackend_, $rootScope, $controller) {
				$httpBackend = _$httpBackend_;
				$httpBackend.expectPOST('/Config/DecisionTable/Load/').respond('{}');
				$httpBackend.when('POST', '/Warranty/Link/Search').respond({});

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

			it('should search for installations when adding an item to the cart', function () {
				createController();
				$httpBackend.flush();
				setInstallationSearchExpectation('245425');
				scope.cart.searchItem = {
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					Description1: 'Item description 1',
					Description2: 'Item description 2'
				};
				scope.addSearchItem();
				$httpBackend.flush();
			});

			it('should add the installations to the list of available installations', function () {
				createController();
				$httpBackend.flush();
				setInstallationSearchExpectation('245425');
				scope.cart.searchItem = {
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					Description1: 'Item description 1',
					Description2: 'Item description 2'
				};
				scope.addSearchItem();
				$httpBackend.flush();

				expect(scope.cart.items[0].availableInstallations).toBeDefined();
				expect(scope.cart.items[0].availableInstallations.length).toBe(2);
			});

			it('should set a flag to indicate that installations can be added', function () {
				createController();
				$httpBackend.flush();
				setInstallationSearchExpectation('245425');
				scope.cart.searchItem = {
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					Description1: 'Item description 1',
					Description2: 'Item description 2'
				};
				scope.addSearchItem();
				$httpBackend.flush();

				expect(scope.cart.items[0].canAddInstallation).toBe(true);
			});

			it('should add the selected installation to the item', function () {
				createController();
				$httpBackend.flush();

				scope.cart.items.push({
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					quantity: 1,
					Description1: 'Item description 1',
					Description2: 'Item description 2',
					canAddInstallation: true,
					availableInstallations: [{
						"Id": 26260,
						"ItemNo": "LCDINST",
						"ItemDescription": "LCD WALL MOUNT",
						"ItemDescription2": "LCD WALL MOUNT",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST",
						"ItemID": 26260
					}, {
						"Id": 26261,
						"ItemNo": "LCDINST1",
						"ItemDescription": "LCD SET INSTALLATION",
						"ItemDescription2": "LCD SET INSTALLATION",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST1",
						"ItemID": 26261
					}]
				});

				scope.addInstallation({
					"Id": 26260,
					"ItemNo": "LCDINST",
					"ItemDescription": "LCD WALL MOUNT",
					"ItemDescription2": "LCD WALL MOUNT",
					"CostPrice": 0.0000,
					"UnitPriceHP": 0.0000,
					"UnitPriceCash": 0.0000,
					"TaxRate": 12.5,
					"IUPC": "LCDINST",
					"ItemID": 26260
				}, scope.cart.items[0]);
				expect(scope.cart.items[0].installations).toBeDefined();
				expect(scope.cart.items[0].installations.length).toBe(1);
				expect(scope.cart.items[0].installations[0].Id).toBe(26260);
			});

			it('should populate the tax rate for the installation', function () {
				createController();
				$httpBackend.flush();

				scope.cart.items.push({
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					quantity: 1,
					Description1: 'Item description 1',
					Description2: 'Item description 2',
					canAddInstallation: true,
					availableInstallations: [{
						"Id": 26260,
						"ItemNo": "LCDINST",
						"ItemDescription": "LCD WALL MOUNT",
						"ItemDescription2": "LCD WALL MOUNT",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST",
						"ItemID": 26260
					}, {
						"Id": 26261,
						"ItemNo": "LCDINST1",
						"ItemDescription": "LCD SET INSTALLATION",
						"ItemDescription2": "LCD SET INSTALLATION",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST1",
						"ItemID": 26261
					}]
				});

				scope.addInstallation({
					"Id": 26260,
					"ItemNo": "LCDINST",
					"ItemDescription": "LCD WALL MOUNT",
					"ItemDescription2": "LCD WALL MOUNT",
					"CostPrice": 0.0000,
					"UnitPriceHP": 0.0000,
					"UnitPriceCash": 0.0000,
					"TaxRate": 12.5,
					"IUPC": "LCDINST",
					"ItemID": 26260
				}, scope.cart.items[0]);

				expect(scope.cart.items[0].installations[0].TaxRate).toBe(12.5);
			});

			it('should add the cost of the selected installation to the cart total', function () {
				createController();
				$httpBackend.flush();

				scope.cart.items.push({
					itemNumber: '245425',
					taxExclusivePrice: 591.33,
					quantity: 1,
					description: 'Item description',
					canAddInstallation: true,
					availableInstallations: [{
						"Id": 26260,
						"ItemNo": "LCDINST",
						"ItemDescription": "LCD WALL MOUNT",
						"ItemDescription2": "LCD WALL MOUNT",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 100.0000,
						"TaxAmount": 12.5,
						"TaxRate": 12.5,
						"IUPC": "LCDINST",
						"ItemID": 26260
					}, {
						"Id": 26261,
						"ItemNo": "LCDINST1",
						"ItemDescription": "LCD SET INSTALLATION",
						"ItemDescription2": "LCD SET INSTALLATION",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST1",
						"ItemID": 26261
					}]
				});

				scope.addInstallation({
					Id: 26260,
					ItemNo: "LCDINST",
					ItemDescription: "LCD WALL MOUNT",
					ItemDescription2: "LCD WALL MOUNT",
					CostPrice: 0.0000,
					UnitPriceHP: 0.0000,
					UnitPriceCash: 100.0000,
					TaxAmount: 12.5,
					TaxRate: 12.5,
					IUPC: "LCDINST",
					ItemID: 26260
				}, scope.cart.items[0]);

				expect(scope.cart.total).toBe(591.33 + 100 + 12.5);
				expect(scope.cart.balance).toBe(591.33 + 100 + 12.5);
			});

			it('should set the balance even when installation cost is 0', function () {
				createController();
				$httpBackend.flush();

				scope.cart.items.push({
					itemNumber: '245425',
					taxExclusivePrice: 591.33,
					quantity: 1,
					description: 'Item description',
					canAddInstallation: true,
					availableInstallations: [{
						"Id": 26260,
						"ItemNo": "LCDINST",
						"ItemDescription": "LCD WALL MOUNT",
						"ItemDescription2": "LCD WALL MOUNT",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 100.0000,
						"TaxAmount": 12.5,
						"TaxRate": 12.5,
						"IUPC": "LCDINST",
						"ItemID": 26260
					}, {
						"Id": 26261,
						"ItemNo": "LCDINST1",
						"ItemDescription": "LCD SET INSTALLATION",
						"ItemDescription2": "LCD SET INSTALLATION",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST1",
						"ItemID": 26261
					}]
				});

				scope.addInstallation({
					Id: 26260,
					ItemNo: "LCDINST",
					ItemDescription: "LCD WALL MOUNT",
					ItemDescription2: "LCD WALL MOUNT",
					CostPrice: 0.0000,
					UnitPriceHP: 0.0000,
					UnitPriceCash: 0,
					TaxAmount: 0,
					TaxRate: 12.5,
					IUPC: "LCDINST",
					ItemID: 26260
				}, scope.cart.items[0]);

				expect(scope.cart.total).toBe(591.33);
				expect(scope.cart.balance).toBe(591.33);
			});

			it('should remove the selected installation from the list of available installations', function () {
				createController();
				$httpBackend.flush();

				scope.cart.items.push({
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					quantity: 1,
					Description1: 'Item description 1',
					Description2: 'Item description 2',
					canAddInstallation: true,
					availableInstallations: [{
						"Id": 26260,
						"ItemNo": "LCDINST",
						"ItemDescription": "LCD WALL MOUNT",
						"ItemDescription2": "LCD WALL MOUNT",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST",
						"ItemID": 26260
					}, {
						"Id": 26261,
						"ItemNo": "LCDINST1",
						"ItemDescription": "LCD SET INSTALLATION",
						"ItemDescription2": "LCD SET INSTALLATION",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST1",
						"ItemID": 26261
					}]
				});

				scope.addInstallation({
					"Id": 26260,
					"ItemNo": "LCDINST",
					"ItemDescription": "LCD WALL MOUNT",
					"ItemDescription2": "LCD WALL MOUNT",
					"CostPrice": 0.0000,
					"UnitPriceHP": 0.0000,
					"UnitPriceCash": 0.0000,
					"TaxRate": 12.5,
					"IUPC": "LCDINST",
					"ItemID": 26260
				}, scope.cart.items[0]);

				expect(scope.cart.items[0].availableInstallations.length).toBe(1);
				expect(scope.cart.items[0].availableInstallations[0].Id).toBe(26261);
			});

			it('should not remove the selected installation from the list of available installations when item quantity is greater', function () {
				createController();
				$httpBackend.flush();

				scope.cart.items.push({
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					quantity: 2,
					Description1: 'Item description 1',
					Description2: 'Item description 2',
					canAddInstallation: true,
					availableInstallations: [{
						"Id": 26260,
						"ItemNo": "LCDINST",
						"ItemDescription": "LCD WALL MOUNT",
						"ItemDescription2": "LCD WALL MOUNT",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST",
						"ItemID": 26260
					}, {
						"Id": 26261,
						"ItemNo": "LCDINST1",
						"ItemDescription": "LCD SET INSTALLATION",
						"ItemDescription2": "LCD SET INSTALLATION",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST1",
						"ItemID": 26261
					}]
				});

				scope.addInstallation({
					"Id": 26260,
					"ItemNo": "LCDINST",
					"ItemDescription": "LCD WALL MOUNT",
					"ItemDescription2": "LCD WALL MOUNT",
					"CostPrice": 0.0000,
					"UnitPriceHP": 0.0000,
					"UnitPriceCash": 0.0000,
					"TaxRate": 12.5,
					"IUPC": "LCDINST",
					"ItemID": 26260
				}, scope.cart.items[0]);

				expect(scope.cart.items[0].installations.length).toBe(1);
				expect(scope.cart.items[0].availableInstallations.length).toBe(2);
			});

			it('should remove the selected installation from the list of installations', function () {
				createController();
				$httpBackend.flush();

				scope.cart.items.push({
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					quantity: 1,
					Description1: 'Item description 1',
					Description2: 'Item description 2',
					installations: [{
						"Id": 26260,
						"ItemNo": "LCDINST",
						"ItemDescription": "LCD WALL MOUNT",
						"ItemDescription2": "LCD WALL MOUNT",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST",
						"ItemID": 26260
					}],
					availableInstallations: [{
						"Id": 26261,
						"ItemNo": "LCDINST1",
						"ItemDescription": "LCD SET INSTALLATION",
						"ItemDescription2": "LCD SET INSTALLATION",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST1",
						"ItemID": 26261
					}]
				});

				scope.removeInstallation({
					"Id": 26260,
					"ItemNo": "LCDINST",
					"ItemDescription": "LCD WALL MOUNT",
					"ItemDescription2": "LCD WALL MOUNT",
					"CostPrice": 0.0000,
					"UnitPriceHP": 0.0000,
					"UnitPriceCash": 0.0000,
					"TaxRate": 12.5,
					"IUPC": "LCDINST",
					"ItemID": 26260
				}, scope.cart.items[0]);

				expect(scope.cart.items[0].installations.length).toBe(0);
			});

			it('should remove the cost of the selected installation from the cart total', function () {
				createController();
				$httpBackend.flush();

				scope.cart.items.push({
					itemNumber: '245425',
					taxExclusivePrice: 591.33,
					quantity: 1,
					description: 'Item description',
					canAddInstallation: true,
					availableInstallations: [{
						"Id": 26260,
						"ItemNo": "LCDINST",
						"ItemDescription": "LCD WALL MOUNT",
						"ItemDescription2": "LCD WALL MOUNT",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 100.0000,
						"TaxAmount": 12.5,
						"TaxRate": 12.5,
						"IUPC": "LCDINST",
						"ItemID": 26260
					}, {
						"Id": 26261,
						"ItemNo": "LCDINST1",
						"ItemDescription": "LCD SET INSTALLATION",
						"ItemDescription2": "LCD SET INSTALLATION",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST1",
						"ItemID": 26261
					}]
				});

				scope.addInstallation({
					Id: 26260,
					ItemNo: "LCDINST",
					ItemDescription: "LCD WALL MOUNT",
					ItemDescription2: "LCD WALL MOUNT",
					CostPrice: 0.0000,
					UnitPriceHP: 0.0000,
					UnitPriceCash: 100.0000,
					TaxAmount: 12.5,
					TaxRate: 12.5,
					IUPC: "LCDINST",
					ItemID: 26260
				}, scope.cart.items[0]);

				scope.removeInstallation({
					Id: 26260,
					ItemNo: "LCDINST",
					ItemDescription: "LCD WALL MOUNT",
					ItemDescription2: "LCD WALL MOUNT",
					CostPrice: 0.0000,
					UnitPriceHP: 0.0000,
					UnitPriceCash: 100.0000,
					TaxAmount: 12.5,
					TaxRate: 12.5,
					IUPC: "LCDINST",
					ItemID: 26260
				}, scope.cart.items[0]);

				expect(scope.cart.total).toBe(591.33);
			});

			it('should preserve one installation if the item quantity is two and one installation is removed', function () {
				createController();
				$httpBackend.flush();

				scope.cart.items.push({
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					quantity: 2,
					Description1: 'Item description 1',
					Description2: 'Item description 2',
					installations: [{
						"Id": 26260,
						"ItemNo": "LCDINST",
						"ItemDescription": "LCD WALL MOUNT",
						"ItemDescription2": "LCD WALL MOUNT",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST",
						"ItemID": 26260
					}, {
						"Id": 26260,
						"ItemNo": "LCDINST",
						"ItemDescription": "LCD WALL MOUNT",
						"ItemDescription2": "LCD WALL MOUNT",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST",
						"ItemID": 26260
					}],
					availableInstallations: [{
						"Id": 26261,
						"ItemNo": "LCDINST1",
						"ItemDescription": "LCD SET INSTALLATION",
						"ItemDescription2": "LCD SET INSTALLATION",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST1",
						"ItemID": 26261
					}]
				});

				scope.removeInstallation(0, scope.cart.items[0]);

				expect(scope.cart.items[0].installations.length).toBe(1);
			});

			it('should add the removed installation to the available installations if the item quantity is more than one', function () {
				createController();
				$httpBackend.flush();

				scope.cart.items.push({
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					quantity: 2,
					Description1: 'Item description 1',
					Description2: 'Item description 2',
					installations: [{
						"Id": 26260,
						"ItemNo": "LCDINST",
						"ItemDescription": "LCD WALL MOUNT",
						"ItemDescription2": "LCD WALL MOUNT",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST",
						"ItemID": 26260
					}, {
						"Id": 26260,
						"ItemNo": "LCDINST",
						"ItemDescription": "LCD WALL MOUNT",
						"ItemDescription2": "LCD WALL MOUNT",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST",
						"ItemID": 26260
					}],
					availableInstallations: [{
						"Id": 26261,
						"ItemNo": "LCDINST1",
						"ItemDescription": "LCD SET INSTALLATION",
						"ItemDescription2": "LCD SET INSTALLATION",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST1",
						"ItemID": 26261
					}]
				});

				scope.removeInstallation(0, scope.cart.items[0]);

				expect(scope.cart.items[0].availableInstallations.length).toBe(2);
				expect(scope.cart.items[0].availableInstallations[1].Id).toBe(26260);
			});

			it('should add installation to list of available installations if item quantity is increased', function () {
				createController();
				$httpBackend.flush();

				scope.cart.items.push({
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					quantity: 1,
					Description1: 'Item description 1',
					Description2: 'Item description 2',
					installations: [{
						"Id": 26260,
						"ItemNo": "LCDINST",
						"ItemDescription": "LCD WALL MOUNT",
						"ItemDescription2": "LCD WALL MOUNT",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST",
						"ItemID": 26260
					}],
					availableInstallations: [{
						"Id": 26261,
						"ItemNo": "LCDINST1",
						"ItemDescription": "LCD SET INSTALLATION",
						"ItemDescription2": "LCD SET INSTALLATION",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST1",
						"ItemID": 26261
					}]
				});

				scope.increaseQuantity(scope.cart.items[0]);

				expect(scope.cart.items[0].availableInstallations.length).toBe(2);
				expect(scope.cart.items[0].availableInstallations[1].Id).toBe(26260);
			});

			it('should remove installation from list of available installations if item quantity is decreased', function () {
				createController();
				$httpBackend.flush();

				scope.cart.items.push({
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					quantity: 2,
					Description1: 'Item description 1',
					Description2: 'Item description 2',
					installations: [{
						"Id": 26260,
						"ItemNo": "LCDINST",
						"ItemDescription": "LCD WALL MOUNT",
						"ItemDescription2": "LCD WALL MOUNT",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST",
						"ItemID": 26260
					}],
					availableInstallations: [{
						"Id": 26261,
						"ItemNo": "LCDINST1",
						"ItemDescription": "LCD SET INSTALLATION",
						"ItemDescription2": "LCD SET INSTALLATION",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST1",
						"ItemID": 26261
					}, {
						"Id": 26260,
						"ItemNo": "LCDINST",
						"ItemDescription": "LCD WALL MOUNT",
						"ItemDescription2": "LCD WALL MOUNT",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST",
						"ItemID": 26260
					}]
				});

				scope.decreaseQuantity(scope.cart.items[0]);

				expect(scope.cart.items[0].availableInstallations.length).toBe(1);
				expect(scope.cart.items[0].availableInstallations[0].Id).toBe(26261);
			});

			it('should not remove installation from list of available installations when quantity is decreased if quantity greater than added Installations', function () {
				createController();
				$httpBackend.flush();

				scope.cart.items.push({
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					quantity: 3,
					Description1: 'Item description 1',
					Description2: 'Item description 2',
					installations: [{
						"Id": 26260,
						"ItemNo": "LCDINST",
						"ItemDescription": "LCD WALL MOUNT",
						"ItemDescription2": "LCD WALL MOUNT",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST",
						"ItemID": 26260
					}],
					availableInstallations: [{
						"Id": 26261,
						"ItemNo": "LCDINST1",
						"ItemDescription": "LCD SET INSTALLATION",
						"ItemDescription2": "LCD SET INSTALLATION",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST1",
						"ItemID": 26261
					}, {
						"Id": 26260,
						"ItemNo": "LCDINST",
						"ItemDescription": "LCD WALL MOUNT",
						"ItemDescription2": "LCD WALL MOUNT",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST",
						"ItemID": 26260
					}]
				});

				scope.decreaseQuantity(scope.cart.items[0]);

				expect(scope.cart.items[0].availableInstallations.length).toBe(2);
				expect(scope.cart.items[0].availableInstallations[0].Id).toBe(26261);
				expect(scope.cart.items[0].availableInstallations[1].Id).toBe(26260);
			});

			it('should remove installation from list of installations if item quantity is decreased and all selected Installations are the same', function () {
				createController();
				$httpBackend.flush();

				scope.cart.items.push({
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					quantity: 2,
					Description1: 'Item description 1',
					Description2: 'Item description 2',
					installations: [{
						"Id": 26260,
						"ItemNo": "LCDINST",
						"ItemDescription": "LCD WALL MOUNT",
						"ItemDescription2": "LCD WALL MOUNT",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST",
						"ItemID": 26260
					}, {
						"Id": 26260,
						"ItemNo": "LCDINST",
						"ItemDescription": "LCD WALL MOUNT",
						"ItemDescription2": "LCD WALL MOUNT",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST",
						"ItemID": 26260
					}],
					availableInstallations: [{
						"Id": 26261,
						"ItemNo": "LCDINST1",
						"ItemDescription": "LCD SET INSTALLATION",
						"ItemDescription2": "LCD SET INSTALLATION",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST1",
						"ItemID": 26261
					}]
				});

				scope.decreaseQuantity(scope.cart.items[0]);

				expect(scope.cart.items[0].installations.length).toBe(1);
				expect(scope.cart.items[0].availableInstallations.length).toBe(1);
			});

			it('should not remove installation from list of installations if item quantity is decreased and selected installations are different', function () {
				createController();
				$httpBackend.flush();

				scope.cart.items.push({
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					quantity: 2,
					Description1: 'Item description 1',
					Description2: 'Item description 2',
					installations: [{
						"Id": 26260,
						"ItemNo": "LCDINST",
						"ItemDescription": "LCD WALL MOUNT",
						"ItemDescription2": "LCD WALL MOUNT",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST",
						"ItemID": 26260
					}, {
						"Id": 26261,
						"ItemNo": "LCDINST1",
						"ItemDescription": "LCD SET INSTALLATION",
						"ItemDescription2": "LCD SET INSTALLATION",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST1",
						"ItemID": 26261
					}],
					availableInstallations: []
				});

				scope.decreaseQuantity(scope.cart.items[0]);

				expect(scope.cart.items[0].installations.length).toBe(2);
				expect(scope.cart.items[0].availableInstallations.length).toBe(0);
			});

			it('should set flag to indicate when installations cannot be added', function () {
				createController();
				$httpBackend.flush();

				scope.cart.items.push({
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					quantity: 1,
					Description1: 'Item description 1',
					Description2: 'Item description 2',
					canAddInstallation: true,
					availableInstallations: [{
						"Id": 26260,
						"ItemNo": "LCDINST",
						"ItemDescription": "LCD WALL MOUNT",
						"ItemDescription2": "LCD WALL MOUNT",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST",
						"ItemID": 26260
					}, {
						"Id": 26261,
						"ItemNo": "LCDINST1",
						"ItemDescription": "LCD SET INSTALLATION",
						"ItemDescription2": "LCD SET INSTALLATION",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST1",
						"ItemID": 26261
					}]
				});

				scope.addInstallation({
					"Id": 26260,
					"ItemNo": "LCDINST",
					"ItemDescription": "LCD WALL MOUNT",
					"ItemDescription2": "LCD WALL MOUNT",
					"CostPrice": 0.0000,
					"UnitPriceHP": 0.0000,
					"UnitPriceCash": 0.0000,
					"TaxRate": 12.5,
					"IUPC": "LCDINST",
					"ItemID": 26260
				}, scope.cart.items[0]);
				
				expect(scope.cart.items[0].canAddInstallation).toBe(false);
			});

			it('should allow adding an installation when quantity is more than added installations', function () {
				createController();
				$httpBackend.flush();

				scope.cart.items.push({
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					quantity: 2,
					Description1: 'Item description 1',
					Description2: 'Item description 2',
					canAddInstallation: true,
					availableInstallations: [{
						"Id": 26260,
						"ItemNo": "LCDINST",
						"ItemDescription": "LCD WALL MOUNT",
						"ItemDescription2": "LCD WALL MOUNT",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST",
						"ItemID": 26260
					}, {
						"Id": 26261,
						"ItemNo": "LCDINST1",
						"ItemDescription": "LCD SET INSTALLATION",
						"ItemDescription2": "LCD SET INSTALLATION",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST1",
						"ItemID": 26261
					}]
				});

				scope.addInstallation({
					"Id": 26260,
					"ItemNo": "LCDINST",
					"ItemDescription": "LCD WALL MOUNT",
					"ItemDescription2": "LCD WALL MOUNT",
					"CostPrice": 0.0000,
					"UnitPriceHP": 0.0000,
					"UnitPriceCash": 0.0000,
					"TaxRate": 12.5,
					"IUPC": "LCDINST",
					"ItemID": 26260
				}, scope.cart.items[0]);
				
				expect(scope.cart.items[0].canAddInstallation).toBe(true);
			});

			it('should not allow adding installations when quantity is decreased', function () {
				createController();
				$httpBackend.flush();

				scope.cart.items.push({
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					quantity: 2,
					Description1: 'Item description 1',
					Description2: 'Item description 2',
					installations: [{
						"Id": 26260,
						"ItemNo": "LCDINST",
						"ItemDescription": "LCD WALL MOUNT",
						"ItemDescription2": "LCD WALL MOUNT",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST",
						"ItemID": 26260
					}, {
						"Id": 26260,
						"ItemNo": "LCDINST",
						"ItemDescription": "LCD WALL MOUNT",
						"ItemDescription2": "LCD WALL MOUNT",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST",
						"ItemID": 26260
					}],
					availableInstallations: [{
						"Id": 26261,
						"ItemNo": "LCDINST1",
						"ItemDescription": "LCD SET INSTALLATION",
						"ItemDescription2": "LCD SET INSTALLATION",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST1",
						"ItemID": 26261
					}]
				});

				scope.decreaseQuantity(scope.cart.items[0]);

				expect(scope.cart.items[0].canAddInstallation).toBe(false);
			});

			it('should allow adding installations when quantity is increased', function () {
				createController();
				$httpBackend.flush();

				scope.cart.items.push({
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					quantity: 1,
					Description1: 'Item description 1',
					Description2: 'Item description 2',
					installations: [{
						"Id": 26260,
						"ItemNo": "LCDINST",
						"ItemDescription": "LCD WALL MOUNT",
						"ItemDescription2": "LCD WALL MOUNT",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST",
						"ItemID": 26260
					}],
					availableInstallations: [{
						"Id": 26261,
						"ItemNo": "LCDINST1",
						"ItemDescription": "LCD SET INSTALLATION",
						"ItemDescription2": "LCD SET INSTALLATION",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST1",
						"ItemID": 26261
					}]
				});

				scope.increaseQuantity(scope.cart.items[0]);

				expect(scope.cart.items[0].canAddInstallation).toBe(true);
			});

			it('should set a flag to indicate that an installation is being added', function () {
				createController();
				$httpBackend.flush();

				scope.cart.items.push({
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					quantity: 2,
					Description1: 'Item description 1',
					Description2: 'Item description 2',
					canAddInstallation: true,
					availableInstallations: [{
						"Id": 26260,
						"ItemNo": "LCDINST",
						"ItemDescription": "LCD WALL MOUNT",
						"ItemDescription2": "LCD WALL MOUNT",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST",
						"ItemID": 26260
					}, {
						"Id": 26261,
						"ItemNo": "LCDINST1",
						"ItemDescription": "LCD SET INSTALLATION",
						"ItemDescription2": "LCD SET INSTALLATION",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST1",
						"ItemID": 26261
					}]
				});

				scope.addInstallation({
					"Id": 26260,
					"ItemNo": "LCDINST",
					"ItemDescription": "LCD WALL MOUNT",
					"ItemDescription2": "LCD WALL MOUNT",
					"CostPrice": 0.0000,
					"UnitPriceHP": 0.0000,
					"UnitPriceCash": 0.0000,
					"TaxRate": 12.5,
					"IUPC": "LCDINST",
					"ItemID": 26260
				}, scope.cart.items[0]);
				
				expect(scope.cart.installationBeingPurchased).toBe(true);
			});

			it('should clear the flag for installation being purchased when all installations are removed', function () {
				createController();
				$httpBackend.flush();

				scope.cart.items.push({
					ItemNoWarrantyLink: '245425',
					CashPrice: 591.33,
					quantity: 2,
					Description1: 'Item description 1',
					Description2: 'Item description 2',
					canAddInstallation: true,
					availableInstallations: [{
						"Id": 26260,
						"ItemNo": "LCDINST",
						"ItemDescription": "LCD WALL MOUNT",
						"ItemDescription2": "LCD WALL MOUNT",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST",
						"ItemID": 26260
					}, {
						"Id": 26261,
						"ItemNo": "LCDINST1",
						"ItemDescription": "LCD SET INSTALLATION",
						"ItemDescription2": "LCD SET INSTALLATION",
						"CostPrice": 0.0000,
						"UnitPriceHP": 0.0000,
						"UnitPriceCash": 0.0000,
						"TaxRate": 12.5,
						"IUPC": "LCDINST1",
						"ItemID": 26261
					}]
				});

				scope.addInstallation({
					"Id": 26260,
					"ItemNo": "LCDINST",
					"ItemDescription": "LCD WALL MOUNT",
					"ItemDescription2": "LCD WALL MOUNT",
					"CostPrice": 0.0000,
					"UnitPriceHP": 0.0000,
					"UnitPriceCash": 0.0000,
					"TaxRate": 12.5,
					"IUPC": "LCDINST",
					"ItemID": 26260
				}, scope.cart.items[0]);

				scope.addInstallation({
					"Id": 26260,
					"ItemNo": "LCDINST",
					"ItemDescription": "LCD WALL MOUNT",
					"ItemDescription2": "LCD WALL MOUNT",
					"CostPrice": 0.0000,
					"UnitPriceHP": 0.0000,
					"UnitPriceCash": 0.0000,
					"TaxRate": 12.5,
					"IUPC": "LCDINST",
					"ItemID": 26260
				}, scope.cart.items[0]);

				scope.removeInstallation(0, scope.cart.items[0]);
				expect(scope.cart.installationBeingPurchased).toBe(true);

				scope.removeInstallation(0, scope.cart.items[0]);
				
				expect(scope.cart.installationBeingPurchased).toBe(false);
			});


			afterEach(function () {
				$httpBackend.verifyNoOutstandingExpectation();
				$httpBackend.verifyNoOutstandingRequest();
			});
		});
	});
});