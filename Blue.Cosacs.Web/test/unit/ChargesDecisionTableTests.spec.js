/*global define, module, inject, describe, beforeEach, afterEach, it, iit, expect, spyOn, console */
define(['underscore', 'jquery', 'angular', 'angular.mock', 'angularShared/app', 'json.loader', 'moment',
        'DecisionTableUtils', 'jasmine-expect', 'Config/decisionTable'],
    function (_, $, ng, ngMock, app, jsonLoader, moment, DTUtils) {
        'use strict';

        var masterData_settings = {
            "TaxType": "E",
            "TaxRate": 12.5,
            "BerMarkup": 10,
            "ServiceItemPartsOther": "7L0002",
            "ServiceItemPartsCourts": "7SPA01"
        };
        var masterData_settings_inclusive = {
            "TaxType": "I",
            "TaxRate": 12.5,
            "BerMarkup": 10,
            "ServiceItemPartsOther": "7L0002",
            "ServiceItemPartsCourts": "7SPA01"
        };
        var masterData_serviceSuppliers = {
            "ADMIRAL": "ADMIRAL",
            "BLACK AND DECKER": "BLACK AND DECKER",
            "BROTHER": "BROTHER",
            "CASIO": "CASIO",
            "COMPAQ": "COMPAQ",
            "ELECTROLUX/FRIGIDARE": "ELECTROLUX/FRIGIDARE",
            "HP": "HP",
            "LG PANAMA": "LG PANAMA",
            "MABE GE": "MABE GE",
            "MAYTAG": "MAYTAG",
            "Other": "Other",
            "PANASONIC": "PANASONIC",
            "Phillips": "Phillips",
            "PHLLIPS": "PHLLIPS",
            "PRECISION": "PRECISION",
            "SAMSUNG": "SAMSUNG",
            "SHARP": "SHARP",
            "SONY": "SONY",
            "TOSHIBA": "TOSHIBA",
            "WHIRLPOOL": "WHIRLPOOL"
        };
        var masterData_supplierCostMatrix_A = [
            {
                "product": "Domestic Stoves",
                "month": "1 - 12",
                "year": 1,
                "partType": "Parts",
                "partPcent": 10,
                "partVal": 0,
                "labourPcent": 15,
                "labourVal": 0,
                "additionalPcent": 20,
                "additionalVal": 0,
                "$$hashKey": "054"
            },
            {
                "product": "Domestic Stoves",
                "month": "13 - 24",
                "year": 2,
                "partType": "Parts",
                "partPcent": 20,
                "partVal": 0,
                "labourPcent": 25,
                "labourVal": 0,
                "additionalPcent": 30,
                "additionalVal": 0,
                "$$hashKey": "056"
            },
            {
                "product": "Domestic Stoves",
                "month": "25 - 36",
                "year": 3,
                "partType": "Parts",
                "partPcent": 30,
                "partVal": 0,
                "labourPcent": 35,
                "labourVal": 0,
                "additionalPcent": 40,
                "additionalVal": 0,
                "$$hashKey": "058"
            }
        ];
        var masterData_supplierCostMatrix_B =[
            {
                "product": "Domestic Stoves",
                "month": "1 - 12",
                "year": 1,
                "partType": "Parts",
                "partPcent": 0,
                "partVal": 26.7,
                "labourPcent": 0,
                "labourVal": 40.05,
                "additionalPcent": 0,
                "additionalVal": 53.4,
                "$$hashKey": "054"
            },
            {
                "product": "Domestic Stoves",
                "month": "13 - 24",
                "year": 2,
                "partType": "Parts",
                "partPcent": 0,
                "partVal": 53.4,
                "labourPcent": 0,
                "labourVal": 66.75,
                "additionalPcent": 0,
                "additionalVal": 80.1,
                "$$hashKey": "056"
            },
            {
                "product": "Domestic Stoves",
                "month": "25 - 36",
                "year": 3,
                "partType": "Parts",
                "partPcent": 0,
                "partVal": 80.1,
                "labourPcent": 0,
                "labourVal": 93.45,
                "additionalPcent": 0,
                "additionalVal": 106.8,
                "$$hashKey": "058"
            }
        ];
        var masterData_partsCostMatrix_Adm1 = [
            {
                "Level_1": null,
                "Level_2": null,
                "Level_3": null,
                "Level_4": null,
                "Level_5": null,
                "Level_6": null,
                "Level_7": null,
                "Level_8": null,
                "Level_9": null,
                "Level_10": null,
                "Supplier": "ADMIRAL",
                "RepairType": "Major",
                "ItemList": null,
                "ChargeInternal": 80,
                "ChargeFirstYearWarranty": 60,
                "ChargeExtendedWarranty": 40,
                "ChargeCustomer": 90,
                "Id": 1,
                "IsGroupFilter": true,
                "Label": "Adm1"
            }
        ];
        var masterData_partsCostMatrix_Sony = [
            {
                "Level_1": "PCE",
                "Level_2": null,
                "Level_3": null,
                "Level_4": null,
                "Level_5": null,
                "Level_6": null,
                "Level_7": null,
                "Level_8": null,
                "Level_9": null,
                "Level_10": null,
                "Supplier": "SONY",
                "RepairType": "Major",
                "ItemList": null,
                "ChargeInternal": 80,
                "ChargeFirstYearWarranty": 60,
                "ChargeExtendedWarranty": 40,
                "ChargeCustomer": 90,
                "Id": 3,
                "IsGroupFilter": true,
                "Label": "Sony"
            }
        ];
        var masterData_labourCostMatrix_AdmiralObj = {
            "Level_1": null,
                "Level_2": null,
                "Level_3": null,
                "Level_4": null,
                "Level_5": null,
                "Level_6": null,
                "Level_7": null,
                "Level_8": null,
                "Level_9": null,
                "Level_10": null,
                "Supplier": "ADMIRAL",
                "RepairType": "Major",
                "ItemList": null,
                "ChargeInternalTech": 75,
                "ChargeContractedTech": 65,
                "ChargeEWClaim": 40,
                "ChargeCustomer": 95,
                "Id": 1,
                "IsGroupFilter": true,
                "Label": "labour1"
        };
        var masterData_labourCostMatrix_SonyObj = {
            "Level_1": null,
            "Level_2": null,
            "Level_3": null,
            "Level_4": null,
            "Level_5": null,
            "Level_6": null,
            "Level_7": null,
            "Level_8": null,
            "Level_9": null,
            "Level_10": null,
            "Supplier": "SONY",
            "RepairType": "Major",
            "ItemList": null,
            "ChargeInternalTech": 75,
            "ChargeContractedTech": 65,
            "ChargeEWClaim": 40,
            "ChargeCustomer": 95,
            "Id": 2,
            "IsGroupFilter": true,
            "Label": "labour2"
        };

        describe('Decision tables - Charge test scenarios', function () {
            var http, httpBackend, rootScope, scope, controller;

            beforeEach(function () {
                inject(function (_$rootScope_, _$controller_, _$httpBackend_, _$http_) {
                    http = _$http_;
                    httpBackend = _$httpBackend_;
                    rootScope = _$rootScope_;
//
//                    scope = jsonLoader.serviceRequestScope;
//                    scope.MasterData = jsonLoader.serviceRequestMasterData;

                    controller = _$controller_;
                });
            });

            describe('(SI) Service Request Internal', function () {
                it('Scenario 1 ---> Manufacturer Warranty, Primary Charge to Supplier, Internal Technician', function () {
                    var mock = {
                        "serviceRequest": {
                            "WarrantyLength": 36,
                            "WarrantyContractNo": "12203783",
                            "Type": "SI",
                            "ResolutionTransportCost": 100,
                            "ResolutionPrimaryCharge": "Supplier",
                            "ResolutionLabourCost": 0,
                            "ResolutionAdditionalCost": 50,
                            "RepairType": "Major",
                            "ReplacementIssued": null,
                            "Parts": [
                                {
                                    "number": "711035",
                                    "type": "Parts",
                                    "quantity": 1,
                                    "price": 34.75,
                                    "CostPrice": 34.75,
                                    "description": "DISPOSABLE OMNI FILTER",
                                    "stockbranch": "780",
                                    "Source": "Internal",
                                    "stockbranchname": "780 COURTS (BELIZE CITY)",
                                    "$$hashKey": "052",
                                    "CashPrice": 34.75
                                }
                            ],
                            "NoCostMatrixData": false,
                            "ManufacturerWarrantyLength": 12,
                            "ManufacturerWarrantyContractNo": "12203783M",
                            "HistoryCharges": [],
                            "DepositRequired": 0,
                            "DepositFromMatrix": 0,
                            "DepositAuthorised": false,
                            "AllocationTechnicianIsInternal": true,
                            "Charges": [],
                            "CreatedOn": moment("2014-10-06T09:24:00.000Z"),
                            "ItemDeliveredOn": moment("2014-02-03T00:00:00.000Z"),
                            "ItemNumber": "105806",
                            "Manufacturer": "ADMIRAL",
                            "PaymentBalance": null,
                            "ProductLevel_1": "PCE",
                            "ProductLevel_2": "1",
                            "ProductLevel_3": "10 ",
                            "ResolutionDelivererToCharge": "",
                            "ResolutionSupplierToCharge": "ADMIRAL",
                            "StockItem": {
                                "CostPrice": 389.48
                            }
                        },
                        "MasterData": {
                            "SupplierCostMatrix": masterData_supplierCostMatrix_A,
                            "ServiceSuppliers": masterData_serviceSuppliers,
                            "Settings": masterData_settings,
                            "PartsCostMatrix": masterData_partsCostMatrix_Adm1,
                            "LabourCostMatrix": [
                                masterData_labourCostMatrix_AdmiralObj
                            ]
                        }
                    };

                    var beforeEvaluate = DTUtils.getClonedMockObj(mock);

                    jsonLoader.srChargeDt.evaluate(mock);

                    expect(beforeEvaluate).not.toEqual(mock);

                    // Check Parts Price
                    var p1 = DTUtils.getAllPartsPrice(mock.serviceRequest.Parts);
                    expect(p1).not.toBeWithinRange(0, 34);
                    expect(p1).toBeWithinRange(34.749, 34.760);
                    expect(p1).not.toBeWithinRange(35, 1000000);

                    // Check 60% Markup -> from 34.75 to 55.6
                    var c1 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs');
                    expect(c1).not.toBeWithinRange(0, 55);
                    expect(c1).toBeWithinRange(55.599, 55.600);
                    expect(c1).not.toBeWithinRange(56, 1000000);

                    // Check Supplier Coverage
                    var c2 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'Supplier');
                    expect(c2).not.toBeWithinRange(0, 5);
                    expect(c2).toBeWithinRange(5.559, 5.560);
                    expect(c2).not.toBeWithinRange(6, 1000000);

                    // Check Labour Cost
                    expect(mock.serviceRequest.ResolutionLabourCost).toBeWithinRange(75, 75);
                    expect(mock.serviceRequest.DepositFromMatrix).toBeWithinRange(75, 75);

                    // Is Internal Technician
                    expect(mock.serviceRequest.AllocationTechnicianIsInternal).toBeTrue();

                    // Labour + Additional(Supplier Covers)
                    var c3 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional', 'Supplier');
                    expect(c3).not.toBeWithinRange(0, 41);
                    expect(c3).toBeWithinRange(41.249, 41.250);
                    expect(c3).not.toBeWithinRange(42, 1000000);
                });

                it('Scenario 2 ---> Manufacturer Warranty, Primary Charge to Supplier, External Technician', function () {

                    var mock = {
                        "serviceRequest": {
                            "WarrantyLength": 24,
                            "WarrantyContractNo": "12403744",
                            "Type": "SI",
                            "ResolutionTransportCost": 100,
                            "ResolutionPrimaryCharge": "Supplier",
                            "ResolutionLabourCost": 0,
                            "ResolutionAdditionalCost": 50,
                            "RepairType": "Major",
                            "ReplacementIssued": null,
                            "Parts": [
                                {
                                    "number": "712603",
                                    "type": "Parts",
                                    "quantity": 1,
                                    "price": 21.42,
                                    "CostPrice": 21.42,
                                    "description": "LG CABINET ASSY",
                                    "stockbranch": "780",
                                    "Source": "Internal",
                                    "stockbranchname": "780 COURTS (BELIZE CITY)",
                                    "$$hashKey": "04F",
                                    "CashPrice": 21.42
                                }
                            ],
                            "NoCostMatrixData": false,
                            "ManufacturerWarrantyLength": 12,
                            "ManufacturerWarrantyContractNo": "12403744M",
                            "HistoryCharges": [
                                {
                                    "CustomerId": null,
                                    "Label": null,
                                    "ChargeType": "Supplier",
                                    "ItemNo": null,
                                    "Account": "ADMIRAL",
                                    "Cost": 0,
                                    "Value": 11.1,
                                    "Tax": 0,
                                    "RequestId": 98750,
                                    "IsExternal": false
                                },
                                {
                                    "CustomerId": null,
                                    "Label": null,
                                    "ChargeType": "Supplier",
                                    "ItemNo": null,
                                    "Account": "ADMIRAL",
                                    "Cost": 0,
                                    "Value": 55.05,
                                    "Tax": 0,
                                    "RequestId": 98750,
                                    "IsExternal": false
                                },
                                {
                                    "CustomerId": null,
                                    "Label": null,
                                    "ChargeType": "FYW",
                                    "ItemNo": null,
                                    "Account": "FYW",
                                    "Cost": 0,
                                    "Value": 0,
                                    "Tax": 0,
                                    "RequestId": 98750,
                                    "IsExternal": false
                                },
                                {
                                    "CustomerId": null,
                                    "Label": null,
                                    "ChargeType": "FYW",
                                    "ItemNo": null,
                                    "Account": "FYW",
                                    "Cost": 0,
                                    "Value": 24.95,
                                    "Tax": 0,
                                    "RequestId": 98750,
                                    "IsExternal": false
                                }
                            ],
                            "DepositRequired": 0,
                            "DepositFromMatrix": 0,
                            "DepositAuthorised": false,
                            "AllocationTechnicianIsInternal": false,
                            "Charges": [],
                            "CreatedOn": moment("2014-10-14T09:57:00.000Z"),
                            "ItemDeliveredOn": moment("2014-02-26T00:00:00.000Z"),
                            "ItemNumber": "322191",
                            "Manufacturer": "ADMIRAL",
                            "PaymentBalance": null,
                            "ProductLevel_1": "PCE",
                            "ProductLevel_2": "3",
                            "ProductLevel_3": "322",
                            "ResolutionDelivererToCharge": "",
                            "ResolutionSupplierToCharge": "ADMIRAL",
                            "StockItem": {
                                "CostPrice": 478.87
                            }
                        },
                        "MasterData": {
                            "SupplierCostMatrix": masterData_supplierCostMatrix_A,
                            "ServiceSuppliers": masterData_serviceSuppliers,
                            "Settings": masterData_settings,
                            "PartsCostMatrix": masterData_partsCostMatrix_Adm1,
                            "LabourCostMatrix": [
                                masterData_labourCostMatrix_AdmiralObj,
                                masterData_labourCostMatrix_SonyObj
                            ]
                        },
                        "isItemBer": false
                    };

                    var beforeEvaluate = DTUtils.getClonedMockObj(mock);

                    jsonLoader.srChargeDt.evaluate(mock);

                    expect(beforeEvaluate).not.toEqual(mock);

                    // Check Parts Price - expected - 21.42
                    var p1 = DTUtils.getAllPartsPrice(mock.serviceRequest.Parts);
                    expect(p1).not.toBeWithinRange(0, 21.41);
                    expect(p1).toBeWithinRange(21.42, 21.42);
                    expect(p1).not.toBeWithinRange(21.43, 1000000);

                    // Check 60% Markup -> from 21.42 to 34.27
                    var c1 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs');
                    expect(c1).not.toBeWithinRange(0, 34.26);
                    expect(c1).toBeWithinRange(34.272, 34.273);
                    expect(c1).not.toBeWithinRange(34.28, 1000000);

                    // Check Supplier Coverage - expected: 3.43
                    var c2 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'Supplier');
                    expect(c2).not.toBeWithinRange(0, 3.42);
                    expect(c2).toBeWithinRange(3.427, 3.428);
                    expect(c2).not.toBeWithinRange(3.44, 1000000);

                    // Check FYW Coverage - expected: 30.84
                    var c3 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'FYW');
                    expect(c3).not.toBeWithinRange(0, 30.83);
                    expect(c3).toBeWithinRange(30.844, 30.845);
                    expect(c3).not.toBeWithinRange(30.85, 1000000);

                    // Check Labour Cost
                    expect(mock.serviceRequest.ResolutionLabourCost).toBeWithinRange(65, 65);
                    expect(mock.serviceRequest.DepositFromMatrix).toBeWithinRange(65, 65);

                    // Is External Technician
                    expect(mock.serviceRequest.AllocationTechnicianIsInternal).toBeFalse();

                    // Labour + Additional(Supplier Covers) - expected: 39.75
                    var c4 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional', 'Supplier');
                    expect(c4).not.toBeWithinRange(0, 39.74);
                    expect(c4).toBeWithinRange(39.75, 39.75);
                    expect(c4).not.toBeWithinRange(39.76, 1000000);

                    // Labour + Additional(FYW Covers) - expected: 175.25
                    var c5 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional', 'FYW');
                    expect(c5).not.toBeWithinRange(0, 175.24);
                    expect(c5).toBeWithinRange(175.25, 175.25);
                    expect(c5).not.toBeWithinRange(175.26, 1000000);

                    // Check total Labour + Additional - expected: 215
                    var c6 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional');
                    expect(c6).not.toBeWithinRange(0, 214);
                    expect(c6).toBeWithinRange(215, 215);
                    expect(c6).not.toBeWithinRange(216, 1000000);

                });

                it('Scenario 3 ---> Extended Warranty, Primary charge to is Supplier, Internal Technician, Calculating (13-24) Months', function () {          //'Scenario 3 start

                    var mock = {
                        "serviceRequest": {
                            "WarrantyLength": 24,
                            "WarrantyContractNo": "12107062",
                            "Type": "SI",
                            "ResolutionTransportCost": 50,
                            "ResolutionPrimaryCharge": "Supplier",
                            "ResolutionLabourCost": 0,
                            "ResolutionAdditionalCost": 35,
                            "RepairType": "Major",
                            "ReplacementIssued": null,
                            "Parts": [
                                {
                                    "number": "713308",
                                    "type": "Parts",
                                    "quantity": 1,
                                    "price": 24.19,
                                    "CostPrice": 24.19,
                                    "description": "MABE THERMO DISC FOR FRIDGE-238C1015P002",
                                    "stockbranch": "780",
                                    "Source": "Internal",
                                    "stockbranchname": "780 COURTS (BELIZE CITY)",
                                    "$$hashKey": "04F",
                                    "CashPrice": 24.19
                                }
                            ],
                            "NoCostMatrixData": false,
                            "ManufacturerWarrantyLength": 12,
                            "ManufacturerWarrantyContractNo": "12107062M",
                            "HistoryCharges": [
                                {
                                    "CustomerId": null,
                                    "Label": null,
                                    "ChargeType": "Internal",
                                    "ItemNo": null,
                                    "Account": "779500001810",
                                    "Cost": 0,
                                    "Value": 0,
                                    "Tax": 0,
                                    "RequestId": 85251,
                                    "IsExternal": false
                                },
                                {
                                    "CustomerId": null,
                                    "Label": null,
                                    "ChargeType": "Internal",
                                    "ItemNo": null,
                                    "Account": "779500001810",
                                    "Cost": 0,
                                    "Value": 26.67,
                                    "Tax": 3.33,
                                    "RequestId": 85251,
                                    "IsExternal": false
                                }
                            ],
                            "DepositRequired": 0,
                            "DepositFromMatrix": 0,
                            "DepositAuthorised": false,
                            "AllocationTechnicianIsInternal": true,
                            "Charges": [],
                            "CreatedOn": moment("2014-10-07T07:30:00.000Z"),
                            "ItemDeliveredOn": moment("2012-10-15T23:00:00.000Z"),
                            "ItemNumber": "302165",
                            "Manufacturer": "ADMIRAL",
                            "PaymentBalance": null,
                            "ProductLevel_1": "PCE",
                            "ProductLevel_2": 3,
                            "ProductLevel_3": "30 ",
                            "ResolutionDelivererToCharge": "",
                            "ResolutionSupplierToCharge": "ADMIRAL",
                            "StockItem": {
                                "CostPrice": 307.82
                            }
                        },
                        "MasterData": {
                            "SupplierCostMatrix": masterData_supplierCostMatrix_A,
                            "ServiceSuppliers": masterData_serviceSuppliers,
                            "Settings": masterData_settings,
                            "PartsCostMatrix": masterData_partsCostMatrix_Adm1,
                            "LabourCostMatrix": [
                                masterData_labourCostMatrix_AdmiralObj
                            ]
                        }
                    };

                    var beforeEvaluate = DTUtils.getClonedMockObj(mock);

                    jsonLoader.srChargeDt.evaluate(mock);

                    expect(beforeEvaluate).not.toEqual(mock);

                    // Check Parts Price - expected: 24.19
                    var p1 = DTUtils.getAllPartsPrice(mock.serviceRequest.Parts);
                    expect(p1).not.toBeWithinRange(0, 24);
                    expect(p1).toBeWithinRange(24.189, 24.190);
                    expect(p1).not.toBeWithinRange(25, 1000000);

                    // Total Parts, Check 40% Markup -> from 24.19 to 33.87
                    var c1 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs');
                    expect(c1).not.toBeWithinRange(0, 24);
                    expect(c1).toBeWithinRange(33.865, 33.866);
                    expect(c1).not.toBeWithinRange(34, 1000000);

                    // Check Supplier covering 20% - expected: 6.77
                    var c2 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'Supplier');
                    expect(c2).not.toBeWithinRange(0, 6);
                    expect(c2).toBeWithinRange(6.7731, 6.7732);
                    expect(c2).not.toBeWithinRange(7, 1000000);

                    //Check EW coverage value for parts - expected: 27.09
                    var c3 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'EW');
                    expect(c3).not.toBeWithinRange(0, 27);
                    expect(c3).toBeWithinRange(27.092, 27.093);
                    expect(c3).not.toBeWithinRange(28, 1000000);

                    // Check Labour Cost - expected: 75
                    expect(mock.serviceRequest.ResolutionLabourCost).toBeWithinRange(75, 75);
                    expect(mock.serviceRequest.DepositFromMatrix).toBeWithinRange(75, 75);

                    // Is Internal Technician
                    expect(mock.serviceRequest.AllocationTechnicianIsInternal).toBeTrue();

                    // Labour, Supplier covers 20%
                    // Additional, Supplier covers 30%
                    // Expected: 44.25
                    var c3 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional', 'Supplier');
                    expect(c3).not.toBeWithinRange(0, 44);
                    expect(c3).toBeWithinRange(44.249, 44.250);
                    expect(c3).not.toBeWithinRange(45, 1000000);

                    //Labour & Additional, FYW coverage - expected: 75.75
                    var c4 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional', 'FYW');
                    expect(c4).not.toBeWithinRange(0, 75);
                    expect(c4).toBeWithinRange(75.749, 75.750);
                    expect(c4).not.toBeWithinRange(76, 1000000);

                    //Labour & Additional, EW coverage - expected: 40
                    var c5 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional', 'EW');
                    expect(c5).not.toBeWithinRange(0, 39);
                    expect(c5).toBeWithinRange(40, 40);
                    expect(c5).not.toBeWithinRange(41, 1000000);

                    //Total Labour & Additional - expected: 160
                    var c6 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional');
                    expect(c6).not.toBeWithinRange(0, 159);
                    expect(c6).toBeWithinRange(160, 160);
                    expect(c6).not.toBeWithinRange(161, 1000000);


                });

                it('Scenario 5 ---> Extended Warranty, Primary charge to is Supplier, Internal Technician, Calculating (25-36) Months', function () {

                    var mock = {
                        "serviceRequest": {
                            "WarrantyLength": 24,
                            "WarrantyContractNo": "12107029",
                            "Type": "SI",
                            "ResolutionTransportCost": 60,
                            "ResolutionPrimaryCharge": "Supplier",
                            "ResolutionLabourCost": 0,
                            "ResolutionAdditionalCost": 25,
                            "RepairType": "Major",
                            "ReplacementIssued": null,
                            "Parts": [
                                {
                                    "number": "712603",
                                    "type": "Parts",
                                    "quantity": 1,
                                    "price": 52.44,
                                    "CostPrice": 52.44,
                                    "description": "LG CABINET ASSY",
                                    "stockbranch": "780",
                                    "Source": "Internal",
                                    "stockbranchname": "780 COURTS (BELIZE CITY)",
                                    "$$hashKey": "044",
                                    "CashPrice": 52.44
                                }
                            ],
                            "NoCostMatrixData": false,
                            "ManufacturerWarrantyLength": 12,
                            "ManufacturerWarrantyContractNo": "12107029M",
                            "HistoryCharges": [
                                {
                                    "CustomerId": null,
                                    "Label": null,
                                    "ChargeType": "EW",
                                    "ItemNo": null,
                                    "Account": "779500002000",
                                    "Cost": 0,
                                    "Value": 69.33,
                                    "Tax": 8.67,
                                    "RequestId": 90643,
                                    "IsExternal": false
                                },
                                {
                                    "CustomerId": null,
                                    "Label": null,
                                    "ChargeType": "EW",
                                    "ItemNo": null,
                                    "Account": "779500002000",
                                    "Cost": 0,
                                    "Value": 62.22,
                                    "Tax": 7.78,
                                    "RequestId": 90643,
                                    "IsExternal": false
                                }
                            ],
                            "DepositRequired": 0,
                            "DepositFromMatrix": 0,
                            "DepositAuthorised": false,
                            "AllocationTechnicianIsInternal": true,
                            "Charges": [],
                            "CreatedOn": moment("2014-10-07T10:21:00.000Z"),
                            "ItemDeliveredOn": moment("2012-10-05T23:00:00.000Z"),
                            "ItemNumber": "311967",
                            "Manufacturer": "ADMIRAL",
                            "PaymentBalance": null,
                            "ProductLevel_1": "PCE",
                            "ProductLevel_2": 3,
                            "ProductLevel_3": "31 ",
                            "ResolutionDelivererToCharge": "",
                            "ResolutionSupplierToCharge": "ADMIRAL",
                            "StockItem": {
                                "CostPrice": 659.55
                            }
                        },
                        "MasterData": {
                            "SupplierCostMatrix": masterData_supplierCostMatrix_A,
                            "ServiceSuppliers": masterData_serviceSuppliers,
                            "Settings": masterData_settings,
                            "PartsCostMatrix": masterData_partsCostMatrix_Adm1,
                            "LabourCostMatrix": [
                                masterData_labourCostMatrix_AdmiralObj
                            ]
                        }
                    };

                    var beforeEvaluate = DTUtils.getClonedMockObj(mock);

                    jsonLoader.srChargeDt.evaluate(mock);

                    expect(beforeEvaluate).not.toEqual(mock);

                    // Check Parts Price - expected: 52.44
                    var p1 = DTUtils.getAllPartsPrice(mock.serviceRequest.Parts);
                    expect(p1).not.toBeWithinRange(0, 52);
                    expect(p1).toBeWithinRange(52.439, 52.440);
                    expect(p1).not.toBeWithinRange(53, 1000000);

                    // Total Parts, Check 40% Markup -> from 52.44 to 73.42
                    var c1 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs');
                    expect(c1).not.toBeWithinRange(0, 73);
                    expect(c1).toBeWithinRange(73.415, 73.416);
                    expect(c1).not.toBeWithinRange(74, 1000000);

                    // Check Supplier covering 20% - expected: 22.02
                    var c2 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'Supplier');
                    expect(c2).not.toBeWithinRange(0, 22);
                    expect(c2).toBeWithinRange(22.0247, 22.0248);
                    expect(c2).not.toBeWithinRange(23, 1000000);

                    //Check EW coverage value for parts - expected: 51.39
                    var c3 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'EW');
                    expect(c3).not.toBeWithinRange(0, 51);
                    expect(c3).toBeWithinRange(51.3911, 51.3912);
                    expect(c3).not.toBeWithinRange(52, 1000000);

                    // Check Labour Cost - expected: 75
                    expect(mock.serviceRequest.ResolutionLabourCost).toBeWithinRange(75, 75);
                    expect(mock.serviceRequest.DepositFromMatrix).toBeWithinRange(75, 75);

                    // Is Internal Technician
                    expect(mock.serviceRequest.AllocationTechnicianIsInternal).toBeTrue();

                    // Labour, Supplier covers 30%
                    // Additional, Supplier covers 40%
                    // Expected: 60.25
                    var c3 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional', 'Supplier');
                    expect(c3).not.toBeWithinRange(0, 60);
                    expect(c3).toBeWithinRange(60.249, 60.250);
                    expect(c3).not.toBeWithinRange(61, 1000000);

                    //Labour & Additional, FYW coverage - expected: 59.75
                    var c4 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional', 'FYW');
                    expect(c4).not.toBeWithinRange(0, 59);
                    expect(c4).toBeWithinRange(59.749, 59.750);
                    expect(c4).not.toBeWithinRange(60, 1000000);

                    //Labour & Additional, EW coverage - expected: 40
                    var c5 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional', 'EW');
                    expect(c5).not.toBeWithinRange(0, 39);
                    expect(c5).toBeWithinRange(40, 40);
                    expect(c5).not.toBeWithinRange(41, 1000000);

                    //Total Labour & Additional - expected: 160
                    var c6 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional');
                    expect(c6).not.toBeWithinRange(0, 159);
                    expect(c6).toBeWithinRange(160, 160);
                    expect(c6).not.toBeWithinRange(161, 1000000);
                });

                it('Scenario 7 ---> Extended Warranty, Primary Charge to Supplier, External Technician, Calculating (13 - 24) Months', function () {

                    var mock = {
                        "serviceRequest": {
                            "WarrantyLength": 24,
                            "WarrantyContractNo": "12107017",
                            "Type": "SI",
                            "ResolutionTransportCost": 100,
                            "ResolutionPrimaryCharge": "Supplier",
                            "ResolutionLabourCost": 0,
                            "ResolutionAdditionalCost": 50,
                            "RepairType": "Major",
                            "ReplacementIssued": null,
                            "Parts": [
                                {
                                    "number": "712603",
                                    "type": "Parts",
                                    "Source": "Internal",
                                    "quantity": 1,
                                    "CostPrice": 15.95,
                                    "CashPrice": 15.95,
                                    "price": 15.95,
                                    "description": "LG CABINET ASSY",
                                    "stockbranch": 780,
                                    "stockbranchname": "780 COURTS (BELIZE CITY)",
                                    "$$hashKey": "16A"
                                }
                            ],
                            "NoCostMatrixData": false,
                            "ManufacturerWarrantyLength": 12,
                            "ManufacturerWarrantyContractNo": "12107017M",
                            "HistoryCharges": [],
                            "DepositRequired": 0,
                            "DepositFromMatrix": 0,
                            "DepositAuthorised": false,
                            "AllocationTechnicianIsInternal": false,
                            "Charges": [],
                            "CreatedOn": moment("2014-10-07T12:33:12.142Z"),
                            "ItemDeliveredOn": moment("2012-10-07T23:00:00.000Z"),
                            "ItemNumber": "106817",
                            "Manufacturer": "ADMIRAL",
                            "PaymentBalance": null,
                            "ProductLevel_1": "PCE",
                            "ProductLevel_2": "1",
                            "ProductLevel_3": "10 ",
                            "ResolutionDelivererToCharge": "",
                            "ResolutionSupplierToCharge": "ADMIRAL",
                            "StockItem": {
                                "CostPrice": 498.46
                            }
                        },
                        "MasterData": {
                            "SupplierCostMatrix": masterData_supplierCostMatrix_A,
                            "ServiceSuppliers": masterData_serviceSuppliers,
                            "Settings": masterData_settings,
                            "PartsCostMatrix": masterData_partsCostMatrix_Adm1,
                            "LabourCostMatrix": [
                                masterData_labourCostMatrix_AdmiralObj
                            ]
                        }
                    };

                    var beforeEvaluate = DTUtils.getClonedMockObj(mock);

                    jsonLoader.srChargeDt.evaluate(mock);

                    expect(beforeEvaluate).not.toEqual(mock);

                    // Check Parts Price - expected: 15.95
                    var p1 = DTUtils.getAllPartsPrice(mock.serviceRequest.Parts);
                    expect(p1).not.toBeWithinRange(0, 15);
                    expect(p1).toBeWithinRange(15.94, 15.95);
                    expect(p1).not.toBeWithinRange(16, 1000000);

                    // Total Parts, Check 40% Markup -> from 15.95 to 22.33
                    var c1 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs');
                    expect(c1).not.toBeWithinRange(0, 22);
                    expect(c1).toBeWithinRange(22.320, 22.330);
                    expect(c1).not.toBeWithinRange(23, 1000000);

                    // Check Supplier covering 20% - expected: 4.47
                    var c2 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'Supplier');
                    expect(c2).not.toBeWithinRange(0, 4);
                    expect(c2).toBeWithinRange(4.465, 4.466);
                    expect(c2).not.toBeWithinRange(5, 1000000);

                    //Check EW coverage value for parts - expected: 17.86
                    var c3 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'EW');
                    expect(c3).not.toBeWithinRange(0, 17);
                    expect(c3).toBeWithinRange(17.8639, 17.8640);
                    expect(c3).not.toBeWithinRange(18, 1000000);

                    // Check Labour Cost - expected: 65
                    expect(mock.serviceRequest.ResolutionLabourCost).toBeWithinRange(65, 65);
                    expect(mock.serviceRequest.DepositFromMatrix).toBeWithinRange(65, 65);

                    // Is External Technician
                    expect(mock.serviceRequest.AllocationTechnicianIsInternal).toBeFalse();

                    // Labour, Supplier covers 20%
                    // Additional, Supplier covers 30%
                    // Expected: 61.25
                    var c3 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional', 'Supplier');
                    expect(c3).not.toBeWithinRange(0, 61);
                    expect(c3).toBeWithinRange(61.249, 61.250);
                    expect(c3).not.toBeWithinRange(62, 1000000);

                    //Labour & Additional, FYW coverage - expected: 113.75
                    var c4 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional', 'FYW');
                    expect(c4).not.toBeWithinRange(0, 59);
                    expect(c4).toBeWithinRange(113.749, 113.750);
                    expect(c4).not.toBeWithinRange(114, 1000000);

                    //Labour & Additional, EW coverage - expected: 40
                    var c5 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional', 'EW');
                    expect(c5).not.toBeWithinRange(0, 39);
                    expect(c5).toBeWithinRange(40, 40);
                    expect(c5).not.toBeWithinRange(41, 1000000);

                    //Total Labour & Additional - expected: 215
                    var c6 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional');
                    expect(c6).not.toBeWithinRange(0, 214);
                    expect(c6).toBeWithinRange(215, 215);
                    expect(c6).not.toBeWithinRange(216, 1000000);

                });

                it('Scenario 8 ---> Extended Warranty, Primary Charge to Supplier, External Technician, Calculating (25 - 36) Months', function () {

                    var mock = {
                        "serviceRequest": {
                            "WarrantyLength": 36,
                            "WarrantyContractNo": "12105127",
                            "Type": "SI",
                            "ResolutionTransportCost": 100,
                            "ResolutionPrimaryCharge": "Supplier",
                            "ResolutionLabourCost": 0,
                            "ResolutionAdditionalCost": 150,
                            "RepairType": "Major",
                            "ReplacementIssued": null,
                            "Parts": [
                                {
                                    "number": "712603",
                                    "type": "Parts",
                                    "Source": "Internal",
                                    "quantity": 1,
                                    "CostPrice": 25.22,
                                    "CashPrice": 25.22,
                                    "price": 25.22,
                                    "description": "LG CABINET ASSY",
                                    "stockbranch": 780,
                                    "stockbranchname": "780 COURTS (BELIZE CITY)",
                                    "$$hashKey": "0FG"
                                }
                            ],
                            "NoCostMatrixData": false,
                            "ManufacturerWarrantyLength": 12,
                            "ManufacturerWarrantyContractNo": "12105127M",
                            "HistoryCharges": [],
                            "DepositRequired": 0,
                            "DepositFromMatrix": 0,
                            "DepositAuthorised": false,
                            "AllocationTechnicianIsInternal": false,
                            "Charges": [],
                            "CreatedOn": moment("2014-10-07T13:51:00.000Z"),
                            "ItemDeliveredOn": moment("2011-10-13T23:00:00.000Z"),
                            "ItemNumber": "426087800003",
                            "Manufacturer": "ADMIRAL",
                            "PaymentBalance": null,
                            "ProductLevel_1": "",
                            "ProductLevel_2": "",
                            "ProductLevel_3": "",
                            "ResolutionDelivererToCharge": "",
                            "ResolutionSupplierToCharge": "ADMIRAL",
                            "StockItem": {
                                "CostPrice": 722.95
                            }
                        },
                        "MasterData": {
                            "SupplierCostMatrix": masterData_supplierCostMatrix_A,
                            "ServiceSuppliers": masterData_serviceSuppliers,
                            "Settings": masterData_settings,
                            "PartsCostMatrix": masterData_partsCostMatrix_Adm1,
                            "LabourCostMatrix": [
                                masterData_labourCostMatrix_AdmiralObj
                            ]
                        }
                    };

                    var beforeEvaluate = DTUtils.getClonedMockObj(mock);

                    jsonLoader.srChargeDt.evaluate(mock);

                    expect(beforeEvaluate).not.toEqual(mock);

                    // Check Parts Price - expected: 25.22
                    var p1 = DTUtils.getAllPartsPrice(mock.serviceRequest.Parts);
                    expect(p1).not.toBeWithinRange(0, 24);
                    expect(p1).toBeWithinRange(25.219, 25.220);
                    expect(p1).not.toBeWithinRange(26, 1000000);

                    // Total Parts, Check 40% Markup -> from 25.22 to 35.31
                    var c1 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs');
                    expect(c1).not.toBeWithinRange(0, 35);
                    expect(c1).toBeWithinRange(35.307, 35.308);
                    expect(c1).not.toBeWithinRange(36, 1000000);


                    // Check Supplier covering 30% - expected: 10.59
                    var c2 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'Supplier');
                    expect(c2).not.toBeWithinRange(0, 10);
                    expect(c2).toBeWithinRange(10.5923, 10.5924);
                    expect(c2).not.toBeWithinRange(11, 1000000);

                    // Check Labour Cost - expected: 65
                    expect(mock.serviceRequest.ResolutionLabourCost).toBeWithinRange(65, 65);
                    expect(mock.serviceRequest.DepositFromMatrix).toBeWithinRange(65, 65);

                    // Is External Technician
                    expect(mock.serviceRequest.AllocationTechnicianIsInternal).toBeFalse();

                    // Labour, Supplier covers 35%
                    // Additional, Supplier covers 40%
                    // Expected: 122.75
                    var c3 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional', 'Supplier');
                    expect(c3).not.toBeWithinRange(0, 122);
                    expect(c3).toBeWithinRange(122.749, 122.750);
                    expect(c3).not.toBeWithinRange(123, 1000000);

                    //Labour & Additional, FYW coverage - expected: 152.25
                    var c4 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional', 'FYW');
                    expect(c4).not.toBeWithinRange(0, 152);
                    expect(c4).toBeWithinRange(152.249, 152.250);
                    expect(c4).not.toBeWithinRange(153, 1000000);

                    //Labour & Additional, EW coverage - expected: 40
                    var c5 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional', 'EW');
                    expect(c5).not.toBeWithinRange(0, 39);
                    expect(c5).toBeWithinRange(40, 40);
                    expect(c5).not.toBeWithinRange(41, 1000000);

                    //Total Labour & Additional - expected: 315
                    var c6 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional');
                    expect(c6).not.toBeWithinRange(0, 314);
                    expect(c6).toBeWithinRange(315, 315);
                    expect(c6).not.toBeWithinRange(316, 1000000);

                });

                it('Scenario 9 ---> Manufacturer Warranty, Primary Charge to Supplier, External Technician, Calculating Values, Exchange rate should be considered', function () {

                    var mock = {
                        "serviceRequest": {
                            "WarrantyLength": 24,
                            "WarrantyContractNo": "12403743",
                            "Type": "SI",
                            "ResolutionTransportCost": 10,
                            "ResolutionPrimaryCharge": "Supplier",
                            "ResolutionLabourCost": 0,
                            "ResolutionAdditionalCost": 5,
                            "RepairType": "Major",
                            "ReplacementIssued": null,
                            "Parts": [
                                {
                                    "number": "712603",
                                    "type": "Parts",
                                    "quantity": 1,
                                    "price": 6.94,
                                    "CostPrice": 6.94,
                                    "description": "LG CABINET ASSY",
                                    "stockbranch": "780",
                                    "Source": "Internal",
                                    "stockbranchname": "780 COURTS (BELIZE CITY)",
                                    "$$hashKey": "052",
                                    "CashPrice": 6.94
                                }
                            ],
                            "NoCostMatrixData": false,
                            "ManufacturerWarrantyLength": 12,
                            "ManufacturerWarrantyContractNo": "12403743M",
                            "HistoryCharges": [],
                            "DepositRequired": 0,
                            "DepositFromMatrix": 0,
                            "DepositAuthorised": false,
                            "AllocationTechnicianIsInternal": false,
                            "Charges": [],
                            "CreatedOn": moment("2014-10-09T07:18:00.000Z"),
                            "ItemDeliveredOn": moment("2014-02-26T00:00:00.000Z"),
                            "ItemNumber": "322191",
                            "Manufacturer": "ADMIRAL",
                            "PaymentBalance": null,
                            "ProductLevel_1": "PCE",
                            "ProductLevel_2": "3",
                            "ProductLevel_3": "322",
                            "ResolutionDelivererToCharge": "",
                            "ResolutionSupplierToCharge": "ADMIRAL",
                            "StockItem": {
                                "CostPrice": 478.87
                            }
                        },
                        "MasterData": {
                            "SupplierCostMatrix": masterData_supplierCostMatrix_B,
                            "ServiceSuppliers": masterData_serviceSuppliers,
                            "Settings": masterData_settings,
                            "PartsCostMatrix": masterData_partsCostMatrix_Adm1,
                            "LabourCostMatrix": [
                                masterData_labourCostMatrix_AdmiralObj,
                                masterData_labourCostMatrix_SonyObj
                            ]
                        }
                    };


                    var beforeEvaluate = DTUtils.getClonedMockObj(mock);

                    jsonLoader.srChargeDt.evaluate(mock);

                    expect(beforeEvaluate).not.toEqual(mock);

                    // Check Parts Price - expected: 6.94
                    var p1 = DTUtils.getAllPartsPrice(mock.serviceRequest.Parts);
                    expect(p1).not.toBeWithinRange(0, 6.93);
                    expect(p1).toBeWithinRange(6.94, 6.94);
                    expect(p1).not.toBeWithinRange(6.95, 1000000);

                    // Total Parts, Check 60% Markup -> from 6.94 to 11.10
                    var c1 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs');
                    expect(c1).not.toBeWithinRange(0, 11.09);
                    expect(c1).toBeWithinRange(11.103, 11.104);
                    expect(c1).not.toBeWithinRange(11.11, 1000000);

                    // Check Supplier covers $10 * exchanre rate of : 2.67 = 26.70  - expected: 11.10
                    var c2 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'Supplier');
                    expect(c2).not.toBeWithinRange(0, 11.09);
                    expect(c2).toBeWithinRange(11.103, 11.104);
                    expect(c2).not.toBeWithinRange(11.11, 1000000);

                    // Check Labour Cost - expected: 65
                    expect(mock.serviceRequest.ResolutionLabourCost).toBeWithinRange(65, 65);
                    expect(mock.serviceRequest.DepositFromMatrix).toBeWithinRange(65, 65);

                    // Is External Technician
                    expect(mock.serviceRequest.AllocationTechnicianIsInternal).toBeFalse();

                    // Labour, Supplier covers $15 * exchange rate of: 2.67 = 40.05
                    // Additional, Supplier covers $20 * exchange rate of: 2.67 = 53.40
                    // Expected: 55.05
                    var c3 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional', 'Supplier');
                    expect(c3).not.toBeWithinRange(0, 55.04);
                    expect(c3).toBeWithinRange(55.05, 55.05);
                    expect(c3).not.toBeWithinRange(55.06, 1000000);

                    //Labour & Additional remainder to FYW - expected: 24.95
                    var c4 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional', 'FYW');
                    expect(c4).not.toBeWithinRange(0, 24.93);
                    expect(c4).toBeWithinRange(24.950, 24.951);
                    expect(c4).not.toBeWithinRange(24.96, 1000000);

                    //Total Labour & Additional - expected: 80
                    var c5 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional');
                    expect(c5).not.toBeWithinRange(0, 79);
                    expect(c5).toBeWithinRange(80, 80);
                    expect(c5).not.toBeWithinRange(81, 1000000);

                });

                it('Scenario 10 ---> Manufacturer Warranty, Primary Charge to Supplier, Internal Technician, Calculating Values, Exchange rate should be considered', function () {

                    var mock = {
                        "serviceRequest": {
                            "WarrantyLength": 24,
                            "WarrantyContractNo": "12203451",
                            "Type": "SI",
                            "ResolutionTransportCost": 55,
                            "ResolutionPrimaryCharge": "Supplier",
                            "ResolutionLabourCost": 0,
                            "ResolutionAdditionalCost": 60,
                            "RepairType": "Major",
                            "ReplacementIssued": null,
                            "Parts": [
                                {
                                    "number": "712603",
                                    "type": "Parts",
                                    "Source": "Internal",
                                    "quantity": 1,
                                    "CostPrice": 6.28,
                                    "CashPrice": 6.28,
                                    "price": 6.28,
                                    "description": "LG CABINET ASSY",
                                    "stockbranch": 780,
                                    "stockbranchname": "780 COURTS (BELIZE CITY)",
                                    "$$hashKey": "0QC"
                                }
                            ],
                            "NoCostMatrixData": false,
                            "ManufacturerWarrantyLength": 12,
                            "ManufacturerWarrantyContractNo": "12203451M",
                            "HistoryCharges": [],
                            "DepositRequired": 0,
                            "DepositFromMatrix": 0,
                            "DepositAuthorised": false,
                            "AllocationTechnicianIsInternal": true,
                            "Charges": [],
                            "CreatedOn": moment("2014-10-09T08:52:00.000Z"),
                            "ItemDeliveredOn": moment("2013-10-24T23:00:00.000Z"),
                            "ItemNumber": "322719",
                            "Manufacturer": "ADMIRAL",
                            "PaymentBalance": null,
                            "ProductLevel_1": "PCE",
                            "ProductLevel_2": "3",
                            "ProductLevel_3": "32 ",
                            "ResolutionDelivererToCharge": "",
                            "ResolutionSupplierToCharge": "ADMIRAL",
                            "StockItem": {
                                "CostPrice": 663.64
                            }
                        },
                        "MasterData": {
                            "SupplierCostMatrix": masterData_supplierCostMatrix_B,
                            "ServiceSuppliers": masterData_serviceSuppliers,
                            "Settings": masterData_settings,
                            "PartsCostMatrix": masterData_partsCostMatrix_Adm1,
                            "LabourCostMatrix": [
                                masterData_labourCostMatrix_AdmiralObj,
                                masterData_labourCostMatrix_SonyObj
                            ]
                        }
                    };

                    var beforeEvaluate = DTUtils.getClonedMockObj(mock);

                    jsonLoader.srChargeDt.evaluate(mock);

                    expect(beforeEvaluate).not.toEqual(mock);

                    // Check Parts Price - expected: 6.28
                    var p1 = DTUtils.getAllPartsPrice(mock.serviceRequest.Parts);
                    expect(p1).not.toBeWithinRange(0, 6.27);
                    expect(p1).toBeWithinRange(6.28, 6.28);
                    expect(p1).not.toBeWithinRange(6.29, 1000000);

                    // Total Parts, Check 60% Markup -> from 6.28 to 10.05
                    var c1 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs');
                    expect(c1).not.toBeWithinRange(0, 10.047);
                    expect(c1).toBeWithinRange(10.048, 10.050);
                    expect(c1).not.toBeWithinRange(10.06, 1000000);

                    // Check Supplier covers $10 * exchange rate of : 2.67 = 26.70  - expected: 10.05
                    var c2 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'Supplier');
                    expect(c2).not.toBeWithinRange(0, 10.047);
                    expect(c2).toBeWithinRange(10.048, 10.050);
                    expect(c2).not.toBeWithinRange(10.06, 1000000);

                    // Check Labour Cost - expected: 75
                    expect(mock.serviceRequest.ResolutionLabourCost).toBeWithinRange(75, 75);
                    expect(mock.serviceRequest.DepositFromMatrix).toBeWithinRange(75, 75);

                    // Is Internal Technician
                    expect(mock.serviceRequest.AllocationTechnicianIsInternal).toBeTrue();

                    // Labour, Supplier covers $15 * exchange rate of: 2.67 = 40.05
                    // Additional, Supplier covers $20 * exchange rate of: 2.67 = 53.40
                    // Expected: 93.45
                    var c3 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional', 'Supplier');
                    expect(c3).not.toBeWithinRange(0, 93.44);
                    expect(c3).toBeWithinRange(93.449, 93.450);
                    expect(c3).not.toBeWithinRange(93.46, 1000000);

                    //Labour & Additional remainder to FYW - expected: 96.55
                    var c4 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional', 'FYW');
                    expect(c4).not.toBeWithinRange(0, 96.54);
                    expect(c4).toBeWithinRange(96.549, 96.551);
                    expect(c4).not.toBeWithinRange(96.56, 1000000);

                    //Total Labour & Additional - expected: 190
                    var c5 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional');
                    expect(c5).not.toBeWithinRange(0, 189);
                    expect(c5).toBeWithinRange(190, 190);
                    expect(c5).not.toBeWithinRange(191, 1000000);

                });

                it('Scenario 11 ---> Manufacturer Warranty, Primary Charge to Supplier, External Technician, Calculating Values, Exchange rate should be considered', function () {

                    var mock = {
                        "serviceRequest": {
                            "WarrantyLength": 24,
                            "WarrantyContractNo": "12404416",
                            "Type": "SI",
                            "ResolutionTransportCost": 50,
                            "ResolutionPrimaryCharge": "Supplier",
                            "ResolutionLabourCost": 0,
                            "ResolutionAdditionalCost": 50,
                            "RepairType": "Major",
                            "ReplacementIssued": null,
                            "Parts": [
                                {
                                    "number": "712603",
                                    "type": "Parts",
                                    "Source": "Internal",
                                    "quantity": 1,
                                    "CostPrice": 73.82,
                                    "CashPrice": 73.82,
                                    "price": 73.82,
                                    "description": "LG CABINET ASSY",
                                    "stockbranch": 780,
                                    "stockbranchname": "780 COURTS (BELIZE CITY)",
                                    "$$hashKey": "2Z7"
                                }
                            ],
                            "NoCostMatrixData": false,
                            "ManufacturerWarrantyLength": 12,
                            "ManufacturerWarrantyContractNo": "12404416M",
                            "HistoryCharges": [],
                            "DepositRequired": 0,
                            "DepositFromMatrix": 0,
                            "DepositAuthorised": false,
                            "AllocationTechnicianIsInternal": false,
                            "Charges": [],
                            "CreatedOn": moment("2014-10-09T09:18:31.850Z"),
                            "ItemDeliveredOn": moment("2014-07-18T23:00:00.000Z"),
                            "ItemNumber": "522909",
                            "Manufacturer": "ADMIRAL",
                            "PaymentBalance": null,
                            "ProductLevel_1": "PCE",
                            "ProductLevel_2": "5",
                            "ProductLevel_3": "52 ",
                            "ResolutionDelivererToCharge": "",
                            "ResolutionSupplierToCharge": "ADMIRAL",
                            "StockItem": {
                                "CostPrice": 250.21
                            }
                        },
                        "MasterData": {
                            "SupplierCostMatrix": masterData_supplierCostMatrix_B,
                            "ServiceSuppliers": masterData_serviceSuppliers,
                            "Settings": masterData_settings,
                            "PartsCostMatrix": masterData_partsCostMatrix_Adm1,
                            "LabourCostMatrix": [
                                masterData_labourCostMatrix_AdmiralObj,
                                masterData_labourCostMatrix_SonyObj
                            ]
                        }
                    };

                    var beforeEvaluate = DTUtils.getClonedMockObj(mock);

                    jsonLoader.srChargeDt.evaluate(mock);

                    expect(beforeEvaluate).not.toEqual(mock);

                    // Check Parts Price - expected: 73.82
                    var p1 = DTUtils.getAllPartsPrice(mock.serviceRequest.Parts);
                    expect(p1).not.toBeWithinRange(0, 73.81);
                    expect(p1).toBeWithinRange(73.82, 73.82);
                    expect(p1).not.toBeWithinRange(73.83, 1000000);

                    // Total Parts, Check 60% Markup -> from 73.82 to 118.11
                    var c1 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs');
                    expect(c1).not.toBeWithinRange(0, 118.10);
                    expect(c1).toBeWithinRange(118.111, 118.112);
                    expect(c1).not.toBeWithinRange(118.12, 1000000);

                    // Check Supplier covers $10 * exchange rate of : 2.67 = 26.70  - expected: 26.70
                    var c2 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'Supplier');
                    expect(c2).not.toBeWithinRange(0, 26.6);
                    expect(c2).toBeWithinRange(26.70, 26.70);
                    expect(c2).not.toBeWithinRange(26.71, 1000000);

                    // Check FYW covers remainder parts - expected: 91.41
                    var c3 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'FYW');
                    expect(c3).not.toBeWithinRange(0, 91.40);
                    expect(c3).toBeWithinRange(91.411, 91.412);
                    expect(c3).not.toBeWithinRange(91.42, 1000000);

                    // Check Labour Cost - expected: 65
                    expect(mock.serviceRequest.ResolutionLabourCost).toBeWithinRange(65, 65);
                    expect(mock.serviceRequest.DepositFromMatrix).toBeWithinRange(65, 65);

                    // Is External Technician
                    expect(mock.serviceRequest.AllocationTechnicianIsInternal).toBeFalse();

                    // Labour, Supplier covers $15 * exchange rate of: 2.67 = 40.05
                    // Additional, Supplier covers $20 * exchange rate of: 2.67 = 53.40
                    // Expected: 93.45
                    var c4 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional', 'Supplier');
                    expect(c4).not.toBeWithinRange(0, 93.44);
                    expect(c4).toBeWithinRange(93.449, 93.450);
                    expect(c4).not.toBeWithinRange(93.46, 1000000);

                    //Labour & Additional remainder to FYW - expected: 71.55
                    var c5 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional', 'FYW');
                    expect(c5).not.toBeWithinRange(0, 71.54);
                    expect(c5).toBeWithinRange(71.550, 71.551);
                    expect(c5).not.toBeWithinRange(71.56, 1000000);

                    //Total Labour & Additional - expected: 165
                    var c6 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional');
                    expect(c6).not.toBeWithinRange(0, 164);
                    expect(c6).toBeWithinRange(165, 165);
                    expect(c6).not.toBeWithinRange(166, 1000000);
                });

                it('Scenario 12 ---> Manufacturer Warranty, Primary Charge to Supplier, Internal Technician, Calculating Values, Exchange rate should be considered', function() {

                    var mock = {
                        "serviceRequest": {
                            "WarrantyLength": 24,
                            "WarrantyContractNo": "12403364",
                            "Type": "SI",
                            "ResolutionTransportCost": 50,
                            "ResolutionPrimaryCharge": "Supplier",
                            "ResolutionLabourCost": 0,
                            "ResolutionAdditionalCost": 50,
                            "RepairType": "Major",
                            "ReplacementIssued": null,
                            "Parts": [
                                {
                                    "number": "712603",
                                    "type": "Parts",
                                    "Source": "Internal",
                                    "quantity": 1,
                                    "CostPrice": 73.82,
                                    "CashPrice": 73.82,
                                    "price": 73.82,
                                    "description": "LG CABINET ASSY",
                                    "stockbranch": 780,
                                    "stockbranchname": "780 COURTS (BELIZE CITY)",
                                    "$$hashKey": "0PF"
                                }
                            ],
                            "NoCostMatrixData": false,
                            "ManufacturerWarrantyLength": 12,
                            "ManufacturerWarrantyContractNo": "12403364M",
                            "HistoryCharges": [],
                            "DepositRequired": 0,
                            "DepositFromMatrix": 0,
                            "DepositAuthorised": false,
                            "AllocationTechnicianIsInternal": true,
                            "Charges": [],
                            "CreatedOn": moment("2014-10-09T09:55:29.122Z"),
                            "ItemDeliveredOn": moment("2013-12-06T00:00:00.000Z"),
                            "ItemNumber": "322191",
                            "Manufacturer": "ADMIRAL",
                            "PaymentBalance": null,
                            "ProductLevel_1": "PCE",
                            "ProductLevel_2": "3",
                            "ProductLevel_3": "322",
                            "ResolutionDelivererToCharge": "",
                            "ResolutionSupplierToCharge": "ADMIRAL",
                            "StockItem": {
                                "CostPrice": 478.87
                            }
                        },
                        "MasterData": {
                            "SupplierCostMatrix": masterData_supplierCostMatrix_B,
                            "ServiceSuppliers": masterData_serviceSuppliers,
                            "Settings": masterData_settings,
                            "PartsCostMatrix": masterData_partsCostMatrix_Adm1,
                            "LabourCostMatrix": [
                                masterData_labourCostMatrix_AdmiralObj,
                                masterData_labourCostMatrix_SonyObj
                            ]
                        }
                    };

                    var beforeEvaluate = DTUtils.getClonedMockObj(mock);

                    jsonLoader.srChargeDt.evaluate(mock);

                    expect(beforeEvaluate).not.toEqual(mock);

                    // Check Parts Price - expected: 73.82
                    var p1 = DTUtils.getAllPartsPrice(mock.serviceRequest.Parts);
                    expect(p1).not.toBeWithinRange(0, 73.81);
                    expect(p1).toBeWithinRange(73.82, 73.82);
                    expect(p1).not.toBeWithinRange(73.83, 1000000);

                    // Total Parts, Check 60% Markup -> from 73.82 to 118.11
                    var c1 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs');
                    expect(c1).not.toBeWithinRange(0, 118.10);
                    expect(c1).toBeWithinRange(118.111, 118.112);
                    expect(c1).not.toBeWithinRange(118.12, 1000000);

                    // Check Supplier covers $10 * exchange rate of : 2.67 = 26.70  - expected: 26.70
                    var c2 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'Supplier');
                    expect(c2).not.toBeWithinRange(0, 26.6);
                    expect(c2).toBeWithinRange(26.70, 26.70);
                    expect(c2).not.toBeWithinRange(26.71, 1000000);

                    // Check FYW covers remainder parts - expected: 91.41
                    var c3 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'FYW');
                    expect(c3).not.toBeWithinRange(0, 91.40);
                    expect(c3).toBeWithinRange(91.411, 91.412);
                    expect(c3).not.toBeWithinRange(91.42, 1000000);

                    // Check Labour Cost - expected: 75
                    expect(mock.serviceRequest.ResolutionLabourCost).toBeWithinRange(75, 75);
                    expect(mock.serviceRequest.DepositFromMatrix).toBeWithinRange(75, 75);

                    // Is Internal Technician
                    expect(mock.serviceRequest.AllocationTechnicianIsInternal).toBeTrue();

                    // Labour, Supplier covers $15 * exchange rate of: 2.67 = 40.05
                    // Additional, Supplier covers $20 * exchange rate of: 2.67 = 53.40
                    // Expected: 93.45
                    var c4 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional', 'Supplier');
                    expect(c4).not.toBeWithinRange(0, 93.44);
                    expect(c4).toBeWithinRange(93.449, 93.450);
                    expect(c4).not.toBeWithinRange(93.46, 1000000);

                    //Labour & Additional remainder to FYW - expected: 81.55
                    var c5 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional', 'FYW');
                    expect(c5).not.toBeWithinRange(0, 81.54);
                    expect(c5).toBeWithinRange(81.550, 81.551);
                    expect(c5).not.toBeWithinRange(81.56, 1000000);

                    //Total Labour & Additional - expected: 175
                    var c6 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional');
                    expect(c6).not.toBeWithinRange(0, 174);
                    expect(c6).toBeWithinRange(175, 175);
                    expect(c6).not.toBeWithinRange(176, 1000000);

                });

                it('Scenario 13 ---> Extended Warranty, Primary Charge To Supplier, External Technician, Calculating Values, Exchange rate should be considered', function () {

                    var mock = {
                        "serviceRequest": {
                            "WarrantyLength": 36,
                            "WarrantyContractNo": "12105178",
                            "Type": "SI",
                            "ResolutionTransportCost": 35,
                            "ResolutionPrimaryCharge": "Supplier",
                            "ResolutionLabourCost": 0,
                            "ResolutionAdditionalCost": 25,
                            "RepairType": "Major",
                            "ReplacementIssued": null,
                            "Parts": [
                                {
                                    "number": "712603",
                                    "type": "Parts",
                                    "Source": "Internal",
                                    "quantity": 1,
                                    "CostPrice": 6.94,
                                    "CashPrice": 6.94,
                                    "price": 6.94,
                                    "description": "LG CABINET ASSY",
                                    "stockbranch": 780,
                                    "stockbranchname": "780 COURTS (BELIZE CITY)",
                                    "$$hashKey": "1WX"
                                }
                            ],
                            "NoCostMatrixData": false,
                            "ManufacturerWarrantyLength": 12,
                            "ManufacturerWarrantyContractNo": "12105178M",
                            "HistoryCharges": [],
                            "DepositRequired": 0,
                            "DepositFromMatrix": 0,
                            "DepositAuthorised": false,
                            "AllocationTechnicianIsInternal": false,
                            "Charges": [],
                            "CreatedOn": moment("2014-10-10T07:08:45.622Z"),
                            "ItemDeliveredOn": moment("2011-10-17T23:00:00.000Z"),
                            "ItemNumber": "440663600009",
                            "Manufacturer": "ADMIRAL",
                            "PaymentBalance": null,
                            "ProductLevel_1": null,
                            "ProductLevel_2": null,
                            "ProductLevel_3": null,
                            "ResolutionDelivererToCharge": "",
                            "ResolutionSupplierToCharge": "ADMIRAL",
                            "StockItem": {
                                "CostPrice": 1350
                            }
                        },
                        "MasterData": {
                            "SupplierCostMatrix": masterData_supplierCostMatrix_B,
                            "ServiceSuppliers": masterData_serviceSuppliers,
                            "Settings": masterData_settings,
                            "PartsCostMatrix": masterData_partsCostMatrix_Adm1,
                            "LabourCostMatrix": [
                                masterData_labourCostMatrix_AdmiralObj,
                                masterData_labourCostMatrix_SonyObj
                            ]
                        }
                    };

                    var beforeEvaluate = DTUtils.getClonedMockObj(mock);

                    jsonLoader.srChargeDt.evaluate(mock);

                    expect(beforeEvaluate).not.toEqual(mock);

                    // Check Parts Price - expected: 6.94
                    var p1 = DTUtils.getAllPartsPrice(mock.serviceRequest.Parts);
                    expect(p1).not.toBeWithinRange(0, 6.93);
                    expect(p1).toBeWithinRange(6.94, 6.94);
                    expect(p1).not.toBeWithinRange(6.95, 1000000);

                    // Total Parts, Check 40% Markup -> from 6.94 to 9.72
                    var c1 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs');
                    expect(c1).not.toBeWithinRange(0, 9.71);
                    expect(c1).toBeWithinRange(9.715, 9.720);
                    expect(c1).not.toBeWithinRange(9.73, 1000000);

                    // Check Supplier covers $20 * exchange rate of : 2.67 = 53.40  - expected: 9.72
                    var c2 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'Supplier');
                    expect(c2).not.toBeWithinRange(0, 9.71);
                    expect(c2).toBeWithinRange(9.715, 9.720);
                    expect(c2).not.toBeWithinRange(9.73, 1000000);

                    // Check Labour Cost - expected: 65
                    expect(mock.serviceRequest.ResolutionLabourCost).toBeWithinRange(65, 65);
                    expect(mock.serviceRequest.DepositFromMatrix).toBeWithinRange(65, 65);

                    // Is External Technician
                    expect(mock.serviceRequest.AllocationTechnicianIsInternal).toBeFalse();

                    // Labour, Supplier covers $25 * exchange rate of: 2.67 = 66.75
                    // Additional, Supplier covers $30 * exchange rate of: 2.67 = 80.1
                    // Expected: 125
                    var c3 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional', 'Supplier');
                    expect(c3).not.toBeWithinRange(0, 124);
                    expect(c3).toBeWithinRange(125, 125);
                    expect(c3).not.toBeWithinRange(126, 1000000);

                    //Total Labour & Additional - expected: 125
                    var c4 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional');
                    expect(c4).not.toBeWithinRange(0, 124);
                    expect(c4).toBeWithinRange(125, 125);
                    expect(c4).not.toBeWithinRange(126, 1000000);

                });

                it('Scenario 14 ---> Extended Warranty, Primary Charge To Supplier, Internal Technician, Calculating Values, Exchange rate should be considered', function () {

                    var mock = {
                        "serviceRequest": {
                            "WarrantyLength": 24,
                            "WarrantyContractNo": "12107082",
                            "Type": "SI",
                            "ResolutionTransportCost": null,
                            "ResolutionPrimaryCharge": "Supplier",
                            "ResolutionLabourCost": 0,
                            "ResolutionAdditionalCost": 60,
                            "RepairType": "Major",
                            "ReplacementIssued": null,
                            "Parts": [
                                {
                                    "number": "712603",
                                    "type": "Parts",
                                    "Source": "Internal",
                                    "quantity": 1,
                                    "CostPrice": 6.28,
                                    "CashPrice": 6.28,
                                    "price": 6.28,
                                    "description": "LG CABINET ASSY",
                                    "stockbranch": 780,
                                    "stockbranchname": "780 COURTS (BELIZE CITY)",
                                    "$$hashKey": "6NG"
                                }
                            ],
                            "NoCostMatrixData": false,
                            "ManufacturerWarrantyLength": 12,
                            "ManufacturerWarrantyContractNo": "12107082M",
                            "HistoryCharges": [],
                            "DepositRequired": 0,
                            "DepositFromMatrix": 0,
                            "DepositAuthorised": false,
                            "AllocationTechnicianIsInternal": true,
                            "Charges": [],
                            "CreatedOn": moment("2014-10-13T14:28:14.331Z"),
                            "ItemDeliveredOn": moment("2012-10-21T23:00:00.000Z"),
                            "ItemNumber": "400109",
                            "Manufacturer": "ADMIRAL",
                            "PaymentBalance": null,
                            "ProductLevel_1": "PCW",
                            "ProductLevel_2": "21",
                            "ProductLevel_3": "40 ",
                            "ResolutionDelivererToCharge": "",
                            "ResolutionSupplierToCharge": "ADMIRAL",
                            "StockItem": {
                                "CostPrice": 711.76
                            }
                        },
                        "MasterData": {
                            "SupplierCostMatrix": masterData_supplierCostMatrix_B,
                            "ServiceSuppliers": masterData_serviceSuppliers,
                            "Settings": masterData_settings,
                            "PartsCostMatrix": masterData_partsCostMatrix_Adm1,
                            "LabourCostMatrix": [
                                masterData_labourCostMatrix_AdmiralObj,
                                masterData_labourCostMatrix_SonyObj
                            ]
                        },
                        "isItemBer": false
                    };


                    var beforeEvaluate = DTUtils.getClonedMockObj(mock);

                    jsonLoader.srChargeDt.evaluate(mock);

                    expect(beforeEvaluate).not.toEqual(mock);

                    // Check Parts Price - expected: 6.28
                    var p1 = DTUtils.getAllPartsPrice(mock.serviceRequest.Parts);
                    expect(p1).not.toBeWithinRange(0, 6.27);
                    expect(p1).toBeWithinRange(6.28, 6.28);
                    expect(p1).not.toBeWithinRange(6.29, 1000000);

                    // Total Parts, Check 40% Markup -> from 6.28 to 8.79
                    var c1 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs');
                    expect(c1).not.toBeWithinRange(0, 8.78);
                    expect(c1).toBeWithinRange(8.790, 8.793);
                    expect(c1).not.toBeWithinRange(8.80, 1000000);

                    // Check parts charged to Supplier - expected: 8.79
                    var c2 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'Supplier');
                    expect(c2).not.toBeWithinRange(0, 8.78);
                    expect(c2).toBeWithinRange(8.790, 8.793);
                    expect(c2).not.toBeWithinRange(8.80, 1000000);

                    // Check no parts charged to EW - expected: 0
                    var c3 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'EW');
                    expect(c3).toBeWithinRange(0, 0);
                    expect(c3).not.toBeWithinRange(1, 1000000);

                    // Check Labour Cost - expected: 75
                    expect(mock.serviceRequest.ResolutionLabourCost).toBeWithinRange(75, 75);
                    expect(mock.serviceRequest.DepositFromMatrix).toBeWithinRange(75, 75);

                    // Is Internal Technician
                    expect(mock.serviceRequest.AllocationTechnicianIsInternal).toBeTrue();

                    // Labour, Supplier covers $25 * exchange rate of: 2.67 = 66.75
                    // Additional, Supplier covers $30 * exchange rate of: 2.67 = 80.1
                    // Expected: 126.75
                    var c4 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional', 'Supplier');
                    expect(c4).not.toBeWithinRange(0, 126.74);
                    expect(c4).toBeWithinRange(126.75, 126.75);
                    expect(c4).not.toBeWithinRange(126.76, 1000000);

                    // Check remaining Labour & Additional charged to EW - expected: 8.25
                    var c5 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional', 'EW');
                    expect(c5).not.toBeWithinRange(0, 8.24);
                    expect(c5).toBeWithinRange(8.25, 8.25);
                    expect(c5).not.toBeWithinRange(8.26, 1000000);

                    //Total Labour & Additional - expected: 135
                    var c6 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional');
                    expect(c6).not.toBeWithinRange(0, 134);
                    expect(c6).toBeWithinRange(135, 135);
                    expect(c6).not.toBeWithinRange(136, 1000000);

                });

                it('Scenario 15 ---> Extended Warranty, Primary Charge To Supplier, External Technician, Calculating Values, Exchange rate should be considered', function () {

                    var mock = {
                        "serviceRequest": {
                            "WarrantyLength": 24,
                            "WarrantyContractNo": "12107042",
                            "Type": "SI",
                            "ResolutionTransportCost": 50,
                            "ResolutionPrimaryCharge": "Supplier",
                            "ResolutionLabourCost": 0,
                            "ResolutionAdditionalCost": 60,
                            "RepairType": "Major",
                            "ReplacementIssued": null,
                            "Parts": [
                                {
                                    "number": "712603",
                                    "type": "Parts",
                                    "Source": "Internal",
                                    "quantity": 1,
                                    "CostPrice": 73.82,
                                    "CashPrice": 73.82,
                                    "price": 73.82,
                                    "description": "LG CABINET ASSY",
                                    "stockbranch": 780,
                                    "stockbranchname": "780 COURTS (BELIZE CITY)",
                                    "$$hashKey": "2F7"
                                }
                            ],
                            "NoCostMatrixData": false,
                            "ManufacturerWarrantyLength": 12,
                            "ManufacturerWarrantyContractNo": "12107042M",
                            "HistoryCharges": [],
                            "DepositRequired": 0,
                            "DepositFromMatrix": 0,
                            "DepositAuthorised": false,
                            "AllocationTechnicianIsInternal": false,
                            "Charges": [],
                            "CreatedOn": moment("2014-10-10T08:03:23.433Z"),
                            "ItemDeliveredOn": moment("2012-10-10T23:00:00.000Z"),
                            "ItemNumber": "202939",
                            "Manufacturer": "ADMIRAL",
                            "PaymentBalance": null,
                            "ProductLevel_1": "PCE",
                            "ProductLevel_2": "2",
                            "ProductLevel_3": "202",
                            "ResolutionDelivererToCharge": "",
                            "ResolutionSupplierToCharge": "ADMIRAL",
                            "StockItem": {
                                "CostPrice": 433.44
                            }
                        },
                        "MasterData": {
                            "SupplierCostMatrix": masterData_supplierCostMatrix_B,
                            "ServiceSuppliers": masterData_serviceSuppliers,
                            "Settings": masterData_settings,
                            "PartsCostMatrix": masterData_partsCostMatrix_Adm1,
                            "LabourCostMatrix": [
                                masterData_labourCostMatrix_AdmiralObj,
                                masterData_labourCostMatrix_SonyObj
                            ]
                        }
                    };

                    var beforeEvaluate = DTUtils.getClonedMockObj(mock);

                    jsonLoader.srChargeDt.evaluate(mock);

                    expect(beforeEvaluate).not.toEqual(mock);

                    // Check Parts Price - expected: 73.82
                    var p1 = DTUtils.getAllPartsPrice(mock.serviceRequest.Parts);
                    expect(p1).not.toBeWithinRange(0, 73.81);
                    expect(p1).toBeWithinRange(73.82, 73.82);
                    expect(p1).not.toBeWithinRange(73.83, 1000000);

                    // Total Parts, Check 40% Markup -> from 73.82 to 103.35
                    var c1 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs');
                    expect(c1).not.toBeWithinRange(0, 103.34);
                    expect(c1).toBeWithinRange(103.347, 103.350);
                    expect(c1).not.toBeWithinRange(103.36, 1000000);

                    // Check Supplier covers $20 * exchange rate of : 2.67 = 53.40  - expected: 53.40
                    var c2 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'Supplier');
                    expect(c2).not.toBeWithinRange(0, 53.39);
                    expect(c2).toBeWithinRange(53.40, 53.40);
                    expect(c2).not.toBeWithinRange(53.41, 1000000);

                    // Check remainder parts charged to EW - expected: 49.95
                    var c3 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'EW');
                    expect(c3).not.toBeWithinRange(0, 49.94);
                    expect(c3).toBeWithinRange(49.947, 49.950);
                    expect(c3).not.toBeWithinRange(49.96, 1000000);

                    // Check Labour Cost - expected: 65
                    expect(mock.serviceRequest.ResolutionLabourCost).toBeWithinRange(65, 65);
                    expect(mock.serviceRequest.DepositFromMatrix).toBeWithinRange(65, 65);

                    // Is External Technician
                    expect(mock.serviceRequest.AllocationTechnicianIsInternal).toBeFalse();

                    // Labour, Supplier covers $25 * exchange rate of: 2.67 = 66.75
                    // Additional, Supplier covers $30 * exchange rate of: 2.67 = 80.1
                    // Expected: 145.10
                    var c4 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional', 'Supplier');
                    expect(c4).not.toBeWithinRange(0, 145.0);
                    expect(c4).toBeWithinRange(145.10, 145.10);
                    expect(c4).not.toBeWithinRange(145.11, 1000000);

                    // Check remainder Labour & Additional charged to EW - expected: 29.90
                    var c5 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional', 'EW');
                    expect(c5).not.toBeWithinRange(0, 29.89);
                    expect(c5).toBeWithinRange(29.90, 29.901);
                    expect(c5).not.toBeWithinRange(29.91, 1000000);

                    //Total Labour & Additional - expected: 175
                    var c6 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional');
                    expect(c6).not.toBeWithinRange(0, 174);
                    expect(c6).toBeWithinRange(175, 175);
                    expect(c6).not.toBeWithinRange(176, 1000000);
                });

                it('Scenario 16 ---> Extended Warranty, Primary Charge To Supplier, Internal Technician, Calculating Values, Exchange rate should be considered', function () {

                    var mock = {
                        "serviceRequest": {
                            "WarrantyLength": 24,
                            "WarrantyContractNo": "12107113",
                            "Type": "SI",
                            "ResolutionTransportCost": 50,
                            "ResolutionPrimaryCharge": "Supplier",
                            "ResolutionLabourCost": 0,
                            "ResolutionAdditionalCost": 60,
                            "RepairType": "Major",
                            "ReplacementIssued": null,
                            "Parts": [
                                {
                                    "number": "712603",
                                    "type": "Parts",
                                    "Source": "Internal",
                                    "quantity": 1,
                                    "CostPrice": 73.82,
                                    "CashPrice": 73.82,
                                    "price": 73.82,
                                    "description": "LG CABINET ASSY",
                                    "stockbranch": 780,
                                    "stockbranchname": "780 COURTS (BELIZE CITY)",
                                    "$$hashKey": "2EN"
                                }
                            ],
                            "NoCostMatrixData": false,
                            "ManufacturerWarrantyLength": 12,
                            "ManufacturerWarrantyContractNo": "12107113M",
                            "HistoryCharges": [],
                            "DepositRequired": 0,
                            "DepositFromMatrix": 0,
                            "DepositAuthorised": false,
                            "AllocationTechnicianIsInternal": true,
                            "Charges": [],
                            "CreatedOn": moment("2014-10-14T07:22:02.358Z"),
                            "ItemDeliveredOn": moment("2012-10-22T23:00:00.000Z"),
                            "ItemNumber": "400093",
                            "Manufacturer": "ADMIRAL",
                            "PaymentBalance": null,
                            "ProductLevel_1": "PCW",
                            "ProductLevel_2": "21",
                            "ProductLevel_3": "40 ",
                            "ResolutionDelivererToCharge": "",
                            "ResolutionSupplierToCharge": "ADMIRAL",
                            "StockItem": {
                                "CostPrice": 832.59
                            }
                        },
                        "MasterData": {
                            "SupplierCostMatrix": masterData_supplierCostMatrix_B,
                            "ServiceSuppliers": masterData_serviceSuppliers,
                            "Settings": masterData_settings,
                            "PartsCostMatrix": masterData_partsCostMatrix_Adm1,
                            "LabourCostMatrix": [
                                masterData_labourCostMatrix_AdmiralObj,
                                masterData_labourCostMatrix_SonyObj
                            ]
                        },
                        "isItemBer": false
                    };

                    var beforeEvaluate = DTUtils.getClonedMockObj(mock);

                    jsonLoader.srChargeDt.evaluate(mock);

                    expect(beforeEvaluate).not.toEqual(mock);

                    // Check Parts Price - expected: 73.82
                    var p1 = DTUtils.getAllPartsPrice(mock.serviceRequest.Parts);
                    expect(p1).not.toBeWithinRange(0, 73.81);
                    expect(p1).toBeWithinRange(73.82, 73.82);
                    expect(p1).not.toBeWithinRange(73.83, 1000000);

                    // Total Parts, Check 40% Markup -> from 73.82 to 103.35
                    var c1 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs');
                    expect(c1).not.toBeWithinRange(0, 103.34);
                    expect(c1).toBeWithinRange(103.347, 103.350);
                    expect(c1).not.toBeWithinRange(103.36, 1000000);

                    // Check Supplier covers 20 * (2.67) Exchange Rate = 53.4 of the Parts - expected: 53.4
                    var c2 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'Supplier');
                    expect(c2).not.toBeWithinRange(0, 53.3);
                    expect(c2).toBeWithinRange(53.4, 53.4);
                    expect(c2).not.toBeWithinRange(53.5, 1000000);

                    // Check EW covers remaining Parts - expected: 49.95
                    var c3 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'EW');
                    expect(c3).not.toBeWithinRange(0, 49.94);
                    expect(c3).toBeWithinRange(49.945, 49.95);
                    expect(c3).not.toBeWithinRange(49.96, 1000000);

                    // Check Labour Cost - expected: 75
                    expect(mock.serviceRequest.ResolutionLabourCost).toBeWithinRange(75, 75);
                    expect(mock.serviceRequest.DepositFromMatrix).toBeWithinRange(75, 75);

                    // Is Internal Technician
                    expect(mock.serviceRequest.AllocationTechnicianIsInternal).toBeTrue();

                    // Labour, Supplier covers $25 * exchange rate of: 2.67 = 66.75
                    // Additional, Supplier covers $30 * exchange rate of: 2.67 = 80.1
                    // Expected: 146.85
                    var c4 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional', 'Supplier');
                    expect(c4).not.toBeWithinRange(0, 146.84);
                    expect(c4).toBeWithinRange(146.85, 146.85);
                    expect(c4).not.toBeWithinRange(146.86, 1000000);

                    // Check EW covers remaining Labour & Additional - expected: 49.95
                    var c5 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional', 'EW');
                    expect(c5).not.toBeWithinRange(0, 38.14);
                    expect(c5).toBeWithinRange(38.150, 38.151);
                    expect(c5).not.toBeWithinRange(38.16, 1000000);

                    // Check Total Labour & Additional - expected: 185
                    var c6 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional');
                    expect(c6).not.toBeWithinRange(0, 184);
                    expect(c6).toBeWithinRange(185, 185);
                    expect(c6).not.toBeWithinRange(186, 1000000);

                });

                it('Scenario 18 ---> Manufacturer Warranty, Primary Charge FYW, External Technician', function () {

                    var mock = {
                        "serviceRequest": {
                            "WarrantyLength": 24,
                            "WarrantyContractNo": "12203548",
                            "Type": "SI",
                            "ResolutionTransportCost": 25,
                            "ResolutionPrimaryCharge": "Unicomer Warranty",
                            "ResolutionLabourCost": 0,
                            "ResolutionAdditionalCost": 25,
                            "RepairType": "Major",
                            "ReplacementIssued": null,
                            "Parts": [
                                {
                                    "number": "712603",
                                    "type": null,
                                    "quantity": 1,
                                    "price": 24.799999999999997,
                                    "CostPrice": 15.5,
                                    "description": "LG CABINET ASSY",
                                    "stockbranch": "780",
                                    "Source": "Internal",
                                    "$$hashKey": "00G",
                                    "stockbranchname": "780 COURTS (BELIZE CITY)",
                                    "CashPrice": 24.79
                                },
                                {
                                    "Source": "Salvaged",
                                    "quantity": 1,
                                    "CostPrice": 50,
                                    "CashPrice": 80,
                                    "price": 80,
                                    "description": "External Part",
                                    "$$hashKey": "0M8"
                                }
                            ],
                            "NoCostMatrixData": false,
                            "ManufacturerWarrantyLength": 12,
                            "ManufacturerWarrantyContractNo": "12203548M",
                            "HistoryCharges": [
                                {
                                    "CustomerId": null,
                                    "Label": null,
                                    "ChargeType": "Internal",
                                    "ItemNo": null,
                                    "Account": "779500001810",
                                    "Cost": 0,
                                    "Value": 0,
                                    "Tax": 0,
                                    "RequestId": 96151,
                                    "IsExternal": false
                                },
                                {
                                    "CustomerId": null,
                                    "Label": null,
                                    "ChargeType": "Internal",
                                    "ItemNo": null,
                                    "Account": "779500001810",
                                    "Cost": 0,
                                    "Value": 26.67,
                                    "Tax": 3.33,
                                    "RequestId": 96151,
                                    "IsExternal": false
                                },
                                {
                                    "CustomerId": null,
                                    "Label": null,
                                    "ChargeType": "Internal",
                                    "ItemNo": null,
                                    "Account": "779500001810",
                                    "Cost": 0,
                                    "Value": 0,
                                    "Tax": 0,
                                    "RequestId": 97417,
                                    "IsExternal": false
                                },
                                {
                                    "CustomerId": null,
                                    "Label": null,
                                    "ChargeType": "Internal",
                                    "ItemNo": null,
                                    "Account": "779500001810",
                                    "Cost": 0,
                                    "Value": 26.67,
                                    "Tax": 3.33,
                                    "RequestId": 97417,
                                    "IsExternal": false
                                }
                            ],
                            "DepositRequired": 0,
                            "DepositFromMatrix": 0,
                            "DepositAuthorised": false,
                            "AllocationTechnicianIsInternal": false,
                            "Charges": [],
                            "CreatedOn": moment("2014-10-10T14:04:00.000Z"),
                            "ItemDeliveredOn": moment("2013-11-19T00:00:00.000Z"),
                            "ItemNumber": "400202",
                            "Manufacturer": "ADMIRAL",
                            "PaymentBalance": null,
                            "ProductLevel_1": "PCW",
                            "ProductLevel_2": "21",
                            "ProductLevel_3": "400",
                            "ResolutionDelivererToCharge": "",
                            "ResolutionSupplierToCharge": "",
                            "StockItem": {
                                "CostPrice": 768.45
                            }
                        },
                        "MasterData": {
                            "SupplierCostMatrix": null,
                            "ServiceSuppliers": masterData_serviceSuppliers,
                            "Settings": masterData_settings,
                            "PartsCostMatrix": masterData_partsCostMatrix_Adm1,
                            "LabourCostMatrix": [
                                masterData_labourCostMatrix_AdmiralObj,
                                masterData_labourCostMatrix_SonyObj
                            ]
                        },
                        "isItemBer": false
                    };

                    var beforeEvaluate = DTUtils.getClonedMockObj(mock);

                    jsonLoader.srChargeDt.evaluate(mock);

                    expect(beforeEvaluate).not.toEqual(mock);

                    // Check Parts Price - expected: 104.80
                    var p1 = DTUtils.getAllPartsPrice(mock.serviceRequest.Parts);
                    expect(p1).not.toBeWithinRange(0, 104.70);
                    expect(p1).toBeWithinRange(104.80, 104.80);
                    expect(p1).not.toBeWithinRange(104.90, 1000000);

                    // Total Parts Cosacs - expected: 24.80
                    var c1 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs');
                    expect(c1).not.toBeWithinRange(0, 24.70);
                    expect(c1).toBeWithinRange(24.795, 24.80);
                    expect(c1).not.toBeWithinRange(24.81, 1000000);

                    // Total Parts Salvaged - expected: 80
                    var c2 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Salvaged');
                    expect(c2).not.toBeWithinRange(0, 79);
                    expect(c2).toBeWithinRange(80, 80);
                    expect(c2).not.toBeWithinRange(81, 1000000);

                    // Total Parts Cosacs charged to FYW - expected - 24.80
                    var c3 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'FYW');
                    expect(c3).not.toBeWithinRange(0, 24.70);
                    expect(c3).toBeWithinRange(24.795, 24.80);
                    expect(c3).not.toBeWithinRange(24.81, 1000000);

                    // Total Parts Salvaged charged to FYW - expected - 80
                    var c4 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Salvaged', 'FYW');
                    expect(c4).not.toBeWithinRange(0, 79);
                    expect(c4).toBeWithinRange(80, 80);
                    expect(c4).not.toBeWithinRange(81, 1000000);

                    // Check Labour Cost - expected: 65
                    expect(mock.serviceRequest.ResolutionLabourCost).toBeWithinRange(65, 65);
                    expect(mock.serviceRequest.DepositFromMatrix).toBeWithinRange(65, 65);

                    // Is External Technician
                    expect(mock.serviceRequest.AllocationTechnicianIsInternal).toBeFalse();

                    // Check Labour charged to FYW - expected: 65
                    var c5 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour', 'FYW');
                    expect(c5).not.toBeWithinRange(0, 64);
                    expect(c5).toBeWithinRange(65, 65);
                    expect(c5).not.toBeWithinRange(66, 1000000);

                    // Check Additional charged to FYW - expected: 50
                    var c6 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Additional', 'FYW');
                    expect(c6).not.toBeWithinRange(0, 49);
                    expect(c6).toBeWithinRange(50, 50);
                    expect(c6).not.toBeWithinRange(51, 1000000);

                    // Check Labour total - expected: 65
                    var c7 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour');
                    expect(c7).not.toBeWithinRange(0, 64);
                    expect(c7).toBeWithinRange(65, 65);
                    expect(c7).not.toBeWithinRange(66, 1000000);

                    // Check Additional total - expected: 50
                    var c8 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Additional');
                    expect(c8).not.toBeWithinRange(0, 49);
                    expect(c8).toBeWithinRange(50, 50);
                    expect(c8).not.toBeWithinRange(51, 1000000);

                });

                it('Scenario 19 ---> Extended Warranty, Primary Charge Supplier EW/FYW, External Technician', function () {

                    var mock = {
                        "serviceRequest": {
                            "WarrantyLength": 36,
                            "WarrantyContractNo": "12105185",
                            "Type": "SI",
                            "ResolutionTransportCost": null,
                            "ResolutionPrimaryCharge": "EW",
                            "ResolutionLabourCost": 0,
                            "ResolutionAdditionalCost": null,
                            "RepairType": "Major",
                            "ReplacementIssued": null,
                            "Parts": [
                                {
                                    "Source": "External",
                                    "quantity": 1,
                                    "CostPrice": 50,
                                    "CashPrice": 70,
                                    "price": 70,
                                    "description": "External Part",
                                    "$$hashKey": "2EB"
                                },
                                {
                                    "number": "712603",
                                    "Source": "Internal",
                                    "quantity": 1,
                                    "CostPrice": 15.5,
                                    "CashPrice": 21.7,
                                    "price": 21.7,
                                    "description": "LG CABINET ASSY",
                                    "stockbranch": 780,
                                    "stockbranchname": "780 COURTS (BELIZE CITY)",
                                    "$$hashKey": "2IE"
                                }
                            ],
                            "NoCostMatrixData": false,
                            "ManufacturerWarrantyLength": 12,
                            "ManufacturerWarrantyContractNo": "12105185M",
                            "HistoryCharges": [],
                            "DepositRequired": 0,
                            "DepositFromMatrix": 0,
                            "DepositAuthorised": false,
                            "AllocationTechnicianIsInternal": false,
                            "Charges": [],
                            "CreatedOn": moment("2014-10-13T09:46:47.990Z"),
                            "ItemDeliveredOn": moment("2011-10-16T23:00:00.000Z"),
                            "ItemNumber": "423179200000",
                            "Manufacturer": "SONY",
                            "PaymentBalance": null,
                            "ProductLevel_1": null,
                            "ProductLevel_2": null,
                            "ProductLevel_3": null,
                            "ResolutionDelivererToCharge": "",
                            "ResolutionSupplierToCharge": "",
                            "StockItem": {
                                "CostPrice": 798.61
                            }
                        },
                        "MasterData": {
                            "SupplierCostMatrix": null,
                            "ServiceSuppliers": masterData_serviceSuppliers,
                            "Settings": masterData_settings,
                            "PartsCostMatrix": masterData_partsCostMatrix_Sony,
                            "LabourCostMatrix": [
                                masterData_labourCostMatrix_AdmiralObj,
                                masterData_labourCostMatrix_SonyObj
                            ]
                        },
                        "isItemBer": false
                    };

                    var beforeEvaluate = DTUtils.getClonedMockObj(mock);

                    jsonLoader.srChargeDt.evaluate(mock);

                    expect(beforeEvaluate).not.toEqual(mock);

                    // Check Parts Price - expected: 91.70
                    var p1 = DTUtils.getAllPartsPrice(mock.serviceRequest.Parts);
                    expect(p1).not.toBeWithinRange(0, 91.69);
                    expect(p1).toBeWithinRange(91.70, 91.70);
                    expect(p1).not.toBeWithinRange(91.71, 1000000);

                    // Total Parts Cosacs - expected: 21.70
                    var c1 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs');
                    expect(c1).not.toBeWithinRange(0, 21.69);
                    expect(c1).toBeWithinRange(21.70, 21.70);
                    expect(c1).not.toBeWithinRange(21.71, 1000000);

                    // Total Parts External - expected: 70
                    var c2 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts External');
                    expect(c2).not.toBeWithinRange(0, 69);
                    expect(c2).toBeWithinRange(70, 70);
                    expect(c2).not.toBeWithinRange(71, 1000000);

                    // Total Parts Cosacs charged to EW - expected - 21.70
                    var c3 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'EW');
                    expect(c3).not.toBeWithinRange(0, 21.69);
                    expect(c3).toBeWithinRange(21.70, 21.70);
                    expect(c3).not.toBeWithinRange(21.71, 1000000);

                    // Total Parts External charged to EW - expected - 70
                    var c4 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts External', 'EW');
                    expect(c4).not.toBeWithinRange(0, 69);
                    expect(c4).toBeWithinRange(70, 70);
                    expect(c4).not.toBeWithinRange(71, 1000000);

                    // Check Labour Cost - expected: 65
                    expect(mock.serviceRequest.ResolutionLabourCost).toBeWithinRange(65, 65);
                    expect(mock.serviceRequest.DepositFromMatrix).toBeWithinRange(65, 65);

                    // Is External Technician
                    expect(mock.serviceRequest.AllocationTechnicianIsInternal).toBeFalse();

                    // Check Labour & Additional charged to EW - expected: 40
                    var c5 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional', 'EW');
                    expect(c5).not.toBeWithinRange(0, 39);
                    expect(c5).toBeWithinRange(40, 40);
                    expect(c5).not.toBeWithinRange(41, 1000000);

                    // Check Labour & Additional charged to FYW - expected: 25
                    var c6 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional', 'FYW');
                    expect(c6).not.toBeWithinRange(0, 24);
                    expect(c6).toBeWithinRange(25, 25);
                    expect(c6).not.toBeWithinRange(26, 1000000);

                    // Check Labour & Additional total - expected: 65
                    var c7 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional');
                    expect(c7).not.toBeWithinRange(0, 64);
                    expect(c7).toBeWithinRange(65, 65);
                    expect(c7).not.toBeWithinRange(66, 1000000);

                });

                it('Scenario 20 ---> Primary Charge Internal, External Technician', function () {

                    var mock = {
                        "serviceRequest": {
                            "WarrantyLength": 36,
                            "WarrantyContractNo": "12108805",
                            "Type": "SI",
                            "ResolutionTransportCost": null,
                            "ResolutionPrimaryCharge": "Internal",
                            "ResolutionLabourCost": 0,
                            "ResolutionAdditionalCost": null,
                            "RepairType": "Major",
                            "ReplacementIssued": null,
                            "Parts": [
                                {
                                    "number": "712603",
                                    "Source": "Internal",
                                    "quantity": 1,
                                    "CostPrice": 15.5,
                                    "CashPrice": 15.5,
                                    "price": 27.9,
                                    "description": "LG CABINET ASSY",
                                    "stockbranch": 780,
                                    "stockbranchname": "780 COURTS (BELIZE CITY)",
                                    "$$hashKey": "6OX"
                                }
                            ],
                            "NoCostMatrixData": false,
                            "ManufacturerWarrantyLength": 12,
                            "ManufacturerWarrantyContractNo": "12108805M",
                            "HistoryCharges": [],
                            "DepositRequired": 0,
                            "DepositFromMatrix": 0,
                            "DepositAuthorised": false,
                            "AllocationTechnicianIsInternal": false,
                            "Charges": [],
                            "CreatedOn": moment("2014-10-10T09:04:41.755Z"),
                            "ItemDeliveredOn": moment("2013-10-20T23:00:00.000Z"),
                            "ItemNumber": "106853",
                            "Manufacturer": "SONY",
                            "PaymentBalance": null,
                            "ProductLevel_1": "PCE",
                            "ProductLevel_2": "1",
                            "ProductLevel_3": "106",
                            "ResolutionDelivererToCharge": "",
                            "ResolutionSupplierToCharge": "",
                            "StockItem": {
                                "CostPrice": 616.29
                            }
                        },
                        "MasterData": {
                            "SupplierCostMatrix": null,
                            "ServiceSuppliers": masterData_serviceSuppliers,
                            "Settings": masterData_settings,
                            "PartsCostMatrix": masterData_partsCostMatrix_Sony,
                            "LabourCostMatrix": [
                                masterData_labourCostMatrix_AdmiralObj,
                                masterData_labourCostMatrix_SonyObj
                            ]
                        }
                    };

                    var beforeEvaluate = DTUtils.getClonedMockObj(mock);

                    jsonLoader.srChargeDt.evaluate(mock);

                    expect(beforeEvaluate).not.toEqual(mock);

                    // Check Parts Price - expected: 27.90
                    var p1 = DTUtils.getAllPartsPrice(mock.serviceRequest.Parts);
                    expect(p1).not.toBeWithinRange(0, 27.89);
                    expect(p1).toBeWithinRange(27.90, 27.90);
                    expect(p1).not.toBeWithinRange(27.91, 1000000);

                    // Total Parts, Check 80% Markup -> from 15.50 to 27.90
                    var c1 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs');
                    expect(c1).not.toBeWithinRange(0, 27.89);
                    expect(c1).toBeWithinRange(27.90, 27.90);
                    expect(c1).not.toBeWithinRange(27.91, 1000000);

                    // Check parts charged to Internal - expected: 27.90
                    var c2 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'Internal');
                    expect(c2).not.toBeWithinRange(0, 27.89);
                    expect(c2).toBeWithinRange(27.90, 27.90);
                    expect(c2).not.toBeWithinRange(27.91, 1000000);

                    //Check no parts charged to Supplier - expected: 0
                    var c3= DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'Supplier');
                    expect(c3).not.toBeWithinRange(1, 1000000);
                    expect(c3).toBeWithinRange(0, 0);

                    // Check Labour Cost - expected: 65
                    expect(mock.serviceRequest.ResolutionLabourCost).toBeWithinRange(65, 65);
                    expect(mock.serviceRequest.DepositFromMatrix).toBeWithinRange(65, 65);

                    // Is External Technician
                    expect(mock.serviceRequest.AllocationTechnicianIsInternal).toBeFalse();

                    // Labour covered by Internal - expected: 65
                    var c4 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour', 'Internal');
                    expect(c4).not.toBeWithinRange(0, 64);
                    expect(c4).toBeWithinRange(65, 65);
                    expect(c4).not.toBeWithinRange(66, 1000000);

                    // Check no Labour charged to Supplier
                    var c5 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour', 'Supplier');
                    expect(c5).not.toBeWithinRange(1, 1000000);
                    expect(c5).toBeWithinRange(0, 0);

                    //Total Labour - expected: 65
                    var c6 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour');
                    expect(c6).not.toBeWithinRange(0, 64);
                    expect(c6).toBeWithinRange(65, 65);
                    expect(c6).not.toBeWithinRange(66, 1000000);

                });

                it('Scenario 21 ---> Primary Charge Internal, Internal Technician', function () {

                    var mock = {
                        "settingDepositRequiredAmount": false,
                        "serviceRequest": {
                            "WarrantyLength": 0,
                            "WarrantyContractNo": null,
                            "Type": "SI",
                            "ResolutionTransportCost": null,
                            "ResolutionPrimaryCharge": "Internal",
                            "ResolutionLabourCost": 0,
                            "ResolutionAdditionalCost": null,
                            "RepairType": "Assessment",
                            "ReplacementIssued": true,
                            "Parts": [],
                            "NoCostMatrixData": true,
                            "ManufacturerWarrantyLength": 0,
                            "ManufacturerWarrantyContractNo": "Man001",
                            "HistoryCharges": [],
                            "DepositRequired": 0,
                            "DepositFromMatrix": 0,
                            "DepositAuthorised": false,
                            "AllocationTechnicianIsInternal": true,
                            "Charges": [],
                            "CreatedOn": moment("2014-10-10T09:54:00.000Z"),
                            "ItemDeliveredOn": moment("2014-07-13T23:00:00.000Z"),
                            "ItemNumber": "108730",
                            "Manufacturer": "SONY",
                            "PaymentBalance": null,
                            "ProductLevel_1": "PCE",
                            "ProductLevel_2": "1",
                            "ProductLevel_3": "108",
                            "ResolutionDelivererToCharge": "",
                            "ResolutionSupplierToCharge": "",
                            "StockItem": {
                                "CostPrice": 1330.15
                            }
                        },
                        "MasterData": {
                            "SupplierCostMatrix": null,
                            "ServiceSuppliers": masterData_serviceSuppliers,
                            "Settings": masterData_settings,
                            "PartsCostMatrix": masterData_partsCostMatrix_Sony,
                            "LabourCostMatrix": [
                                masterData_labourCostMatrix_AdmiralObj,
                                masterData_labourCostMatrix_SonyObj
                            ]
                        },
                        "isItemBer": false
                    };

                    var beforeEvaluate = DTUtils.getClonedMockObj(mock);

                    jsonLoader.srChargeDt.evaluate(mock);

                    expect(beforeEvaluate).not.toEqual(mock);

                    // Total Parts, should be cost price of the item - expected: 1330.15
                    var c1 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs');
                    expect(c1).not.toBeWithinRange(0, 1330.14);
                    expect(c1).toBeWithinRange(1330.15, 1330.15);
                    expect(c1).not.toBeWithinRange(1330.16, 1000000);

                    // Check parts charged to Internal - expected: 1330.15
                    var c2 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'Internal');
                    expect(c2).not.toBeWithinRange(0, 1330.14);
                    expect(c2).toBeWithinRange(1330.15, 1330.15);
                    expect(c2).not.toBeWithinRange(1330.16, 1000000);

                    //Check no parts charged to Supplier - expected: 0
                    var c3= DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'Supplier');
                    expect(c3).not.toBeWithinRange(1, 1000000);
                    expect(c3).toBeWithinRange(0, 0);

                    // Check Labour Cost - expected: 0
                    expect(mock.serviceRequest.ResolutionLabourCost).toBeWithinRange(0, 0);
                    expect(mock.serviceRequest.DepositFromMatrix).toBeWithinRange(0, 0);

                    // Is Internal Technician
                    expect(mock.serviceRequest.AllocationTechnicianIsInternal).toBeTrue();

                    // Check Labour total - expected: 0
                    var c4 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour');
                    expect(c4).not.toBeWithinRange(1, 1000000);
                    expect(c4).toBeWithinRange(0, 0);

                });

                it('Scenario 22 ---> Manufacturer Warranty, BER, Primary Charge Supplier/FYW, External Technician', function () {

                    var mock = {
                        "serviceRequest": {
                            "WarrantyLength": 36,
                            "WarrantyContractNo": "12203496",
                            "Type": "SI",
                            "ResolutionTransportCost": null,
                            "ResolutionPrimaryCharge": "Supplier",
                            "ResolutionLabourCost": 0,
                            "ResolutionAdditionalCost": null,
                            "RepairType": "Major",
                            "ReplacementIssued": true,
                            "Parts": [],
                            "NoCostMatrixData": false,
                            "ManufacturerWarrantyLength": 12,
                            "ManufacturerWarrantyContractNo": "12203496M",
                            "HistoryCharges": [
                                {
                                    "CustomerId": null,
                                    "Label": null,
                                    "ChargeType": "Supplier",
                                    "ItemNo": null,
                                    "Account": "SONY",
                                    "Value": 0,
                                    "Tax": 0,
                                    "RequestId": 99251
                                },
                                {
                                    "CustomerId": null,
                                    "Label": null,
                                    "ChargeType": "Supplier",
                                    "ItemNo": null,
                                    "Account": "SONY",
                                    "Value": 1600,
                                    "Tax": 0,
                                    "RequestId": 99251
                                },
                                {
                                    "CustomerId": null,
                                    "Label": null,
                                    "ChargeType": "Supplier",
                                    "ItemNo": null,
                                    "Account": "SONY",
                                    "Value": 65,
                                    "Tax": 0,
                                    "RequestId": 99251
                                },
                                {
                                    "CustomerId": null,
                                    "Label": null,
                                    "ChargeType": "FYW",
                                    "ItemNo": null,
                                    "Account": "FYW",
                                    "Value": 0,
                                    "Tax": 0,
                                    "RequestId": 99251
                                },
                                {
                                    "CustomerId": null,
                                    "Label": null,
                                    "ChargeType": "FYW",
                                    "ItemNo": null,
                                    "Account": "FYW",
                                    "Value": 0,
                                    "Tax": 0,
                                    "RequestId": 99251
                                }
                            ],
                            "DepositRequired": 0,
                            "DepositFromMatrix": 0,
                            "DepositAuthorised": false,
                            "AllocationTechnicianIsInternal": false,
                            "Charges": [],
                            "CreatedOn": moment("2014-10-13T10:29:10.514Z"),
                            "ItemDeliveredOn": moment("2013-11-09T00:00:00.000Z"),
                            "ItemNumber": "106853",
                            "Manufacturer": "SONY",
                            "PaymentBalance": null,
                            "ProductLevel_1": "PCE",
                            "ProductLevel_2": "1",
                            "ProductLevel_3": "106",
                            "ResolutionDelivererToCharge": "",
                            "ResolutionSupplierToCharge": "SONY",
                            "StockItem": {
                                "CostPrice": 616.29
                            }
                        },
                        "MasterData": {
                            "SupplierCostMatrix": masterData_supplierCostMatrix_A,
                            "ServiceSuppliers": masterData_serviceSuppliers,
                            "Settings": masterData_settings,
                            "PartsCostMatrix": masterData_partsCostMatrix_Sony,
                            "LabourCostMatrix": [
                                masterData_labourCostMatrix_AdmiralObj,
                                masterData_labourCostMatrix_SonyObj
                            ]
                        },
                        "isItemBer": true
                    };

                    var beforeEvaluate = DTUtils.getClonedMockObj(mock);

                    jsonLoader.srChargeDt.evaluate(mock);

                    expect(beforeEvaluate).not.toEqual(mock);

                    // Total Parts Cosacs - expected: 616.29
                    var c1 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs');
                    expect(c1).not.toBeWithinRange(0, 616.28);
                    expect(c1).toBeWithinRange(616.29, 616.29);
                    expect(c1).not.toBeWithinRange(616.30, 1000000);

                    // Parts Cosacs charged to Supplier - expected: 616.29
                    var c2 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'Supplier');
                    expect(c2).not.toBeWithinRange(0, 616.28);
                    expect(c2).toBeWithinRange(616.29, 616.29);
                    expect(c2).not.toBeWithinRange(616.30, 1000000);

                    // Parts Cosacs charged to FYW - expected: 0
                    var c3 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'FYW');
                    expect(c3).toBeWithinRange(0, 0);
                    expect(c3).not.toBeWithinRange(1, 1000000);

                    // Check Labour Cost - expected: 65
                    expect(mock.serviceRequest.ResolutionLabourCost).toBeWithinRange(65, 65);
                    expect(mock.serviceRequest.DepositFromMatrix).toBeWithinRange(65, 65);

                    // Is External Technician
                    expect(mock.serviceRequest.AllocationTechnicianIsInternal).toBeFalse();

                    // Check Labour & Additional charged to Supplier 15% of 65 - expected: 9.75
                    var c4 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional', 'Supplier');
                    expect(c4).not.toBeWithinRange(0, 9.74);
                    expect(c4).toBeWithinRange(9.75, 9.75);
                    expect(c4).not.toBeWithinRange(9.76, 1000000);

                    // Check Labour & Additional remaining charged to FYW - expected: 55.25
                    var c5 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional', 'FYW');
                    expect(c5).not.toBeWithinRange(0, 55.24);
                    expect(c5).toBeWithinRange(55.25, 55.25);
                    expect(c5).not.toBeWithinRange(55.26, 1000000);

                    // Check total Labour & Additional is 65
                    var c6 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional');
                    expect(c6).not.toBeWithinRange(0, 64);
                    expect(c6).toBeWithinRange(65, 65);
                    expect(c6).not.toBeWithinRange(66, 1000000);

                });

                it('Scenario 23 ---> Manufacturer Warranty, BER, Primary Charge FYW, External Technician', function () {

                    var mock = {
                        "serviceRequest": {
                            "WarrantyLength": 24,
                            "WarrantyContractNo": "77811668",
                            "Type": "SI",
                            "ResolutionTransportCost": null,
                            "ResolutionPrimaryCharge": "Unicomer Warranty",
                            "ResolutionLabourCost": 0,
                            "ResolutionAdditionalCost": null,
                            "RepairType": "Major",
                            "ReplacementIssued": true,
                            "Parts": [],
                            "NoCostMatrixData": false,
                            "ManufacturerWarrantyLength": 12,
                            "ManufacturerWarrantyContractNo": "77811668M",
                            "HistoryCharges": [
                                {
                                    "CustomerId": null,
                                    "Label": null,
                                    "ChargeType": "Internal",
                                    "ItemNo": null,
                                    "Account": "779500001810",
                                    "Value": 275.04,
                                    "Tax": 34.38,
                                    "RequestId": 94502
                                },
                                {
                                    "CustomerId": null,
                                    "Label": null,
                                    "ChargeType": "Internal",
                                    "ItemNo": null,
                                    "Account": "779500001810",
                                    "Value": 26.67,
                                    "Tax": 3.33,
                                    "RequestId": 94502
                                },
                                {
                                    "CustomerId": null,
                                    "Label": null,
                                    "ChargeType": "Supplier",
                                    "ItemNo": null,
                                    "Account": "SONY",
                                    "Value": 0,
                                    "Tax": 0,
                                    "RequestId": 99300
                                },
                                {
                                    "CustomerId": null,
                                    "Label": null,
                                    "ChargeType": "Supplier",
                                    "ItemNo": null,
                                    "Account": "SONY",
                                    "Value": 160,
                                    "Tax": 0,
                                    "RequestId": 99300
                                },
                                {
                                    "CustomerId": null,
                                    "Label": null,
                                    "ChargeType": "Supplier",
                                    "ItemNo": null,
                                    "Account": "SONY",
                                    "Value": 9.75,
                                    "Tax": 0,
                                    "RequestId": 99300
                                },
                                {
                                    "CustomerId": null,
                                    "Label": null,
                                    "ChargeType": "FYW",
                                    "ItemNo": null,
                                    "Account": "FYW",
                                    "Value": 0,
                                    "Tax": 0,
                                    "RequestId": 99300
                                },
                                {
                                    "CustomerId": null,
                                    "Label": null,
                                    "ChargeType": "FYW",
                                    "ItemNo": null,
                                    "Account": "FYW",
                                    "Value": 1440,
                                    "Tax": 0,
                                    "RequestId": 99300
                                },
                                {
                                    "CustomerId": null,
                                    "Label": null,
                                    "ChargeType": "FYW",
                                    "ItemNo": null,
                                    "Account": "FYW",
                                    "Value": 55.25,
                                    "Tax": 0,
                                    "RequestId": 99300
                                }
                            ],
                            "DepositRequired": 0,
                            "DepositFromMatrix": 0,
                            "DepositAuthorised": false,
                            "AllocationTechnicianIsInternal": false,
                            "Charges": [],
                            "CreatedOn": moment("2014-10-13T11:25:49.015Z"),
                            "ItemDeliveredOn": moment("2013-11-09T00:00:00.000Z"),
                            "ItemNumber": "202943",
                            "Manufacturer": "SONY",
                            "PaymentBalance": null,
                            "ProductLevel_1": "PCE",
                            "ProductLevel_2": "2",
                            "ProductLevel_3": "202",
                            "ResolutionDelivererToCharge": "",
                            "ResolutionSupplierToCharge": "",
                            "StockItem": {
                                "CostPrice": 901.34
                            }
                        },
                        "MasterData": {
                            "SupplierCostMatrix": null,
                            "ServiceSuppliers": masterData_serviceSuppliers,
                            "Settings": masterData_settings,
                            "PartsCostMatrix": masterData_partsCostMatrix_Sony,
                            "LabourCostMatrix": [
                                masterData_labourCostMatrix_AdmiralObj,
                                masterData_labourCostMatrix_SonyObj
                            ]
                        },
                        "isItemBer": true
                    };

                    var beforeEvaluate = DTUtils.getClonedMockObj(mock);

                    jsonLoader.srChargeDt.evaluate(mock);

                    expect(beforeEvaluate).not.toEqual(mock);

                    // Total Parts Cosacs - expected: 901.34
                    var c1 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs');
                    expect(c1).not.toBeWithinRange(0, 901.33);
                    expect(c1).toBeWithinRange(901.34, 901.34);
                    expect(c1).not.toBeWithinRange(901.35, 1000000);

                    // Parts Cosacs charged to FYW - expected: 901.34
                    var c2 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'FYW');
                    expect(c2).not.toBeWithinRange(0, 901.33);
                    expect(c2).toBeWithinRange(901.34, 901.34);
                    expect(c2).not.toBeWithinRange(901.35, 1000000);

                    // Check Labour Cost - expected: 65
                    expect(mock.serviceRequest.ResolutionLabourCost).toBeWithinRange(65, 65);
                    expect(mock.serviceRequest.DepositFromMatrix).toBeWithinRange(65, 65);

                    // Is External Technician
                    expect(mock.serviceRequest.AllocationTechnicianIsInternal).toBeFalse();

                    // Check Labour charged to FYW - expected: 65
                    var c4 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour', 'FYW');
                    expect(c4).not.toBeWithinRange(0, 64);
                    expect(c4).toBeWithinRange(65, 65);
                    expect(c4).not.toBeWithinRange(66, 1000000);

                    // Check total Labour - expected: 65
                    var c5 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour');
                    expect(c5).not.toBeWithinRange(0, 64);
                    expect(c5).toBeWithinRange(65, 65);
                    expect(c5).not.toBeWithinRange(66, 1000000);
                });

                it('Scenario 24 ---> Extended Warranty, BER, Primary Charge EW', function () {

                    var mock = {
                        "serviceRequest": {
                            "WarrantyLength": 36,
                            "WarrantyContractNo": "780104162",
                            "Type": "SI",
                            "ResolutionTransportCost": null,
                            "ResolutionPrimaryCharge": "EW",
                            "ResolutionLabourCost": 0,
                            "ResolutionAdditionalCost": null,
                            "RepairType": "Assessment",
                            "ReplacementIssued": true,
                            "Parts": [],
                            "NoCostMatrixData": true,
                            "ManufacturerWarrantyLength": 12,
                            "ManufacturerWarrantyContractNo": "780104162M",
                            "HistoryCharges": [
                                {
                                    "CustomerId": null,
                                    "Label": null,
                                    "ChargeType": "EW",
                                    "ItemNo": null,
                                    "Account": null,
                                    "Value": 0,
                                    "Tax": 0,
                                    "RequestId": 99400
                                },
                                {
                                    "CustomerId": null,
                                    "Label": null,
                                    "ChargeType": "EW",
                                    "ItemNo": null,
                                    "Account": null,
                                    "Value": 630,
                                    "Tax": 0,
                                    "RequestId": 99400
                                },
                                {
                                    "CustomerId": null,
                                    "Label": null,
                                    "ChargeType": "EW",
                                    "ItemNo": null,
                                    "Account": null,
                                    "Value": 40,
                                    "Tax": 0,
                                    "RequestId": 99400
                                },
                                {
                                    "CustomerId": null,
                                    "Label": null,
                                    "ChargeType": "FYW",
                                    "ItemNo": null,
                                    "Account": "FYW",
                                    "Value": 25,
                                    "Tax": 0,
                                    "RequestId": 99400
                                }
                            ],
                            "DepositRequired": 0,
                            "DepositFromMatrix": 0,
                            "DepositAuthorised": false,
                            "AllocationTechnicianIsInternal": false,
                            "Charges": [],
                            "CreatedOn": moment("2014-10-13T13:44:16.684Z"),
                            "ItemDeliveredOn": moment("2013-10-11T23:00:00.000Z"),
                            "ItemNumber": "106856",
                            "Manufacturer": "SONY",
                            "PaymentBalance": null,
                            "ProductLevel_1": "PCE",
                            "ProductLevel_2": "1",
                            "ProductLevel_3": "106",
                            "ResolutionDelivererToCharge": "",
                            "ResolutionSupplierToCharge": "",
                            "StockItem": {
                                "CostPrice": 887.67
                            }
                        },
                        "MasterData": {
                            "SupplierCostMatrix": null,
                            "ServiceSuppliers": masterData_serviceSuppliers,
                            "Settings": masterData_settings,
                            "PartsCostMatrix": masterData_partsCostMatrix_Sony,
                            "LabourCostMatrix": [
                                masterData_labourCostMatrix_AdmiralObj,
                                masterData_labourCostMatrix_SonyObj
                            ]
                        },
                        "isItemBer": true
                    };


                    var beforeEvaluate = DTUtils.getClonedMockObj(mock);

                    jsonLoader.srChargeDt.evaluate(mock);

                    expect(beforeEvaluate).not.toEqual(mock);

                    // Total Parts Cosacs - expected: 306.44
                    var c1 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs');
                    expect(c1).not.toBeWithinRange(0, 306.43);
                    expect(c1).toBeWithinRange(306.435, 306.440);
                    expect(c1).not.toBeWithinRange(306.45, 1000000);

                    // Parts charged to EW - expected: 306.44
                    // BER Markup = 10%
                    // Cost Price of item + markup = 976.43 - 670 (Previous Repair Total to EW)
                    var c2 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'EW');
                    expect(c2).not.toBeWithinRange(0, 306.43);
                    expect(c2).toBeWithinRange(306.435, 306.440);
                    expect(c2).not.toBeWithinRange(306.45, 1000000);

                    // Check no parts charged to Supplier - expected: 0
                    var c3 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'Supplier');
                    expect(c3).toBeWithinRange(0, 0);
                    expect(c3).not.toBeWithinRange(1, 1000000);

                    // Is External Technician
                    expect(mock.serviceRequest.AllocationTechnicianIsInternal).toBeFalse();

                });

                it('Scenario 29 ---> Primary Charge Deliverer, External Technician', function () {

                    var mock = {
                        "serviceRequest": {
                            "WarrantyLength": 24,
                            "WarrantyContractNo": "12109945",
                            "Type": "SI",
                            "ResolutionTransportCost": null,
                            "ResolutionPrimaryCharge": "Deliverer",
                            "ResolutionLabourCost": 0,
                            "ResolutionAdditionalCost": null,
                            "RepairType": "Major",
                            "ReplacementIssued": null,
                            "Parts": [
                                {
                                    "number": "712603",
                                    "Source": "Internal",
                                    "quantity": 1,
                                    "CostPrice": 10,
                                    "CashPrice": 15,
                                    "price": 10,
                                    "description": "LG CABINET ASSY",
                                    "stockbranch": 780,
                                    "stockbranchname": "780 COURTS (BELIZE CITY)",
                                    "$$hashKey": "2XW"
                                }
                            ],
                            "NoCostMatrixData": false,
                            "ManufacturerWarrantyLength": 12,
                            "ManufacturerWarrantyContractNo": "12109945M",
                            "HistoryCharges": [],
                            "DepositRequired": 0,
                            "DepositFromMatrix": 0,
                            "DepositAuthorised": false,
                            "AllocationTechnicianIsInternal": false,
                            "Charges": [],
                            "CreatedOn": moment("2014-10-14T08:58:46.054Z"),
                            "ItemDeliveredOn": moment("2014-04-21T23:00:00.000Z"),
                            "ItemNumber": "202940",
                            "Manufacturer": "SONY",
                            "PaymentBalance": 106.88,
                            "ProductLevel_1": "PCE",
                            "ProductLevel_2": "2",
                            "ProductLevel_3": "20 ",
                            "ResolutionDelivererToCharge": "SONY",
                            "ResolutionSupplierToCharge": "",
                            "StockItem": {
                                "CostPrice": 524.74
                            }
                        },
                        "MasterData": {
                            "SupplierCostMatrix": null,
                            "ServiceSuppliers": masterData_serviceSuppliers,
                            "Settings": masterData_settings,
                            "PartsCostMatrix": masterData_partsCostMatrix_Sony,
                            "LabourCostMatrix": [
                                masterData_labourCostMatrix_AdmiralObj,
                                masterData_labourCostMatrix_SonyObj
                            ]
                        },
                        "isItemBer": false
                    };

                    var beforeEvaluate = DTUtils.getClonedMockObj(mock);

                    jsonLoader.srChargeDt.evaluate(mock);

                    expect(beforeEvaluate).not.toEqual(mock);

                    // Check Parts Price - expected: 10
                    var p1 = DTUtils.getAllPartsPrice(mock.serviceRequest.Parts);
                    expect(p1).not.toBeWithinRange(0, 9);
                    expect(p1).toBeWithinRange(10, 10);
                    expect(p1).not.toBeWithinRange(11, 1000000);

                    // Total Parts Cosacs marked up by 80% from 10 to 18
                    var c1 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs');
                    expect(c1).not.toBeWithinRange(0, 17);
                    expect(c1).toBeWithinRange(18, 18);
                    expect(c1).not.toBeWithinRange(19, 1000000);

                    // Check Parts Cosacs charged to Deliverer - expected: 18
                    var c2 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'Deliverer');
                    expect(c2).not.toBeWithinRange(0, 17);
                    expect(c2).toBeWithinRange(18, 18);
                    expect(c2).not.toBeWithinRange(19, 1000000);

                    // Check Labour Cost - expected: 95
                    expect(mock.serviceRequest.ResolutionLabourCost).toBeWithinRange(95, 95);
                    expect(mock.serviceRequest.DepositFromMatrix).toBeWithinRange(95, 95);

                    // Is External Technician
                    expect(mock.serviceRequest.AllocationTechnicianIsInternal).toBeFalse();

                    // Check Labour charged to Deliverer - expected: 95
                    var c3 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour', 'Deliverer');
                    expect(c3).not.toBeWithinRange(0, 94);
                    expect(c3).toBeWithinRange(95, 95);
                    expect(c3).not.toBeWithinRange(96, 1000000);

                    // Check total Labour - expected: 95
                    var c4 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour');
                    expect(c4).not.toBeWithinRange(0, 94);
                    expect(c4).toBeWithinRange(95, 95);
                    expect(c4).not.toBeWithinRange(96, 1000000);

                });

            });

            describe('(SE) Service External', function () {

                it('Scenario 17 ---> Primary Charge Customer, External Technician', function () {

                    var mock = {
                        "settingDepositRequiredAmount": false,
                        "serviceRequest": {
                            "WarrantyLength": null,
                            "WarrantyContractNo": null,
                            "Type": "SE",
                            "ResolutionTransportCost": null,
                            "ResolutionPrimaryCharge": "Customer",
                            "ResolutionLabourCost": 0,
                            "ResolutionAdditionalCost": 150,
                            "RepairType": "Major",
                            "ReplacementIssued": null,
                            "Parts": [
                                {
                                    "Source": "External",
                                    "quantity": 1,
                                    "CostPrice": 50,
                                    "price": 95,
                                    "description": "External Part",
                                    "$$hashKey": "1YV"
                                },
                                {
                                    "number": "712603",
                                    "Source": "Internal",
                                    "quantity": 1,
                                    "CostPrice": 72.83,
                                    "CashPrice": 106,
                                    "price": 106,
                                    "description": "LG CABINET ASSY",
                                    "stockbranch": 780,
                                    "stockbranchname": "780 COURTS (BELIZE CITY)",
                                    "$$hashKey": "252"
                                }
                            ],
                            "NoCostMatrixData": false,
                            "ManufacturerWarrantyLength": 0,
                            "ManufacturerWarrantyContractNo": null,
                            "HistoryCharges": null,
                            "DepositRequired": 0,
                            "DepositFromMatrix": 0,
                            "DepositAuthorised": false,
                            "AllocationTechnicianIsInternal": false,
                            "Charges": [],
                            "CreatedOn": moment("2014-10-10T13:23:00.406Z"),
                            "ItemDeliveredOn": moment("2011-10-01T00:00:00.000Z"),
                            "ItemNumber": "106080",
                            "Manufacturer": "SONY",
                            "PaymentBalance": null,
                            "ProductLevel_1": "PCE",
                            "ProductLevel_2": "1",
                            "ProductLevel_3": "106",
                            "ResolutionDelivererToCharge": "",
                            "ResolutionSupplierToCharge": "",
                            "StockItem": null
                        },
                        "MasterData": {
                            "SupplierCostMatrix": null,
                            "ServiceSuppliers": masterData_serviceSuppliers,
                            "Settings": {
                                "TaxType": "E",
                                "TaxRate": 12.5,
                                "BerMarkup": 10,
                                "ServiceItemPartsOther": "7L0002",
                                "ServiceItemPartsCourts": "7SPA01"
                            },
                            "PartsCostMatrix": masterData_partsCostMatrix_Sony,
                            "LabourCostMatrix": [
                                masterData_labourCostMatrix_AdmiralObj,
                                masterData_labourCostMatrix_SonyObj
                            ]
                        }
                    };

                    var beforeEvaluate = DTUtils.getClonedMockObj(mock);

                    jsonLoader.srChargeDt.evaluate(mock);

                    expect(beforeEvaluate).not.toEqual(mock);

                    // Check Parts Price - expected: 201
                    var p1 = DTUtils.getAllPartsPrice(mock.serviceRequest.Parts);
                    expect(p1).not.toBeWithinRange(0, 200);
                    expect(p1).toBeWithinRange(201, 201);
                    expect(p1).not.toBeWithinRange(202, 1000000);

                    // Total Parts Cosacs
                    var c1 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs');
                    expect(c1).not.toBeWithinRange(0, 105);
                    expect(c1).toBeWithinRange(106, 106);
                    expect(c1).not.toBeWithinRange(107, 1000000);

                    // Total Parts External 90% markup from 50 to 95 - expected: 95
                    var c2 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts External');
                    expect(c2).not.toBeWithinRange(0, 94);
                    expect(c2).toBeWithinRange(95, 95);
                    expect(c2).not.toBeWithinRange(96, 1000000);

                    // Check Parts Cosacs charged to Customer
                    var c3 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'Customer');
                    expect(c3).not.toBeWithinRange(0, 105);
                    expect(c3).toBeWithinRange(106, 106);
                    expect(c3).not.toBeWithinRange(107, 1000000);

                    // Check Parts External charged to Customer
                    var c4 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts External', 'Customer');
                    expect(c4).not.toBeWithinRange(0, 94);
                    expect(c4).toBeWithinRange(95, 95);
                    expect(c4).not.toBeWithinRange(96, 1000000);

                    //Check no parts charged to Supplier - expected: 0
                    var c5= DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'Supplier');
                    expect(c5).not.toBeWithinRange(1, 1000000);
                    expect(c5).toBeWithinRange(0, 0);

                    var c6= DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts External', 'Supplier');
                    expect(c6).not.toBeWithinRange(1, 1000000);
                    expect(c6).toBeWithinRange(0, 0);

                    // Check Labour Cost - expected: 95
                    expect(mock.serviceRequest.ResolutionLabourCost).toBeWithinRange(95, 95);
                    expect(mock.serviceRequest.DepositFromMatrix).toBeWithinRange(95, 95);

                    // Is External Technician
                    expect(mock.serviceRequest.AllocationTechnicianIsInternal).toBeFalse();

                    // Check Labour charged to Customer
                    var c7 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour', 'Customer');
                    expect(c7).not.toBeWithinRange(0, 94);
                    expect(c7).toBeWithinRange(95, 95);
                    expect(c7).not.toBeWithinRange(96, 1000000);

                    //Check Additional charged to Customer
                    var c8 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Additional', 'Customer');
                    expect(c8).not.toBeWithinRange(0, 149);
                    expect(c8).toBeWithinRange(150, 150);
                    expect(c8).not.toBeWithinRange(151, 1000000);

                    //Check total Labour
                    var c9 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour');
                    expect(c7).not.toBeWithinRange(0, 94);
                    expect(c7).toBeWithinRange(95, 95);
                    expect(c7).not.toBeWithinRange(96, 1000000);

                    //Check total Additional
                    var c10 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Additional');
                    expect(c10).not.toBeWithinRange(0, 149);
                    expect(c10).toBeWithinRange(150, 150);
                    expect(c10).not.toBeWithinRange(151, 1000000);

                });

                it('Scenario 17.1 ---> Primary Charge Customer, External Technician', function () {

                    var mock = {
                        "lskdjfiejfjj": true,
                        "settingDepositRequiredAmount": false,
                        "serviceRequest": {
                            "WarrantyLength": null,
                            "WarrantyContractNo": null,
                            "Type": "SE",
                            "ResolutionTransportCost": null,
                            "ResolutionPrimaryCharge": "Customer",
                            "ResolutionLabourCost": 0,
                            "ResolutionAdditionalCost": 150,
                            "RepairType": "Major",
                            "ReplacementIssued": null,
                            "Parts": [
                                {
                                    "Source": "External",
                                    "quantity": 1,
                                    "CostPrice": 50,
                                    "price": 95,
                                    "description": "External Part",
                                    "$$hashKey": "1YV"
                                },
                                {
                                    "number": "712603",
                                    "Source": "Internal",
                                    "quantity": 1,
                                    "CostPrice": 72.83,
                                    "CashPrice": 106,
                                    "price": 106,
                                    "description": "LG CABINET ASSY",
                                    "stockbranch": 780,
                                    "stockbranchname": "780 COURTS (BELIZE CITY)",
                                    "$$hashKey": "252"
                                }
                            ],
                            "NoCostMatrixData": false,
                            "ManufacturerWarrantyLength": 0,
                            "ManufacturerWarrantyContractNo": null,
                            "HistoryCharges": null,
                            "DepositRequired": 0,
                            "DepositFromMatrix": 0,
                            "DepositAuthorised": false,
                            "AllocationTechnicianIsInternal": false,
                            "Charges": [],
                            "CreatedOn": moment("2014-10-10T13:23:00.406Z"),
                            "ItemDeliveredOn": moment("2011-10-01T00:00:00.000Z"),
                            "ItemNumber": "106080",
                            "Manufacturer": "SONY",
                            "PaymentBalance": null,
                            "ProductLevel_1": "PCE",
                            "ProductLevel_2": "1",
                            "ProductLevel_3": "106",
                            "ResolutionDelivererToCharge": "",
                            "ResolutionSupplierToCharge": "",
                            "StockItem": null
                        },
                        "MasterData": {
                            "SupplierCostMatrix": null,
                            "ServiceSuppliers": masterData_serviceSuppliers,
                            "Settings": masterData_settings_inclusive,
                            "PartsCostMatrix": masterData_partsCostMatrix_Sony,
                            "LabourCostMatrix": [
                                masterData_labourCostMatrix_AdmiralObj,
                                masterData_labourCostMatrix_SonyObj
                            ]
                        }
                    };

                    var beforeEvaluate = DTUtils.getClonedMockObj(mock);

                    jsonLoader.srChargeDt.evaluate(mock);

                    expect(beforeEvaluate).not.toEqual(mock);

                    // Check Parts Price - expected: 201
                    var p1 = DTUtils.getAllPartsPrice(mock.serviceRequest.Parts);
                    expect(p1).not.toBeWithinRange(0, 200);
                    expect(p1).toBeWithinRange(201, 201);
                    expect(p1).not.toBeWithinRange(202, 1000000);

                    // Total Parts Cosacs
                    var c1 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs');
                    expect(c1).not.toBeWithinRange(0, 105);
                    expect(c1).toBeWithinRange(106, 106);
                    expect(c1).not.toBeWithinRange(107, 1000000);

                    // Total Parts External 90% markup from 50 to 95 - expected: 95
                    var c2 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts External');
                    expect(c2).not.toBeWithinRange(0, 94);
                    expect(c2).toBeWithinRange(95, 95);
                    expect(c2).not.toBeWithinRange(96, 1000000);

                    // Check Parts Cosacs charged to Customer
                    var c3 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'Customer');
                    expect(c3).not.toBeWithinRange(0, 105);
                    expect(c3).toBeWithinRange(106, 106);
                    expect(c3).not.toBeWithinRange(107, 1000000);

                    // Check Parts External charged to Customer
                    var c4 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts External', 'Customer');
                    expect(c4).not.toBeWithinRange(0, 94);
                    expect(c4).toBeWithinRange(95, 95);
                    expect(c4).not.toBeWithinRange(96, 1000000);

                    //Check no parts charged to Supplier - expected: 0
                    var c5= DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'Supplier');
                    expect(c5).not.toBeWithinRange(1, 1000000);
                    expect(c5).toBeWithinRange(0, 0);

                    var c6= DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts External', 'Supplier');
                    expect(c6).not.toBeWithinRange(1, 1000000);
                    expect(c6).toBeWithinRange(0, 0);

                    // Check Labour Cost - expected: 95
                    expect(mock.serviceRequest.ResolutionLabourCost).toBeWithinRange(95, 95);
                    expect(mock.serviceRequest.DepositFromMatrix).toBeWithinRange(95, 95);

                    // Is External Technician
                    expect(mock.serviceRequest.AllocationTechnicianIsInternal).toBeFalse();

                    // Check Labour charged to Customer
                    var c7 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour', 'Customer');
                    expect(c7).not.toBeWithinRange(0, 94);
                    expect(c7).toBeWithinRange(95, 95);
                    expect(c7).not.toBeWithinRange(96, 1000000);

                    //Check Additional charged to Customer
                    var c8 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Additional', 'Customer');
                    expect(c8).not.toBeWithinRange(0, 149);
                    expect(c8).toBeWithinRange(150, 150);
                    expect(c8).not.toBeWithinRange(151, 1000000);

                    //Check total Labour
                    var c9 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour');
                    expect(c7).not.toBeWithinRange(0, 94);
                    expect(c7).toBeWithinRange(95, 95);
                    expect(c7).not.toBeWithinRange(96, 1000000);

                    //Check total Additional
                    var c10 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Additional');
                    expect(c10).not.toBeWithinRange(0, 149);
                    expect(c10).toBeWithinRange(150, 150);
                    expect(c10).not.toBeWithinRange(151, 1000000);

                });


            });

            describe('(II) Internal Installation', function () {

                it('Scenario 25 ---> Primary Charge to is Installation Charge Electrical, Internal Technician', function () {

                    var mock = {
                        "serviceRequest": {
                            "WarrantyLength": null,
                            "WarrantyContractNo": null,
                            "Type": "II",
                            "ResolutionTransportCost": null,
                            "ResolutionPrimaryCharge": "Installation Charge Electrical",
                            "ResolutionLabourCost": 0,
                            "ResolutionAdditionalCost": 20,
                            "RepairType": "",
                            "ReplacementIssued": null,
                            "Parts": [
                                {
                                    "number": "712603",
                                    "Source": "Internal",
                                    "quantity": 1,
                                    "CostPrice": 10,
                                    "CashPrice": 15,
                                    "price": 0,
                                    "description": "LG CABINET ASSY",
                                    "stockbranch": 780,
                                    "stockbranchname": "780 COURTS (BELIZE CITY)",
                                    "$$hashKey": "1UZ",
                                    "quantityPerCostPriceDisplayInfo": 0
                                }
                            ],
                            "NoCostMatrixData": true,
                            "ManufacturerWarrantyLength": 0,
                            "ManufacturerWarrantyContractNo": null,
                            "HistoryCharges": [],
                            "DepositRequired": null,
                            "DepositFromMatrix": 0,
                            "DepositAuthorised": false,
                            "AllocationTechnicianIsInternal": true,
                            "Charges": [],
                            "CreatedOn": moment("2014-10-08T07:19:00.000Z"),
                            "ItemDeliveredOn": null,
                            "ItemNumber": "106123",
                            "Manufacturer": "SONY",
                            "PaymentBalance": null,
                            "ProductLevel_1": "PCE",
                            "ProductLevel_2": "1",
                            "ProductLevel_3": "106",
                            "ResolutionDelivererToCharge": "",
                            "ResolutionSupplierToCharge": "",
                            "StockItem": {
                                "CostPrice": 1021.84
                            }
                        },
                        "MasterData": {
                            "SupplierCostMatrix": null,
                            "ServiceSuppliers": masterData_serviceSuppliers,
                            "Settings": masterData_settings,
                            "PartsCostMatrix": [],
                            "LabourCostMatrix": [
                                masterData_labourCostMatrix_AdmiralObj
                            ]
                        }
                    };

                    var beforeEvaluate = DTUtils.getClonedMockObj(mock);

                    jsonLoader.srChargeDt.evaluate(mock);

                    expect(beforeEvaluate).not.toEqual(mock);

                    // Parts Price - expected: 10.00
                    var p1 = DTUtils.getAllPartsPrice(mock.serviceRequest.Parts);
                    expect(p1).not.toBeWithinRange(0, 9);
                    expect(p1).toBeWithinRange(10, 10);
                    expect(p1).not.toBeWithinRange(11, 1000000);

                    // Parts charge to Installation Charge Electrical - expected: 10
                    var c1 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'Installation Charge Electrical');
                    expect(c1).not.toBeWithinRange(0, 9);
                    expect(c1).toBeWithinRange(10, 10);
                    expect(c1).not.toBeWithinRange(11, 1000000);

                    // Total Parts charge - expected: 10
                    var c2 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs');
                    expect(c2).not.toBeWithinRange(0, 9);
                    expect(c2).toBeWithinRange(10, 10);
                    expect(c2).not.toBeWithinRange(11, 1000000);

                    // Labour & Additional,Installation Charge Electrical - expected: 20
                    var c3 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional', 'Installation Charge Electrical');
                    expect(c3).not.toBeWithinRange(0, 19);
                    expect(c3).toBeWithinRange(20, 20);
                    expect(c3).not.toBeWithinRange(21, 1000000);

                    //Total Labour & Additional - expected: 20
                    var c4 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional');
                    expect(c4).not.toBeWithinRange(0, 19);
                    expect(c4).toBeWithinRange(20, 20);
                    expect(c4).not.toBeWithinRange(21, 1000000);

                    // Is Internal Technician
                    expect(mock.serviceRequest.AllocationTechnicianIsInternal).toBeTrue();
                });

                it('Scenario 26 ---> Primary Charge Installation Charge Electrical, External Technician', function () {

                    var mock = {
                        "serviceRequest": {
                            "WarrantyLength": null,
                            "WarrantyContractNo": null,
                            "Type": "II",
                            "ResolutionTransportCost": null,
                            "ResolutionPrimaryCharge": "Installation Charge Electrical",
                            "ResolutionLabourCost": 0,
                            "ResolutionAdditionalCost": 120,
                            "RepairType": "Major",
                            "ReplacementIssued": null,
                            "Parts": [
                                {
                                    "Source": "External",
                                    "quantity": 1,
                                    "CostPrice": 20,
                                    "price": 20,
                                    "description": "tube",
                                    "$$hashKey": "0IH",
                                    "quantityPerCostPriceDisplayInfo": 0
                                }
                            ],
                            "NoCostMatrixData": true,
                            "ManufacturerWarrantyLength": 0,
                            "ManufacturerWarrantyContractNo": null,
                            "HistoryCharges": [],
                            "DepositRequired": null,
                            "DepositFromMatrix": 0,
                            "DepositAuthorised": false,
                            "AllocationTechnicianIsInternal": false,
                            "Charges": [],
                            "CreatedOn": moment("2014-10-08T09:21:00.000Z"),
                            "ItemDeliveredOn": null,
                            "ItemNumber": "106123",
                            "Manufacturer": "SONY",
                            "PaymentBalance": null,
                            "ProductLevel_1": "PCE",
                            "ProductLevel_2": "1",
                            "ProductLevel_3": "106",
                            "ResolutionDelivererToCharge": "",
                            "ResolutionSupplierToCharge": "",
                            "StockItem": {
                                "CostPrice": 1021.84
                            }
                        },
                        "MasterData": {
                            "SupplierCostMatrix": null,
                            "ServiceSuppliers": masterData_serviceSuppliers,
                            "Settings": masterData_settings,
                            "PartsCostMatrix": [],
                            "LabourCostMatrix": [
                                masterData_labourCostMatrix_AdmiralObj
                            ]
                        }
                    };

                    var beforeEvaluate = DTUtils.getClonedMockObj(mock);

                    jsonLoader.srChargeDt.evaluate(mock);

                    expect(beforeEvaluate).not.toEqual(mock);

                    // Parts Price - expected: 20.00
                    var p1 = DTUtils.getAllPartsPrice(mock.serviceRequest.Parts);
                    expect(p1).not.toBeWithinRange(0, 19);
                    expect(p1).toBeWithinRange(20, 20);
                    expect(p1).not.toBeWithinRange(21, 1000000);

                    // Parts charge to Installation Charge Electrical - expected: 20
                    var c1 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts External', 'Installation Charge Electrical');
                    expect(c1).not.toBeWithinRange(0, 19);
                    expect(c1).toBeWithinRange(20, 20);
                    expect(c1).not.toBeWithinRange(21, 1000000);

                    // Total Parts charge - expected: 20
                    var c2 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts External');
                    expect(c2).not.toBeWithinRange(0, 19);
                    expect(c2).toBeWithinRange(20, 20);
                    expect(c2).not.toBeWithinRange(21, 1000000);

                    // Labour & Additional,Installation Charge Electrical - expected: 120
                    var c3 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional', 'Installation Charge Electrical');
                    expect(c3).not.toBeWithinRange(0, 119);
                    expect(c3).toBeWithinRange(120, 120);
                    expect(c3).not.toBeWithinRange(121, 1000000);

                    //Total Labour & Additional - expected: 120
                    var c4 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour and Additional');
                    expect(c4).not.toBeWithinRange(0, 119);
                    expect(c4).toBeWithinRange(120, 120);
                    expect(c4).not.toBeWithinRange(121, 1000000);

                    // Is Internal Technician
                    expect(mock.serviceRequest.AllocationTechnicianIsInternal).toBeFalse();

                });

            });

            describe('(IE) External Installation', function () {

                it('Scenario 27 ---> Primary Charge Customer, Internal Technician', function () {

                    var mock = {
                        "serviceRequest": {
                            "WarrantyLength": null,
                            "WarrantyContractNo": null,
                            "Type": "IE",
                            "ResolutionTransportCost": null,
                            "ResolutionPrimaryCharge": "Customer",
                            "ResolutionLabourCost": 95,
                            "ResolutionAdditionalCost": 100,
                            "RepairType": "Major",
                            "ReplacementIssued": null,
                            "Parts": [
                                {
                                    "number": "712603",
                                    "Source": "Internal",
                                    "quantity": 1,
                                    "CostPrice": 15.5,
                                    "CashPrice": 25,
                                    "price": 25,
                                    "description": "LG CABINET ASSY",
                                    "stockbranch": 780,
                                    "stockbranchname": "780 COURTS (BELIZE CITY)",
                                    "$$hashKey": "202"
                                }
                            ],
                            "NoCostMatrixData": false,
                            "ManufacturerWarrantyLength": 0,
                            "ManufacturerWarrantyContractNo": null,
                            "HistoryCharges": null,
                            "DepositRequired": null,
                            "DepositFromMatrix": 95,
                            "DepositAuthorised": false,
                            "AllocationTechnicianIsInternal": true,
                            "Charges": [],
                            "CreatedOn": "2014-10-08T10:13:22.756Z",
                            "ItemDeliveredOn": "2014-10-07T00:00:00.000Z",
                            "ItemNumber": "106123",
                            "Manufacturer": "SONY",
                            "PaymentBalance": null,
                            "ProductLevel_1": "PCE",
                            "ProductLevel_2": "1",
                            "ProductLevel_3": "106",
                            "ResolutionDelivererToCharge": "",
                            "ResolutionSupplierToCharge": "",
                            "StockItem": null
                        },
                        "MasterData": {
                            "SupplierCostMatrix": null,
                            "ServiceSuppliers": masterData_serviceSuppliers,
                            "Settings": {
                                "TaxType": "E",
                                "TaxRate": 12.5,
                                "BerMarkup": 10,
                                "ServiceItemPartsOther": "7L0002",
                                "ServiceItemPartsCourts": "7SPA01"
                            },
                            "PartsCostMatrix": [],
                            "LabourCostMatrix": [
                                masterData_labourCostMatrix_AdmiralObj,
                                masterData_labourCostMatrix_SonyObj
                            ]
                        }
                    };

                    var beforeEvaluate = DTUtils.getClonedMockObj(mock);

                    jsonLoader.srChargeDt.evaluate(mock);

                    expect(beforeEvaluate).not.toEqual(mock);

                    // Parts Price - expected: 25.00
                    var p1 = DTUtils.getAllPartsPrice(mock.serviceRequest.Parts);
                    expect(p1).not.toBeWithinRange(0, 24);
                    expect(p1).toBeWithinRange(25, 25);
                    expect(p1).not.toBeWithinRange(26, 1000000);

                    // Parts charge to Customer - expected: 25
                    var c1 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'Customer');
                    expect(c1).not.toBeWithinRange(0, 24);
                    expect(c1).toBeWithinRange(25, 25);
                    expect(c1).not.toBeWithinRange(26, 1000000);

                    // Total Parts charge - expected: 25
                    var c2 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs');
                    expect(c2).not.toBeWithinRange(0, 24);
                    expect(c2).toBeWithinRange(25, 25);
                    expect(c2).not.toBeWithinRange(26, 1000000);

                    // Labour, Customer - expected: 95
                    var c3 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour', 'Customer');
                    expect(c3).not.toBeWithinRange(0, 94);
                    expect(c3).toBeWithinRange(95, 95);
                    expect(c3).not.toBeWithinRange(96, 1000000);

                    //Additional, Customer - expected: 100
                    var c4 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Additional', 'Customer');
                    expect(c4).not.toBeWithinRange(0, 99);
                    expect(c4).toBeWithinRange(100, 100);
                    expect(c4).not.toBeWithinRange(101, 1000000);

                    //Labour + Additional, Customer - expected: 195
                    expect(c3 + c4).not.toBeWithinRange(0, 194);
                    expect(c3 + c4).toBeWithinRange(195, 195);
                    expect(c3 + c4).not.toBeWithinRange(196, 1000000);

                    //Total Labour & Additional - expected: 195
                    var c5 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour');
                    expect(c5).not.toBeWithinRange(0, 94);
                    expect(c5).toBeWithinRange(95, 95);
                    expect(c5).not.toBeWithinRange(96, 1000000);

                    var c6 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Additional');
                    expect(c6).not.toBeWithinRange(0, 99);
                    expect(c6).toBeWithinRange(100, 100);
                    expect(c6).not.toBeWithinRange(101, 1000000);

                    //Total Labour + Additional - expected: 195
                    expect(c5 + c6).not.toBeWithinRange(0, 194);
                    expect(c5 + c6).toBeWithinRange(195, 195);
                    expect(c5 + c6).not.toBeWithinRange(196, 1000000);

                    // Is Internal Technician
                    expect(mock.serviceRequest.AllocationTechnicianIsInternal).toBeTrue();

                    // Check parts, labour, additionsla not charged to supplier
                    var c7 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'Supplier');
                    expect(c7).toBeWithinRange(0, 0);
                    expect(c7).not.toBeWithinRange(1, 1000000);

                    var c8 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour', 'Supplier');
                    expect(c8).toBeWithinRange(0, 0);
                    expect(c8).not.toBeWithinRange(1, 1000000);

                    var c9 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Additional', 'Supplier');
                    expect(c9).toBeWithinRange(0, 0);
                    expect(c9).not.toBeWithinRange(1, 1000000);


                });

                it('Scenario 27.1 ---> Primary Charge Customer, Internal Technician', function () {

                    var mock = {
                        "serviceRequest": {
                            "WarrantyLength": null,
                            "WarrantyContractNo": null,
                            "Type": "IE",
                            "ResolutionTransportCost": null,
                            "ResolutionPrimaryCharge": "Customer",
                            "ResolutionLabourCost": 95,
                            "ResolutionAdditionalCost": 100,
                            "RepairType": "Major",
                            "ReplacementIssued": null,
                            "Parts": [
                                {
                                    "number": "712603",
                                    "Source": "Internal",
                                    "quantity": 1,
                                    "CostPrice": 15.5,
                                    "CashPrice": 25,
                                    "price": 25,
                                    "description": "LG CABINET ASSY",
                                    "stockbranch": 780,
                                    "stockbranchname": "780 COURTS (BELIZE CITY)",
                                    "$$hashKey": "202"
                                }
                            ],
                            "NoCostMatrixData": false,
                            "ManufacturerWarrantyLength": 0,
                            "ManufacturerWarrantyContractNo": null,
                            "HistoryCharges": null,
                            "DepositRequired": null,
                            "DepositFromMatrix": 95,
                            "DepositAuthorised": false,
                            "AllocationTechnicianIsInternal": true,
                            "Charges": [],
                            "CreatedOn": "2014-10-08T10:13:22.756Z",
                            "ItemDeliveredOn": "2014-10-07T00:00:00.000Z",
                            "ItemNumber": "106123",
                            "Manufacturer": "SONY",
                            "PaymentBalance": null,
                            "ProductLevel_1": "PCE",
                            "ProductLevel_2": "1",
                            "ProductLevel_3": "106",
                            "ResolutionDelivererToCharge": "",
                            "ResolutionSupplierToCharge": "",
                            "StockItem": null
                        },
                        "MasterData": {
                            "SupplierCostMatrix": null,
                            "ServiceSuppliers": masterData_serviceSuppliers,
                            "Settings": masterData_settings_inclusive,
                            "PartsCostMatrix": [],
                            "LabourCostMatrix": [
                                masterData_labourCostMatrix_AdmiralObj,
                                masterData_labourCostMatrix_SonyObj
                            ]
                        }
                    };

                    var beforeEvaluate = DTUtils.getClonedMockObj(mock);

                    jsonLoader.srChargeDt.evaluate(mock);

                    expect(beforeEvaluate).not.toEqual(mock);

                    // Parts Price - expected: 25.00
                    var p1 = DTUtils.getAllPartsPrice(mock.serviceRequest.Parts);
                    expect(p1).not.toBeWithinRange(0, 24);
                    expect(p1).toBeWithinRange(25, 25);
                    expect(p1).not.toBeWithinRange(26, 1000000);

                    // Parts charge to Customer - expected: 25
                    var c1 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'Customer');
                    expect(c1).not.toBeWithinRange(0, 24);
                    expect(c1).toBeWithinRange(25, 25);
                    expect(c1).not.toBeWithinRange(26, 1000000);

                    // Total Parts charge - expected: 25
                    var c2 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs');
                    expect(c2).not.toBeWithinRange(0, 24);
                    expect(c2).toBeWithinRange(25, 25);
                    expect(c2).not.toBeWithinRange(26, 1000000);

                    // Labour, Customer - expected: 95
                    var c3 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour', 'Customer');
                    expect(c3).not.toBeWithinRange(0, 94);
                    expect(c3).toBeWithinRange(95, 95);
                    expect(c3).not.toBeWithinRange(96, 1000000);

                    //Additional, Customer - expected: 100
                    var c4 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Additional', 'Customer');
                    expect(c4).not.toBeWithinRange(0, 99);
                    expect(c4).toBeWithinRange(100, 100);
                    expect(c4).not.toBeWithinRange(101, 1000000);

                    //Labour + Additional, Customer - expected: 195
                    expect(c3 + c4).not.toBeWithinRange(0, 194);
                    expect(c3 + c4).toBeWithinRange(195, 195);
                    expect(c3 + c4).not.toBeWithinRange(196, 1000000);

                    //Total Labour & Additional - expected: 195
                    var c5 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour');
                    expect(c5).not.toBeWithinRange(0, 94);
                    expect(c5).toBeWithinRange(95, 95);
                    expect(c5).not.toBeWithinRange(96, 1000000);

                    var c6 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Additional');
                    expect(c6).not.toBeWithinRange(0, 99);
                    expect(c6).toBeWithinRange(100, 100);
                    expect(c6).not.toBeWithinRange(101, 1000000);

                    //Total Labour + Additional - expected: 195
                    expect(c5 + c6).not.toBeWithinRange(0, 194);
                    expect(c5 + c6).toBeWithinRange(195, 195);
                    expect(c5 + c6).not.toBeWithinRange(196, 1000000);

                    // Is Internal Technician
                    expect(mock.serviceRequest.AllocationTechnicianIsInternal).toBeTrue();

                    // Check parts, labour, additionsla not charged to supplier
                    var c7 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'Supplier');
                    expect(c7).toBeWithinRange(0, 0);
                    expect(c7).not.toBeWithinRange(1, 1000000);

                    var c8 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour', 'Supplier');
                    expect(c8).toBeWithinRange(0, 0);
                    expect(c8).not.toBeWithinRange(1, 1000000);

                    var c9 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Additional', 'Supplier');
                    expect(c9).toBeWithinRange(0, 0);
                    expect(c9).not.toBeWithinRange(1, 1000000);


                });

                it('Scenario 28 ---> Primary Charge Customer, External Technician', function () {

                    var mock = {
                        "serviceRequest": {
                            "WarrantyLength": null,
                            "WarrantyContractNo": null,
                            "Type": "IE",
                            "ResolutionTransportCost": null,
                            "ResolutionPrimaryCharge": "Customer",
                            "ResolutionLabourCost": 95,
                            "ResolutionAdditionalCost": 120,
                            "RepairType": "Major",
                            "ReplacementIssued": null,
                            "Parts": [
                                {
                                    "Source": "External",
                                    "quantity": 1,
                                    "CostPrice": 20,
                                    "price": 38,
                                    "description": "External Part",
                                    "$$hashKey": "0IR"
                                },
                                {
                                    "number": "712603",
                                    "Source": "Internal",
                                    "quantity": 1,
                                    "CostPrice": 73.82,
                                    "CashPrice": 106,
                                    "price": 106,
                                    "description": "LG CABINET ASSY",
                                    "stockbranch": 780,
                                    "stockbranchname": "780 COURTS (BELIZE CITY)",
                                    "$$hashKey": "0L6"
                                }
                            ],
                            "NoCostMatrixData": false,
                            "ManufacturerWarrantyLength": 0,
                            "ManufacturerWarrantyContractNo": null,
                            "HistoryCharges": [],
                            "DepositRequired": null,
                            "DepositFromMatrix": 95,
                            "DepositAuthorised": false,
                            "AllocationTechnicianIsInternal": false,
                            "Charges": [],
                            "CreatedOn": moment("2014-10-08T13:57:00.000Z"),
                            "ItemDeliveredOn": moment("2014-10-07T00:00:00.000Z"),
                            "ItemNumber": "106123",
                            "Manufacturer": "SONY",
                            "PaymentBalance": null,
                            "ProductLevel_1": "PCE",
                            "ProductLevel_2": "1",
                            "ProductLevel_3": "106",
                            "ResolutionDelivererToCharge": "",
                            "ResolutionSupplierToCharge": "",
                            "StockItem": {
                                "CostPrice": 1021.84
                            }
                        },
                        "MasterData": {
                            "SupplierCostMatrix": null,
                            "ServiceSuppliers": masterData_serviceSuppliers,
                            "Settings": {
                                "TaxType": "E",
                                "TaxRate": 12.5,
                                "BerMarkup": 10,
                                "ServiceItemPartsOther": "7L0002",
                                "ServiceItemPartsCourts": "7SPA01"
                            },
                            "PartsCostMatrix": masterData_partsCostMatrix_Sony,
                            "LabourCostMatrix": [
                                masterData_labourCostMatrix_AdmiralObj,
                                masterData_labourCostMatrix_SonyObj
                            ]
                        }
                    };

                    var beforeEvaluate = DTUtils.getClonedMockObj(mock);

                    jsonLoader.srChargeDt.evaluate(mock);

                    expect(beforeEvaluate).not.toEqual(mock);

                    // Parts Price (Internal + External) - expected: 144
                    var p1 = DTUtils.getAllPartsPrice(mock.serviceRequest.Parts);
                    expect(p1).not.toBeWithinRange(0, 143);
                    expect(p1).toBeWithinRange(144, 144);
                    expect(p1).not.toBeWithinRange(145, 1000000);

                    // Parts charge (Internal) to Customer - expected: 106
                    var c1 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'Customer');
                    expect(c1).not.toBeWithinRange(0, 105);
                    expect(c1).toBeWithinRange(106, 106);
                    expect(c1).not.toBeWithinRange(107, 1000000);

                    // Parts charge (External) to Customer, 90% markup from 20 - expected: 38
                    var c2 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts External', 'Customer');
                    expect(c2).not.toBeWithinRange(0, 37);
                    expect(c2).toBeWithinRange(38, 38);
                    expect(c2).not.toBeWithinRange(39, 1000000);

                    window.console.log("-----> Val: " + c2);

                    // Total Parts charge (Internal) - expected: 106
                    var c3 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs');
                    expect(c3).not.toBeWithinRange(0, 105);
                    expect(c3).toBeWithinRange(106, 106);
                    expect(c3).not.toBeWithinRange(107, 1000000);

                    // Total Parts charge (External) - expected: 38
                    var c4 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts External');
                    expect(c4).not.toBeWithinRange(0, 37);
                    expect(c4).toBeWithinRange(38, 38);
                    expect(c4).not.toBeWithinRange(39, 1000000);

                    //Total Internal + External Parts - expected: 144
                    expect(c3 + c4).not.toBeWithinRange(0, 143);
                    expect(c3 + c4).toBeWithinRange(144, 144);
                    expect(c3 + c4).not.toBeWithinRange(145, 1000000);

                    // Labour, Customer - expected: 95
                    var c5 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour', 'Customer');
                    expect(c5).not.toBeWithinRange(0, 94);
                    expect(c5).toBeWithinRange(95, 95);
                    expect(c5).not.toBeWithinRange(96, 1000000);

                    //Additional, Customer - expected: 120
                    var c6 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Additional', 'Customer');
                    expect(c6).not.toBeWithinRange(0, 119);
                    expect(c6).toBeWithinRange(120, 120);
                    expect(c6).not.toBeWithinRange(121, 1000000);

                    //Labour + Additional, Customer - expected: 215
                    expect(c5 + c6).not.toBeWithinRange(0, 214);
                    expect(c5 + c6).toBeWithinRange(215, 215);
                    expect(c5 + c6).not.toBeWithinRange(216, 1000000);

                    //Total Labour & Additional - expected: 215
                    var c7 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour');
                    expect(c7).not.toBeWithinRange(0, 94);
                    expect(c7).toBeWithinRange(95, 95);
                    expect(c7).not.toBeWithinRange(96, 1000000);

                    var c8 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Additional');
                    expect(c8).not.toBeWithinRange(0, 119);
                    expect(c8).toBeWithinRange(120, 120);
                    expect(c8).not.toBeWithinRange(121, 1000000);

                    //Total Labour + Additional - expected: 215
                    expect(c7 + c8).not.toBeWithinRange(0, 214);
                    expect(c7 + c8).toBeWithinRange(215, 215);
                    expect(c7 + c8).not.toBeWithinRange(216, 1000000);

                    // Is External Technician
                    expect(mock.serviceRequest.AllocationTechnicianIsInternal).toBeFalse();

                    // Check parts, labour, additional not charged to supplier
                    var c9 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'Supplier');
                    expect(c9).toBeWithinRange(0, 0);
                    expect(c9).not.toBeWithinRange(1, 1000000);

                    var c10 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts External', 'Supplier');
                    expect(c10).toBeWithinRange(0, 0);
                    expect(c10).not.toBeWithinRange(1, 1000000);

                    var c11 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour', 'Supplier');
                    expect(c11).toBeWithinRange(0, 0);
                    expect(c11).not.toBeWithinRange(1, 1000000);

                    var c12 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Additional', 'Supplier');
                    expect(c12).toBeWithinRange(0, 0);
                    expect(c12).not.toBeWithinRange(1, 1000000);

                })

                it('Scenario 28.1 ---> Primary Charge Customer, External Technician', function () {

                    var mock = {
                        "serviceRequest": {
                            "WarrantyLength": null,
                            "WarrantyContractNo": null,
                            "Type": "IE",
                            "ResolutionTransportCost": null,
                            "ResolutionPrimaryCharge": "Customer",
                            "ResolutionLabourCost": 95,
                            "ResolutionAdditionalCost": 120,
                            "RepairType": "Major",
                            "ReplacementIssued": null,
                            "Parts": [
                                {
                                    "Source": "External",
                                    "quantity": 1,
                                    "CostPrice": 20,
                                    "price": 38,
                                    "description": "External Part",
                                    "$$hashKey": "0IR"
                                },
                                {
                                    "number": "712603",
                                    "Source": "Internal",
                                    "quantity": 1,
                                    "CostPrice": 73.82,
                                    "CashPrice": 106,
                                    "price": 106,
                                    "description": "LG CABINET ASSY",
                                    "stockbranch": 780,
                                    "stockbranchname": "780 COURTS (BELIZE CITY)",
                                    "$$hashKey": "0L6"
                                }
                            ],
                            "NoCostMatrixData": false,
                            "ManufacturerWarrantyLength": 0,
                            "ManufacturerWarrantyContractNo": null,
                            "HistoryCharges": [],
                            "DepositRequired": null,
                            "DepositFromMatrix": 95,
                            "DepositAuthorised": false,
                            "AllocationTechnicianIsInternal": false,
                            "Charges": [],
                            "CreatedOn": moment("2014-10-08T13:57:00.000Z"),
                            "ItemDeliveredOn": moment("2014-10-07T00:00:00.000Z"),
                            "ItemNumber": "106123",
                            "Manufacturer": "SONY",
                            "PaymentBalance": null,
                            "ProductLevel_1": "PCE",
                            "ProductLevel_2": "1",
                            "ProductLevel_3": "106",
                            "ResolutionDelivererToCharge": "",
                            "ResolutionSupplierToCharge": "",
                            "StockItem": {
                                "CostPrice": 1021.84
                            }
                        },
                        "MasterData": {
                            "SupplierCostMatrix": null,
                            "ServiceSuppliers": masterData_serviceSuppliers,
                            "Settings": masterData_settings_inclusive,
                            "PartsCostMatrix": masterData_partsCostMatrix_Sony,
                            "LabourCostMatrix": [
                                masterData_labourCostMatrix_AdmiralObj,
                                masterData_labourCostMatrix_SonyObj
                            ]
                        }
                    };

                    var beforeEvaluate = DTUtils.getClonedMockObj(mock);

                    jsonLoader.srChargeDt.evaluate(mock);

                    expect(beforeEvaluate).not.toEqual(mock);

                    // Parts Price (Internal + External) - expected: 144
                    var p1 = DTUtils.getAllPartsPrice(mock.serviceRequest.Parts);
                    expect(p1).not.toBeWithinRange(0, 143);
                    expect(p1).toBeWithinRange(144, 144);
                    expect(p1).not.toBeWithinRange(145, 1000000);

                    // Parts charge (Internal) to Customer - expected: 106
                    var c1 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'Customer');
                    expect(c1).not.toBeWithinRange(0, 105);
                    expect(c1).toBeWithinRange(106, 106);
                    expect(c1).not.toBeWithinRange(107, 1000000);

                    // Parts charge (External) to Customer, 90% markup from 20 - expected: 38
                    var c2 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts External', 'Customer');
                    expect(c2).not.toBeWithinRange(0, 37);
                    expect(c2).toBeWithinRange(38, 38);
                    expect(c2).not.toBeWithinRange(39, 1000000);

                    // Total Parts charge (Internal) - expected: 106
                    var c3 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs');
                    expect(c3).not.toBeWithinRange(0, 105);
                    expect(c3).toBeWithinRange(106, 106);
                    expect(c3).not.toBeWithinRange(107, 1000000);

                    // Total Parts charge (External) - expected: 38
                    var c4 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts External');
                    expect(c4).not.toBeWithinRange(0, 37);
                    expect(c4).toBeWithinRange(38, 38);
                    expect(c4).not.toBeWithinRange(39, 1000000);

                    //Total Internal + External Parts - expected: 144
                    expect(c3 + c4).not.toBeWithinRange(0, 143);
                    expect(c3 + c4).toBeWithinRange(144, 144);
                    expect(c3 + c4).not.toBeWithinRange(145, 1000000);

                    // Labour, Customer - expected: 95
                    var c5 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour', 'Customer');
                    expect(c5).not.toBeWithinRange(0, 94);
                    expect(c5).toBeWithinRange(95, 95);
                    expect(c5).not.toBeWithinRange(96, 1000000);

                    //Additional, Customer - expected: 120
                    var c6 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Additional', 'Customer');
                    expect(c6).not.toBeWithinRange(0, 119);
                    expect(c6).toBeWithinRange(120, 120);
                    expect(c6).not.toBeWithinRange(121, 1000000);

                    //Labour + Additional, Customer - expected: 215
                    expect(c5 + c6).not.toBeWithinRange(0, 214);
                    expect(c5 + c6).toBeWithinRange(215, 215);
                    expect(c5 + c6).not.toBeWithinRange(216, 1000000);

                    //Total Labour & Additional - expected: 215
                    var c7 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour');
                    expect(c7).not.toBeWithinRange(0, 94);
                    expect(c7).toBeWithinRange(95, 95);
                    expect(c7).not.toBeWithinRange(96, 1000000);

                    var c8 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Additional');
                    expect(c8).not.toBeWithinRange(0, 119);
                    expect(c8).toBeWithinRange(120, 120);
                    expect(c8).not.toBeWithinRange(121, 1000000);

                    //Total Labour + Additional - expected: 215
                    expect(c7 + c8).not.toBeWithinRange(0, 214);
                    expect(c7 + c8).toBeWithinRange(215, 215);
                    expect(c7 + c8).not.toBeWithinRange(216, 1000000);

                    // Is External Technician
                    expect(mock.serviceRequest.AllocationTechnicianIsInternal).toBeFalse();

                    // Check parts, labour, additional not charged to supplier
                    var c9 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts Cosacs', 'Supplier');
                    expect(c9).toBeWithinRange(0, 0);
                    expect(c9).not.toBeWithinRange(1, 1000000);

                    var c10 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Parts External', 'Supplier');
                    expect(c10).toBeWithinRange(0, 0);
                    expect(c10).not.toBeWithinRange(1, 1000000);

                    var c11 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Labour', 'Supplier');
                    expect(c11).toBeWithinRange(0, 0);
                    expect(c11).not.toBeWithinRange(1, 1000000);

                    var c12 = DTUtils.getMatrixCharges(mock.serviceRequest.Charges, 'Additional', 'Supplier');
                    expect(c12).toBeWithinRange(0, 0);
                    expect(c12).not.toBeWithinRange(1, 1000000);

                })

            });

        }); //'Decision tables - Charge test scenarios'

    });
