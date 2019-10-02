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


		describe('SalesController:: Customer ::', function () {
			var scope, createController, $httpBackend;

			beforeEach(inject(function (_$httpBackend_, $rootScope, $controller) {
				$httpBackend = _$httpBackend_;

				$httpBackend.expectPOST('/Config/DecisionTable/Load/').respond('{}');

				scope = $rootScope.$new();
				createController = function () {
					return $controller('SalesController', {
						$scope: scope
					});
				};
			}));

			it('should not require customer details by default', function () {
				createController();
				$httpBackend.flush();
				var required = scope.isCustomerDataRequired();

				expect(required).toBe(false);
			});

			it('should require customer details when warranty is being purchased', function () {
				createController();
				$httpBackend.flush();
				scope.cart.warrantyBeingPurchased = true;

				var required = scope.isCustomerDataRequired();

				expect(required).toBe(true);
			});

			it('should require customer details when an installation is being purchased', function () {
				createController();
				$httpBackend.flush();
				scope.cart.installationBeingPurchased = true;

				var required = scope.isCustomerDataRequired();

				expect(required).toBe(true);
			});

			it('should require customer details when an item is being returned/exchanged', function () {
				createController();
				$httpBackend.flush();
				scope.cart.itemBeingReturned = true;

				var required = scope.isCustomerDataRequired();

				expect(required).toBe(true);
			});

			it('should not flag customer details as missing when no warranty being purchased', function () {
				createController();
				$httpBackend.flush();
				scope.cart.warrantyBeingPurchased = false;

				var missing = scope.isCustomerDataMissing();

				expect(missing).toBe(false);
			});

			it('should require customer details when warranty is being purchased', function () {
				createController();
				$httpBackend.flush();
				scope.cart.warrantyBeingPurchased = true;

				var missing = scope.isCustomerDataMissing();

				expect(missing).toBe(true);
			});

			it('should require customer title', function () {
				createController();
				$httpBackend.flush();
				scope.cart.warrantyBeingPurchased = true;

				scope.cart.customer.CustomerFirstName = 'Ziggy';
				scope.cart.customer.CustomerLastName = 'Stardust';
				scope.cart.customer.CustomerAddressLine1 = 'Red dust lane';
				scope.cart.customer.CustomerTownOrCity = 'Mars';
				scope.cart.customer.CustomerPostcode = '656536';

				var missing = scope.isCustomerDataMissing();

				expect(missing).toBe(true);
			});

			it('should require customer first name', function () {
				createController();
				$httpBackend.flush();
				scope.cart.warrantyBeingPurchased = true;

				scope.cart.customer.CustomerTitle = 'Mr';
				scope.cart.customer.CustomerLastName = 'Stardust';
				scope.cart.customer.CustomerAddressLine1 = 'Red dust lane';
				scope.cart.customer.CustomerTownOrCity = 'Mars';
				scope.cart.customer.CustomerPostcode = '656536';

				var missing = scope.isCustomerDataMissing();

				expect(missing).toBe(true);
			});

			it('should require customer last name', function () {
				createController();
				$httpBackend.flush();
				scope.cart.warrantyBeingPurchased = true;

				scope.cart.customer.CustomerTitle = 'Mr';
				scope.cart.customer.CustomerFirstName = 'Ziggy';
				scope.cart.customer.CustomerAddressLine1 = 'Red dust lane';
				scope.cart.customer.CustomerTownOrCity = 'Mars';
				scope.cart.customer.CustomerPostcode = '656536';

				var missing = scope.isCustomerDataMissing();

				expect(missing).toBe(true);
			});

			it('should require customer address line 1', function () {
				createController();
				$httpBackend.flush();
				scope.cart.warrantyBeingPurchased = true;

				scope.cart.customer.CustomerTitle = 'Mr';
				scope.cart.customer.CustomerFirstName = 'Ziggy';
				scope.cart.customer.CustomerLastName = 'Stardust';
				scope.cart.customer.CustomerTownOrCity = 'Mars';
				scope.cart.customer.CustomerPostcode = '656536';

				var missing = scope.isCustomerDataMissing();

				expect(missing).toBe(true);
			});

			it('should require customer town/city', function () {
				createController();
				$httpBackend.flush();
				scope.cart.warrantyBeingPurchased = true;

				scope.cart.customer.CustomerTitle = 'Mr';
				scope.cart.customer.CustomerFirstName = 'Ziggy';
				scope.cart.customer.CustomerLastName = 'Stardust';
				scope.cart.customer.CustomerAddressLine1 = 'Red dust lane';
				scope.cart.customer.CustomerPostcode = '656536';

				var missing = scope.isCustomerDataMissing();

				expect(missing).toBe(true);
			});

			it('should require customer postcode', function () {
				createController();
				$httpBackend.flush();
				scope.cart.warrantyBeingPurchased = true;

				scope.cart.customer.CustomerTitle = 'Mr';
				scope.cart.customer.CustomerFirstName = 'Ziggy';
				scope.cart.customer.CustomerLastName = 'Stardust';
				scope.cart.customer.CustomerAddressLine1 = 'Red dust lane';
				scope.cart.customer.CustomerTownOrCity = 'Mars';

				var missing = scope.isCustomerDataMissing();

				expect(missing).toBe(true);
			});

			it('should check that all required customer data has been entered', function () {
				createController();
				$httpBackend.flush();
				scope.cart.warrantyBeingPurchased = true;

				scope.cart.customer.CustomerTitle = 'Mr';
				scope.cart.customer.CustomerFirstName = 'Ziggy';
				scope.cart.customer.CustomerLastName = 'Stardust';
				scope.cart.customer.CustomerAddressLine1 = 'Red dust lane';
				scope.cart.customer.CustomerTownOrCity = 'Mars';
				scope.cart.customer.CustomerPostcode = '656536';

				var missing = scope.isCustomerDataMissing();

				expect(missing).toBe(false);
			});

			afterEach(function () {
				$httpBackend.verifyNoOutstandingExpectation();
				$httpBackend.verifyNoOutstandingRequest();
			});
		});
	});
});