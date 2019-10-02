/*global define, $, window */
define(['pjax', 'underscore', 'angular', 'url', 'moment', 'angularShared/app', 'alert', 'spa', 'jquery.pickList', 'service/stockController',
    'service/paymentsController', 'service/CalendarBase', 'Config/decisionTable',
    'service/serviceRequestDecisionTable', 'config/decisionTableAngular', 'notification', 'authorise',
    'localisation', 'merchandising/shared/directives/hierarchy', 'service/paymentReceipt', 'angular.ui', 'angular-resource', 'lib/select2',
    'affix', 'underscore.string'],

    function (pjax, _, angular, url, moment, app, alert, spa, pickList, stockController, payments, calendarBase, DecisionTable,
        srDecisionTable, decisionTableAngular, notification, authoriseController,
        localisation, hierarchyDirective, paymentReceiptController) {
        'use strict';
        return {
            init: function ($el) {
                var serviceCtrl = function ($scope, $location, $rootScope, xhr, $filter, $attrs, $timeout) {
                    $scope.serviceready = false;
                    $scope.receipt = {};
                    var dtCharge = 'SR.DecisionTable.Charge',
                        dtChargeToAuthorisation = 'SR.DecisionTable.ChargeToAuthorisation',
                        dtStatus = 'SR.DecisionTable.ServiceStatus',
                        dtWorkflow = 'SR.DecisionTable.Workflow';

                    decisionTableAngular.load(xhr, [dtCharge, dtStatus, dtWorkflow, dtChargeToAuthorisation], function (key, dt) {
                        if (key === dtCharge) {
                            $scope.tableCharge = dt;
                        } else if (key === dtChargeToAuthorisation) {
                            $scope.tableChargeToAuthorisation = dt;
                        } else if (key === dtStatus) {
                            $scope.tableServiceStatus = dt;
                        } else if (key === dtWorkflow) {
                            decisionTableAngular.watch($scope, $scope.tableWorkflow = dt);
                        }
                    });

                    var calendar,
                        contacts = null,
                        FoodLoss = null,
                        Parts = null,
                        RequestComments = null,
                        saving = false;

                    $scope.dateFormat = 'dddd DD-MMMM-YYYY HH:mm';
                    $scope.dateFormatDateOnly = 'dddd DD-MMMM-YYYY';
                    $scope.dateFormatShort = 'DD-MMM-YYYY';
                    $scope.dateFormatISO = 'YYYY-MM-DD'; //'Thh:mm:ss.sTZD';
                    $scope.moment = moment;
                    $scope.CustomerSearch = {};
                    $scope.MasterData = {};
                    $scope.CustomerSearch.Type = 'Account';
                    $scope.searchResult = [];
                    $scope.Technician = {};
                    $scope.techSelect = {};
                    $scope.weeks = [];
                    $scope.dialogueCommon = {};
                    $scope.culture = localisation.getSettings();
                    $scope.DefaultStockLocation = $attrs.defaultStockLocation;
                    $scope.serviceRequestCreateFromOtherServiceRequest = false;
                    $scope.resolutionPrimaryChargeChanged = false;
                    $scope.decisionTableActivatedActions = {
                        goodWillReplacement: false,
                        berReplacement: false
                    };
                    // Added by Gurpreet - CR2018-010 - 31/10/18 - Setting of max no. of Jobs & Validation with allocated jobs for a technician.

                    $scope.TechnicianCurrentAllocatedJobs = [];
                    $scope.dialogueTechAllocatedJobs = {};
                    $scope.dialogueJobOverridePop = {};
                    $scope.dialogueJobOverrideAuthorize = {};

                    //CR2018-010 Changes End
                    var technicianAssignedOnLoad = false;
                    var setTechnicianAssignedOnLoad = function () {
                        technicianAssignedOnLoad = $scope.serviceRequest.AllocationTechnician ? true : false;
                        $scope.serviceRequest.TechnicianBookingDeleteReason = null;
                    };

                    var dialogue = $scope.dialogueCommon;
                    dialogue.actionButtonDisable = function () {
                        if (dialogue.hideSelect) {
                            return false;
                        }
                        return !dialogue.selected;
                    };
                    // Added by Gurpreet - CR2018-010 - 31/10/18 - Setting of max no. of Jobs & Validation with allocated jobs for a technician.
                    var dialogueTechAllocatedJobs = $scope.dialogueTechAllocatedJobs;
                    dialogueTechAllocatedJobs.actionButtonDisable = function () {
                        if (dialogueTechAllocatedJobs.hideSelect) {
                            return false;
                        }
                        return !dialogueTechAllocatedJobs.selected;
                    };

                    var dialogueJobOverridePop = $scope.dialogueJobOverridePop;
                    dialogueJobOverridePop.actionButtonDisable = function () {
                        if (dialogueJobOverridePop.hideSelect) {
                            return false;
                        }
                        return !dialogueJobOverridePop.selected;
                    };

                    var dialogueJobOverrideAuthorize = $scope.dialogueJobOverrideAuthorize;
                    dialogueJobOverrideAuthorize.actionButtonDisable = function () {
                        if (dialogueJobOverrideAuthorize.hideSelect) {
                            return false;
                        }
                        return !dialogueJobOverrideAuthorize.selected;
                    };

                    //CR2018-010 Changes End
                    // section visibility
                    $scope.sections = {
                        screen: {
                            visible: true
                        },
                        pageHeading: {
                            visible: true
                        },
                        searchSelectorInput: {
                            visible: false
                        },
                        customer: {
                            visible: true
                        },
                        evaluation: {
                            visible: true
                        },
                        deposit: {
                            visible: true,
                            authorisationVisible: false
                        },
                        product: {
                            visible: true,
                            enabled: true,
                            stockLocationVisible: true,
                            serviceRetailerVisible: false,
                            stockLocationRequired: true,
                            level_1_required: true,
                            level_2_required: true,
                            level_3_required: true
                        },
                        warranty: {
                            visible: true,
                            internalCustomerMode: false
                        },
                        showPrintInvoice: {
                            visible: true
                        },
                        foodLoss: {
                            visible: function () {
                                return $scope.serviceRequest.EvaluationClaimFoodLoss === 'true' && $scope.serviceRequest.Type === 'SI';
                            }
                        },
                        customerDetail: {
                            visible: true
                        },
                        outOfWarrantyCoverMessage: {
                            visible: true
                        },
                        formReferenceField: {
                            visible: true
                        },
                        resolutionSection: {
                            supplierVisible: true,
                            delivererVisible: true,
                            productVisible: true
                        },
                        resolutionEntireSection: {
                            visible: true
                        },
                        payment: {
                            visible: false,
                            makePaymentEnabled: false
                        },
                        finalise: {
                            visible: true,
                            itemReplacedVisible: false,
                            resolutionDateRequired: false
                        },
                        allocationEntireSection: {
                            visible: true
                        }
                    };

                    // Transpose service type to label.
                    var types = {
                        SI: 'Internal Customer',
                        SE: 'External Customer',
                        S: 'Stock Repair',
                        II: 'Internal Installation',
                        IE: 'External Installation'
                    };

                    var permissions = {
                        1605: 'SaveServiceRequests', //
                        1606: 'EnableFoodLoss', //
                        1607: 'PrintServiceRequest', //
                        1608: 'EnableAllocation', //
                        1611: 'EnableResolution',
                        1612: 'EnableFinalize',
                        1613: 'PrintInvoice', //
                        1614: 'EnableDepositUpdate', //
                        1623: 'ChangeBranch',
                        1615: 'ViewTechDiary',
                        1618: 'DeleteBooking',
                        1622: 'AddBooking',
                        1627: 'EnableCustomer',
                        1628: 'EnableProduct',
                        1634: 'EnableEvaluation'
                    };

                    var safeApply = function (fn) {
                        if (!$scope) {
                            return;
                        }
                        var phase = $scope.$root.$$phase;
                        if (phase === '$apply' || phase === '$digest') {
                            $scope.$eval(fn);
                        } else {
                            $scope.$apply(fn);
                        }
                    };

                    var checkCostWarnings = function () {
                        var isBer = false,
                            previousRepairCost = 0,
                            previousEWCost = 0,
                            currentRepairCost = 0,
                            manufacturerWarrantyLength = $scope.serviceRequest.ManufacturerWarrantyLength || 0,
                            warrantyLength = $scope.serviceRequest.WarrantyLength || 0,
                            isExtendedWarranty = insideWarranty($scope.serviceRequest, warrantyLength + manufacturerWarrantyLength) && !insideWarranty($scope.serviceRequest, manufacturerWarrantyLength);

                        if ($scope.serviceRequest.Type === 'SI') {

                            if ($scope.serviceRequest.HistoryCharges !== undefined && $scope.serviceRequest.HistoryCharges !== null && $scope.serviceRequest.HistoryCharges.length > 0) {
                                previousRepairCost = _.reduce($scope.serviceRequest.HistoryCharges, function (memo, previousCharge) {
                                    if (previousCharge.ChargeType.indexOf('Installation') === -1) {
                                        return memo + previousCharge.Value;
                                    } else {
                                        return memo;
                                    }
                                }, 0);

                                previousEWCost = _.reduce($scope.serviceRequest.HistoryCharges, function (memo, previousCharge) {
                                    if (previousCharge.ChargeType === 'EW') {
                                        return memo + previousCharge.Value;
                                    } else {
                                        return memo;
                                    }
                                }, 0);
                            }

                            if ($scope.serviceRequest.Charges !== undefined && $scope.serviceRequest.Charges !== null && $scope.serviceRequest.Charges.length > 0) {
                                currentRepairCost = _.reduce($scope.serviceRequest.Charges, function (memo, charge) {
                                    if (charge.ChargeType.indexOf('Installation') === -1) {
                                        return memo + charge.Value;
                                    } else {
                                        return memo;
                                    }
                                }, 0);
                            } else {
                                currentRepairCost = _.reduce($scope.serviceRequest.Parts, function (memo, part) {
                                    if (part.quantity !== undefined && part.quantity !== null && part.price !== undefined && part.price !== null) {
                                        return memo + part.quantity * part.price;
                                    } else {
                                        return memo;
                                    }
                                }, 0);

                                currentRepairCost += $scope.serviceRequest.ResolutionLabourCost;
                                currentRepairCost += $scope.serviceRequest.ResolutionAdditionalCost;
                                currentRepairCost += $scope.serviceRequest.ResolutionTransportCost;
                            }

                            $scope.previousRepairCost = previousRepairCost;
                            $scope.previousEWCost = previousEWCost;
                            var costPrice = 0;
                            if ($scope.serviceRequest.StockItem !== undefined && $scope.serviceRequest.StockItem !== null) {
                                costPrice = $scope.serviceRequest.StockItem.CostPrice;
                            }

                            if (costPrice > 0) {
                                var berLimit = costPrice * $scope.MasterData.Settings.BerThreshold / 100;

                                if (previousRepairCost > berLimit) {
                                    if (isExtendedWarranty) {
                                        notification.showPersistent('This item is Beyond Economic Repair. The previous repair costs are ' + $filter('currency')(previousRepairCost, $scope.culture.CurrencySymbol, $scope.culture.DecimalPlaces) + ' which exceeds the BER Threshold.', false, 'ber-notification');
                                    }
                                    isBer = true;
                                } else {
                                    var currentRepairEstimate = $scope.serviceRequest.EstimateLabourCost + $scope.serviceRequest.EstimateAdditionalLabourCost + $scope.serviceRequest.EstimateTransportCost;
                                    var totalNewCost = previousRepairCost + currentRepairEstimate;
                                    if (totalNewCost > berLimit && currentRepairCost === 0) {
                                        if (isExtendedWarranty) {
                                            notification.showPersistent('Based on the estimates, this item is probably Beyond Economic Repair. The previous repair costs are ' + $filter('currency')(previousRepairCost, $scope.culture.CurrencySymbol, $scope.culture.DecimalPlaces) +
                                                ' and the current estimate is ' + $filter('currency')(currentRepairEstimate, $scope.culture.CurrencySymbol, $scope.culture.DecimalPlaces) +
                                                '. The total amount exceeds the BER Threshold.', false, 'ber-notification');
                                        }
                                        isBer = true;
                                    }

                                    var warningLimit = costPrice * $scope.MasterData.Settings.PreviousRepairCostPercentage / 100;
                                    if (!isBer && previousRepairCost > warningLimit && isExtendedWarranty) {
                                        notification.showPersistent('The total previous repair costs for this item are ' + $filter('currency')(previousRepairCost, $scope.culture.CurrencySymbol, $scope.culture.DecimalPlaces) +
                                            '. This exceeds the warning limit.', false, 'previous-repair-warning');
                                        $scope.RepairLimitWarning = true;
                                    }
                                }
                            }

                            if ($scope.isItemBer === true && isBer === false) {
                                notification.hide('ber-notification');
                            }

                            $scope.isItemBer = isBer;
                        }
                    };

                    $scope.showType = function (srType) {
                        return types[srType];
                    };

                    $scope.serviceRequest = {};
                    $scope.datePastOrCurrent = {
                        defaultDate: "+0",
                        maxDate: "+0",
                        dateFormat: "D, d MM, yy",
                        changeMonth: true,
                        changeYear: true
                    };
                    $scope.dateCreatedOrCurrent = {
                        defaultDate: "+0",
                        maxDate: "+0",
                        dateFormat: "D, d MM, yy",
                        changeMonth: true,
                        changeYear: true
                    };
                    $scope.dateCurrentOrFuture = {
                        defaultDate: "+1",
                        minDate: "+0",
                        dateFormat: "D, d MM, yy",
                        changeMonth: true,
                        changeYear: true
                    };
                    $scope.resolutionDatePickerSettings = {
                        defaultDate: "+1",
                        minDate: null,
                        maxDate: "+0",
                        dateFormat: "D, d MM, yy",
                        changeMonth: true,
                        changeYear: true
                    };
                    $scope.techAllocationPickerSettings = {
                        defaultDate: "+0",
                        minDate: "+0",
                        dateFormat: "D, d MM, yy",
                        changeMonth: true,
                        changeYear: true
                    };

                    var loadAllPicklistData = function (list) {
                        var ids = _.pluck(list, 'name');
                        pickList.loadAll(ids);
                    };

                    var populatePickLists = function (list) {
                        _.each(list, function (item) {
                            pickList.populate(item.name, function (data) {
                                safeApply(function () {
                                    $scope.MasterData[item.v] = data;
                                });
                            });
                        });
                    };

                    var pickLists = [
                        {
                            name: 'Blue.Cosacs.Service.ServiceAction',
                            v: 'ServiceActions'
                        },
                        {
                            name: 'Blue.Cosacs.Service.ServiceChargeTo',
                            v: 'ServiceChargeTos'
                        },
                        {
                            name: 'Blue.Cosacs.Service.ServiceLocation',
                            v: 'ServiceLocations'
                        },
                        {
                            name: 'ServiceSupplier',
                            v: 'ServiceSuppliers'
                        },
                        {
                            name: 'Blue.Cosacs.Service.ServiceZone',
                            v: 'ServiceZones'
                        },
                        {
                            name: 'Blue.Cosacs.Service.ServiceTechReasons',
                            v: 'ServiceTechReasons'
                        },
                        {
                            name: 'BRANCH',
                            v: 'Branches'
                        },
                        {
                            name: 'Blue.Cosacs.Service.ServiceDeliverers',
                            v: 'ServiceDeliverer'
                        },
                        {
                            name: 'ServiceSupplierAccount',
                            v: 'ServiceSupplierAccount'
                        },
                        {
                            name: 'Blue.Config.ContactType',
                            v: 'ContactTypes'
                        },
                        {
                            name: 'Blue.Cosacs.Service.ServiceQuestions',
                            v: 'ServiceQuestions'
                        },
                        {
                            name: 'Blue.Cosacs.Service.ServiceRetailer',
                            v: 'ServiceRetailers'
                        },
                        {
                            name: 'Blue.Cosacs.Service.ServiceRepairType',
                            v: 'ServiceRepairTypes'
                        },
                        {
                            name: 'Blue.Cosacs.Service.ServiceReasonForExchange',
                            v: 'ServiceReasonForExchange'
                        }
                    ];

                    var requestDateItems = ['CreatedOn',
                        'ItemSoldOn',
                        'ItemDeliveredOn',
                        'AllocationServiceScheduledOn',
                        'AllocationPartExpectOn',
                        'AllocationItemReceivedOn',
                        'ResolutionDate',
                        'FinaliseReturnDate',
                        'AllocationOn',
                        'Date'];

                    var convertDate = function (requestDateItems, baseObject) {
                        _.each(requestDateItems, function (item) {
                            if (baseObject[item]) {
                                baseObject[item] = moment(baseObject[item]).toDate();
                            }
                        });
                    };

                    var searchParams = function () {
                        var tId = parseInt($scope.techSelect.AllocationTechnician, 10);
                        return {
                            technicianId: _.isNaN(tId) ? null : tId,
                            bookingDate: $scope.techSelect.AllocationServiceScheduledOn,
                            category: $scope.techSelect.AllocationZone,
                            requestId: id
                        };
                    };

                    var updateCalendar = function () {
                        var search = searchParams();
                        if (search.technicianId) {
                            $scope.weeks = calendar.calculateWeeks({
                                date: search.bookingDate || $scope.serviceRequest.AllocationPartExpectOn || new Date(),
                                techId: search.technicianId,
                                numberOfWeeks: 1,
                                dayOnly: search.bookingDate
                            });
                        }
                    };

                    $scope.getSearchShipmentsURL = function (sr) {
                        var accountNumber = '';
                        if (sr && sr.Account) {
                            accountNumber = sr.Account;
                        }
                        return url.resolve('Warehouse/Bookings/') + "?q={%22query%22:%22" + accountNumber + "%22}";
                    };

                    $scope.getURL = function (requestId) {
                        return url.resolve('Service/Requests/') + requestId;
                    };
                    var checkResult = function (search, data) {
                        if (!search.technicianId) {
                            $scope.weeks = [];
                        }
                        if (search.technicianId && data.Technicians) {
                            $scope.Technicians = data.Technicians;
                            updateCalendar();
                        } else if (search.bookingDate) {
                            $scope.Technicians = calendar.filterBusyTechnician(search.bookingDate);
                        } else {
                            $scope.Technicians = data.Technicians;
                        }
                    };

                    var searchTechnician = $scope.searchTechnician = function () {
                        if ($scope.hasPermission('ViewTechDiary')) {
                            var search = searchParams();
                            xhr.post(url.resolve('/Service/TechnicianDiaries/GetFreeAllocations'), search)
                                .success(function (data) {
                                    calendar = calendarBase.init(data.Technicians, data.Bookings, data.Holidays,
                                        data.PublicHolidays);
                                    if ($scope.serviceRequest.AllocationServiceScheduledOn && $scope.serviceRequest.AllocationTechnician === search.technicianId) {
                                        calendar.addSelected({
                                            day: $scope.serviceRequest.AllocationServiceScheduledOn,
                                            techId: $scope.serviceRequest.AllocationTechnician,
                                            selectedSlot: $scope.serviceRequest.AllocationSlots,
                                            id: parseInt(id, 10),
                                            slots: $scope.serviceRequest.AllocationSlotExtend,
                                            allocationType: $scope.serviceRequest.AllocationType
                                        });
                                    }

                                    checkResult(search, data);
                                    $scope.slotClass = calendar.slotClass;
                                    $scope.slotText = calendar.slotText;
                                    $scope.formatHeader = calendar.formatHeader;
                                    if (search.technicianId) {
                                        $scope.slotTimes = calendar.calculateSlotsTimes(search.technicianId);
                                        $scope.slotNumbers = calendar.slotNumbers(search.technicianId);
                                    }
                                });
                        }
                    };

                    //Added by  Gurpreet - CR2018-010 - 31/10/18 - Setting of max no. of Jobs & Validation with allocated jobs for a technician.

                    $scope.getMaxAndCurrJobs = function (id) {
                        $scope.SelectTechnicianId = id;
                        if (id !== '' && id !== null) {
                            xhr.get(url.resolve('/Service/TechnicianDiaries/GetMaxAndCurrJobs?techid=') + id).success(function (data) {
                                $scope.MaxJob = parseInt(data.maxJobs, 10);
                                $scope.CurrJob = parseInt(data.currJobs, 10);
                            });
                            searchTechnician();
                        } else {
                            $scope.MaxJob = '';
                            $scope.CurrJob = '';
                        }

                    };

                    function getConfirmation(techid) {
                        var header = "Current Allocated Jobs For Technician ID - " + techid;
                        xhr.get(url.resolve('/Service/TechnicianDiaries/GetTechnicianJobsAllocation?techid=') + techid).success(function (data) {
                            $scope.TechnicianCurrentAllocatedJobs = data;
                            if (data === undefined || data === null || data.length === 0) {
                                alert("There are no results found for your search.", "No results found");
                            } else {
                                dialogueTechAllocatedJobs.headerText = header;
                                dialogueTechAllocatedJobs.CancelClicked = function () {
                                    dialogueTechAllocatedJobs.show = false;
                                    $('#dialogueTechAllocatedJobs').modal('hide');
                                };
                                dialogueTechAllocatedJobs.cancelButtonText = 'Cancel';

                                dialogueTechAllocatedJobs.showAlternate = false;
                                dialogueTechAllocatedJobs.show = true;
                                $('#dialogueTechAllocatedJobs').modal();
                                dialogueTechAllocatedJobs.hideSelect = false;
                            }
                        });
                    }

                    $scope.check = 'NO';
                    $scope.checkAll = function (requestId) {
                        $('#dialogueTechAllocatedJobs').modal('hide');
                        getAuthorization(requestId);
                    };

                    function saveJob() {
                        saving = true;
                        if (isNewRequest()) {
                            $scope.serviceRequest.CreatedBy = $scope.MasterData.User.UserName;
                            $scope.serviceRequest.CreatedById = $scope.MasterData.User.UserId;
                            $scope.serviceRequest.Branch = $scope.MasterData.User.Branch;
                        }

                        checkCostWarnings();

                        $scope.tableServiceStatus.evaluate($scope);

                        $scope.serviceRequest.FaultTags = [];
                        if ($scope.serviceRequest.FaultTagsArray) {
                            _.each($scope.serviceRequest.FaultTagsArray, function (t) {
                                $scope.serviceRequest.FaultTags.push({
                                    Tag: t.trim()
                                });
                            });
                        }

                        if ($scope.serviceRequest.DepositAuthorised &&
                            $scope.serviceRequest.DepositRequired === $scope.serviceRequest.DepositFromMatrix) {
                            $scope.serviceRequest.DepositAuthorised = false; // clear authorisation if not necessary
                        }

                        xhr.post(url.resolve('/Service/Requests'), $scope.serviceRequest)
                            .success(function (data) {
                                $location.path(url.resolve('/Service/Requests/') + data.Id);
                                id = $scope.serviceRequest.Id = data.Id;

                                setTechnicianAssignedOnLoad();

                                if (data.techError) {
                                    alert('Service Request was saved but the selected slot for technician allocation is no longer valid. \r\n' +
                                        'Please choose a new slot and save again.', 'Request Partially Saved');
                                } else {
                                    notification.show('Service Request saved successfully.');
                                    $scope.weeks = [];
                                    $("#s2id_techy").find('span').text("Select Technician");
                                    if ($scope.serviceRequest.Comment) {
                                        RequestComments.push({
                                            Date: moment(data.lastUpdated.LastUpdatedOn).toDate(),
                                            AddedBy: data.lastUpdated.LastUpdatedUserName,
                                            Comment: $scope.serviceRequest.Comment
                                        });
                                        RequestComments = _.sortBy(RequestComments, function (item) {
                                            return (+item.Date);
                                        });
                                        $scope.serviceRequest.RequestComments = RequestComments.reverse();
                                        $scope.serviceRequest.Comment = "";
                                    }
                                }

                                var newSavedSrPageUrl = $location.absUrl();
                                if (data.Id && newSavedSrPageUrl && $scope.serviceRequestCreateFromOtherServiceRequest) {
                                    $scope.serviceRequestCreateFromOtherServiceRequest = false;
                                    // Service requests created from other SR's must be reloaded right after their first valid save.
                                    window.location.replace(newSavedSrPageUrl); // So now we'll reload this newly saved SR...
                                }
                                $scope.newRequestId = data.Id;
                                saving = false;
                                var newRequestId = $scope.newRequestId;
                                var id = $scope.OverrideJobId;
                                auditOverrideJob(id, newRequestId);
                            }).error(function () {
                                saving = false;
                            });

                    }


                    function DeleteJob(id, techId) {
                        $scope.OverrideJobId = id;
                        xhr.post(url.resolve('/Service/TechnicianDiaries/OverrideBookingByRequestId?techId=') + techId + '&id=' + id);                        
                    }

                    function auditOverrideJob(id, newRequestId) {
                        xhr.post(url.resolve('/Service/TechnicianDiaries/JobOverrideAudit?id=') + id + '&newRequestId=' + newRequestId);                        window.location = $location.url();
                    }

                    function getConfirmationDialouge(selectedTechId) {
                        $('#dialogueJobOverridePop').modal('show');
                        dialogueJobOverridePop.actionButtonClick = function () {
                            getConfirmation(selectedTechId);
                            dialogueJobOverridePop.show = false;
                            $('#dialogueJobOverridePop').modal('hide');
                        };
                        dialogueJobOverridePop.CancelClicked = function () {
                            dialogueJobOverridePop.show = false;
                            $('#dialogueJobOverridePop').modal('hide');
                        };
                        dialogueJobOverridePop.showAlternate = false;
                        dialogueJobOverridePop.show = true;
                        $('#dialogueJobOverridePop').modal();
                        dialogueJobOverridePop.hideSelect = false;
                    }

                    function getAuthorization(requestId) {
                        dialogueJobOverrideAuthorize.actionButtonClick = function () {

                            var id = new Number(requestId);
                            var techId = new Number($scope.SelectTechnicianId);
                            $scope.OverrideJobId = id;
                            if ($('#usrnme').val() === '' && $('#pwd').val() === '') {
                                dialogueJobOverrideAuthorize.errorText = 'User Id or Password cannot be blank.';
                                $("#errMsg").removeAttr("style");
                            } else {
                                var userName = $('#usrnme').val();
                                var pwd = $('#pwd').val();
                                CheckUserDetails(id, techId, userName, pwd);
                            }
                        };

                        dialogueJobOverrideAuthorize.CancelClicked = function () {
                            dialogueJobOverrideAuthorize.show = false;
                            $('#dialogueJobOverrideAuthorize').modal('hide');
                        };
                        dialogueJobOverrideAuthorize.showAlternate = false;
                        dialogueJobOverrideAuthorize.show = true;
                        $('#dialogueJobOverrideAuthorize').modal();
                        dialogueJobOverrideAuthorize.hideSelect = false;
                    }

                    function CheckUserDetails(id, techId, userName, pwd) {
                        xhr.get(url.resolve('/Service/TechnicianDiaries/GetUserAuthForOverride?id=') + userName + '&pwd=' + pwd).success(function (data) {
                            $scope.msg = data;
                            if ($scope.msg !== ' ') {
                                dialogueJobOverridePop.show = false;
                                $('#dialogueJobOverrideAuthorize').modal('hide');
                                $scope.OverrideJobId = id;
                                saveJob();
                                DeleteJob(id, techId);
                                return true;
                            } else {
                                dialogueJobOverrideAuthorize.errorText = 'User does not have permission to add or modify bookings.';
                                return;
                            }
                        });
                    }

                    //CR2018-010 Changes End

                    var setResolutionDatePickerSettings = function (scope) {
                        var resolutionDatePickerMinDate =
                            scope.serviceRequest.AllocationServiceScheduledOn ||
                            scope.serviceRequest.AllocationPartExpectOn ||
                            scope.serviceRequest.AllocationItemReceivedOn ||
                            scope.serviceRequest.CreatedOn;

                        if (resolutionDatePickerMinDate) {
                            scope.resolutionDatePickerSettings.minDate = moment(resolutionDatePickerMinDate).toDate();
                        }
                    };

                    var setup = function () {

                        populatePickLists(pickLists);
                        $scope.MasterData.AvailableChargeTos = [];
                        $scope.MasterData.User.Permissions = _.map($scope.MasterData.User.Permissions, function (p) {
                            return permissions[p];
                        });

                        $scope.$watch(function (scope) {
                            return scope.MasterData.ServiceResolutions;
                        }, function () {
                            safeApply(function () {
                                $scope.ServiceResolutions = $scope.MasterData.ServiceResolutions;
                            });
                        });

                        $scope.$watch(function (scope) {
                            return scope.MasterData.ContactTypes;
                        }, function () {
                            if (!$scope.serviceRequest.Contacts) {
                                safeApply(function () {
                                    $scope.serviceRequest.Contacts = [
                                        {
                                            Type: _.values($scope.MasterData.ContactTypes)[0],
                                            Value: ''
                                        }
                                    ];
                                });
                            }

                            contacts = $scope.serviceRequest.Contacts;
                        });

                        $scope.$watch(function (scope) {
                            return scope.MasterData.ServiceQuestions;
                        }, function () {
                            if (!$scope.serviceRequest.ScriptAnswer || $scope.serviceRequest.ScriptAnswer.length === 0) {
                                var scriptAnswers = [];
                                _.each($scope.MasterData.ServiceQuestions, function (q) {
                                    scriptAnswers.push({
                                        Question: q,
                                        Value: 'NA'
                                    });
                                });

                                safeApply(function () {
                                    $scope.serviceRequest.ScriptAnswer = scriptAnswers;
                                });
                            }
                        });

                        //$scope.$watch(function (scope) { // for the decision tables
                        //    return scope.sections.product.level_1_required;
                        //}, function () {
                        //    safeApply(function () {
                        //        $scope.productItem.level_1_required = false;
                        //    });
                        //});
                        //
                        //$scope.$watch(function (scope) { // for the decision tables
                        //    return scope.sections.product.level_2_required;
                        //}, function () {
                        //    safeApply(function () {
                        //
                        //        $scope.productItem.level_2_required = false;
                        //    });
                        //});
                        //
                        //$scope.$watch(function (scope) { // for the decision tables
                        //    return scope.sections.product.level_3_required;
                        //}, function () {
                        //    safeApply(function () {
                        //        $scope.productItem.level_3_required = false;
                        //    });
                        //});

                        $scope.$watch(function (scope) { // for the decision tables
                            return scope.sections.product.enabled;
                        }, function () {
                            safeApply(function () {
                                $scope.productItem.edit = $scope.sections.product.enabled;
                            });
                        });

                        $scope.$watch(function (scope) {
                            return scope.serviceRequest.AllocationServiceScheduledOn +
                                scope.serviceRequest.AllocationPartExpectOn +
                                scope.serviceRequest.AllocationItemReceivedOn +
                                scope.serviceRequest.CreatedOn;
                        }, function () {
                            safeApply(function () {
                                setResolutionDatePickerSettings($scope);
                            });
                        });

                        $scope.$watch('isPrintDone', function (newVal) {

                            if (newVal) {
                                $scope.cancelReceiptPrinting();
                            }
                        });

                        if ($scope.serviceRequest.FaultTags) {
                            var tags = _.map($scope.serviceRequest.FaultTags, function (tag) {
                                if (tag.Tag !== undefined && tag.Tag !== null) {
                                    return tag.Tag.trim();
                                }
                            });
                            $scope.serviceRequest.FaultTagsArray = tags;
                        }

                        if (!$scope.serviceRequest.FoodLoss) {
                            $scope.serviceRequest.FoodLoss = [];
                        }

                        if (!$scope.serviceRequest.Parts) {
                            $scope.serviceRequest.Parts = [];
                        } else {
                            _.each($scope.serviceRequest.Parts, function (part) {
                                part.stockbranch = String(part.stockbranch);
                                if (part.stockbranch) {
                                    pickList.k2v('BRANCH', part.stockbranch, function (rows) {
                                        safeApply(function () {
                                            part.stockbranchname = rows[part.stockbranch];
                                        });
                                    });
                                }
                            });
                        }

                        if ($scope.serviceRequest.ItemStockLocation) {
                            $scope.serviceRequest.ItemStockLocation = String($scope.serviceRequest.ItemStockLocation);
                        }

                        if (!$scope.serviceRequest.RequestComments) {
                            $scope.serviceRequest.RequestComments = [];
                        }

                        $scope.serviceRequest.FoodLossClaim = {
                            optionYes: 'Yes',
                            OptionNo: 'No'
                        };

                        FoodLoss = $scope.serviceRequest.FoodLoss;
                        Parts = $scope.serviceRequest.Parts;
                        RequestComments = $scope.serviceRequest.RequestComments;

                        if ($scope.serviceRequest.AllocationPartExpectOn) {
                            $scope.techAllocationPickerSettings.minDate = moment($scope.serviceRequest.AllocationPartExpectOn).toDate();
                        }

                        setResolutionDatePickerSettings($scope);

                        $scope.foodLossSum = function () {
                            var total = 0;
                            _.each($scope.serviceRequest.FoodLoss, function (fl) {
                                total += fl.value;
                            });
                            return total;
                        };

                        $scope.sumPartPrice = function () {
                            //var cosacsTaxType = $scope.MasterData.Settings.TaxType;
                            //
                            //var total = 0;
                            return _.reduce($scope.serviceRequest.Parts, function (previous, current) {
                                return previous + (Math.round(current.quantityPerCostPriceDisplayInfo * 100) / 100);
                            }, 0);

                            //_.sum($scope.serviceRequest.Parts, 'quantityPerCostPriceDisplayInfo');
                            //_.each($scope.serviceRequest.Parts, function (sp) {
                            //    var partsPrice = 0;
                            //    if (cosacsTaxType == "E") { // tax type exclusive
                            //        partsPrice = sp.quantity * sp.price;
                            //    } else if (cosacsTaxType == "I") { // tax type inclusive
                            //        partsPrice = sp.quantity * (sp.price + (sp.TaxAmount || 0 ));
                            //    }
                            //    total += sp.quantityPerCostPriceDisplayInfo || partsPrice;
                            //});
                            //return total;
                        };

                        //Create or load MasterData if new else load.
                        if (isNewRequest()) {
                            $scope.serviceRequest.CreatedBy = $scope.MasterData.User.UserName;
                            $scope.serviceRequest.CreatedById = $scope.MasterData.User.UserId;
                            $scope.serviceRequest.Branch = $scope.MasterData.User.Branch;
                            $scope.serviceRequest.CreatedOn = new Date();
                            $scope.srNewButtonText = 'Create';
                        } else {
                            convertDate(requestDateItems, $scope.serviceRequest);

                            var rComments;
                            for (rComments = 0; rComments < RequestComments.length; rComments++) {
                                convertDate(requestDateItems, RequestComments[rComments]);
                            }
                        }

                        $scope.partExpectedChanged = function () {
                            $scope.techAllocationPickerSettings.minDate = moment($scope.serviceRequest.AllocationPartExpectOn).toDate();
                            cleanTechnicianAllocation();
                            updateCalendar();
                        };

                        var cleanTechnicianAllocation = function () {
                            safeApply(function () {
                                if (calendar) {
                                    calendar.removeAllSelected();
                                }

                                $scope.AllocatedTechName = null;
                                $scope.serviceRequest.AllocationTechnicianIsInternal = null;

                                $scope.serviceRequest.AllocationServiceScheduledOn = null;
                                $scope.resolutionDatePickerSettings.minDate = null;
                                setResolutionDatePickerSettings($scope);

                                $scope.serviceRequest.AllocationSlots = null;
                                $scope.serviceRequest.AllocationSlotExtend = null;
                                $scope.serviceRequest.AllocationTechnician = null;
                                $scope.serviceRequest.AllocationOn = null;
                            });
                        };

                        $scope.showPrintFoodLoss = function () {
                            return FoodLoss.length > 0 && !isNewRequest() && $scope.sections.foodLoss.visible();
                        };

                        $scope.DepositUpdateCheck = function () {
                            return !isNewRequest() && !hasPermission('EnableDepositUpdate');
                        };

                        var hasPermission = function (permissionName) {
                            return typeof _.find($scope.MasterData.User.Permissions, function (p) {
                                return p === permissionName;
                            }) !== 'undefined';
                        };
                        $scope.hasPermission = hasPermission;

                        var stockBranchesList = function () {
                            if (hasPermission('ChangeBranch')) {
                                return $scope.MasterData.Branches;
                            } else {
                                var branch = {};
                                branch[$scope.MasterData.User.Branch] = $scope.MasterData.Branches[$scope.MasterData.User.Branch];
                                return branch;
                            }
                        };

                        // Search stock.
                        $scope.findStock = function (searchItem) {
                            $rootScope.$broadcast('searchItem', searchItem, stockBranchesList(), $scope.MasterData.User.Branch, $scope.DefaultStockLocation);
                        };

                        $scope.searchNewPart = function () {
                            $rootScope.$broadcast('searchPart', Parts.length, stockBranchesList(), $scope.MasterData.User.Branch, $scope.DefaultStockLocation);
                        };

                        // Search part.
                        $scope.searchPart = function (part) {
                            for (var i = 0, ii = Parts.length; i < ii; i++) {
                                if (part === Parts[i]) {
                                    $rootScope.$broadcast('searchPart', i, stockBranchesList(), $scope.MasterData.User.Branch, $scope.DefaultStockLocation);
                                }
                            }
                        };

                        $scope.isSaveDisabled = function () {
                            return $scope.serviceForm.$invalid || !hasPermission('SaveServiceRequests') ||
                                $scope.serviceRequest.IsClosed ||
                                //saving || //Commented a apart of  CR2018-010 - 31/10/18 by Gurpreet
                                $scope.sections.finalise.resolutionDateRequired ||
                                $scope.authorisationPending ||
                                ($scope.sections.product.level_1_required && !$scope.hierarchy.Division) ||
                                ($scope.sections.product.level_2_required && !$scope.hierarchy.Department) ||
                                ($scope.sections.product.level_3_required && !$scope.hierarchy.Class);
                        };

                        $scope.isPrintDisabled = function () {
                            return $scope.serviceForm.$invalid || isNewRequest() || !hasPermission('PrintServiceRequest');
                        };

                        $scope.showPrintInvoice = function () {
                            return $scope.serviceRequest.Account && hasPermission('PrintInvoice');
                        };

                        $scope.AllocatedTechName = $scope.serviceRequest.AllocationTechnicianName;
                        if (typeof $scope.serviceRequest.EvaluationClaimFoodLoss !== 'undefined' && $scope.serviceRequest.EvaluationClaimFoodLoss !== null) {
                            $scope.serviceRequest.EvaluationClaimFoodLoss = $scope.serviceRequest.EvaluationClaimFoodLoss.toString();
                        }

                        $scope.updateProductCategory = function () {
                            if ($scope.serviceRequest.ResolutionSupplierToCharge) {
                                $scope.ResolutionSupplierToChargeAccount = $scope.MasterData.ServiceSuppliers[$scope.serviceRequest.ResolutionSupplierToCharge];
                                xhr.get(url.resolve('/Service/SupplierCosts/GetProducts?supplier=') + $scope.serviceRequest.ResolutionSupplierToCharge)
                                    .success(function (data) {
                                        $scope.MasterData.ResolutionCategories = data;
                                    }).error(function () {
                                        $scope.sections.screen.visible = false;
                                    });
                            }
                        };

                        $scope.updatePartType = function () {
                            if ($scope.serviceRequest.ResolutionCategory) {
                                xhr.get(url.resolve('/Service/SupplierCosts/GetSupplierCostsInLocalCurrency?supplier=') + $scope.serviceRequest.ResolutionSupplierToCharge + '&product=' + $scope.serviceRequest.ResolutionCategory)
                                    .success(function (data) {
                                        $scope.MasterData.SupplierCostMatrix = data.costs;
                                    }).error(function () {
                                        $scope.sections.screen.visible = false;
                                    });
                            }
                        };

                        var evaluateChargesDecisionTable = function () {
                            if ($scope.serviceRequest.State !== 'Closed' && $scope.serviceRequest.State !== 'Resolved' &&
                                ($scope.serviceRequest.State !== 'Awaiting payment' || $scope.resolutionPrimaryChargeChanged)) {
                                $scope.resolutionPrimaryChargeChanged = false;
                                $scope.tableCharge.evaluate($scope);
                            }
                        };

                        $scope.getCharges = function () {
                            var query = {
                                ProductLevel_1: $scope.hierarchy.Division || $scope.serviceRequest.ProductLevel_1,
                                ProductLevel_2: $scope.hierarchy.Department || $scope.serviceRequest.ProductLevel_2,
                                ProductLevel_3: $scope.hierarchy.Class || $scope.serviceRequest.ProductLevel_3,
                                Manufacturer: $scope.serviceRequest.Manufacturer,
                                ItemNumber: $scope.serviceRequest.ItemNumber,
                                RepairType: $scope.serviceRequest.RepairType
                            };
                            xhr({
                                method: 'POST',
                                url: url.resolve('/Service/Charges/GetCharges'),
                                data: query
                            }).success(function (data) {
                                $scope.MasterData.LabourCostMatrix = data;
                                evaluateChargesDecisionTable();
                            });
                            xhr({
                                method: 'POST',
                                url: url.resolve('/Service/Parts/GetCharges'),
                                data: query
                            }).success(function (data) {
                                $scope.MasterData.PartsCostMatrix = data;
                                evaluateChargesDecisionTable();
                            });
                        };

                        if (hasPermission('ViewTechDiary')) {
                            searchTechnician(true);
                        }

                        $scope.disableIcon = function (permission) {
                            return $scope.hasPermission(permission) ? 'click' : 'ui-icon-disabled';
                        };

                        $scope.$watch(function (scope) {
                            return scope.serviceRequest.ResolutionPrimaryCharge;
                        }, function (newValue, oldValue) {
                            checkChargeToAuthorisation(newValue, oldValue);
                        });

                        $scope.$watch('serviceRequest.Resolution', function (newValue, oldValue) {
                            if (newValue !== oldValue && newValue === 'Beyond Economic Repair' &&
                                $scope.MasterData.Settings.BerReplacement) {
                                $scope.serviceRequest.ReplacementIssued = true;
                            }
                        });

                        $scope.$watch('serviceRequest.Evaluation', function (newValue, oldValue) {
                            if (newValue !== oldValue && newValue === 'Damage On Delivery') {
                                $scope.serviceRequest.Resolution = 'Damage On Delivery';
                                $scope.serviceRequest.ResolutionPrimaryCharge = 'Deliverer';
                            }
                        });

                        $scope.$watch('isItemBer', function (newValue) {
                            if (newValue && $scope.MasterData.Settings.BerReplacement) {
                                $scope.serviceRequest.ReplacementIssued = true;
                                $scope.serviceRequest.Resolution = 'Beyond Economic Repair';
                            }

                        });

                        var chargeToAuthorisationSuccess = function () {
                            var selectedOption = $('select[ng-model="serviceRequest.ResolutionPrimaryCharge"] option:selected');
                            selectedOption.data('authorised', true);
                        };

                        var chargeToAuthorisationFailure = function () {
                            $scope.serviceRequest.ResolutionPrimaryCharge = $scope.OriginalPrimaryCharge;
                        };

                        var checkChargeToAuthorisation = function (newValue, oldValue) {
                            var message = 'The primary charge to is being changed from ' + oldValue + ' to ' + newValue + '. This change requires authorisation.';
                            var selectedOption = $('select[ng-model="serviceRequest.ResolutionPrimaryCharge"] option:selected');
                            if (selectedOption.data('auth-required') === true && selectedOption.data('authorised') !== true) {
                                $scope.OriginalPrimaryCharge = oldValue;
                                $rootScope.$broadcast('requestAuthorisation', {
                                    text: message,
                                    title: 'Primary charge',
                                    requiredPermission: 'AuthoriseChargeToChange',
                                    permissionArea: 'Service',
                                    success: chargeToAuthorisationSuccess,
                                    failure: chargeToAuthorisationFailure
                                });
                            }
                        };

                        $scope.$on('authorisationSuccess', function (event, data) {
                            $scope.authorisationPending = false;
                            data.success();
                        });

                        $scope.$on('authorisationFailure', function (event, data) {
                            data.failure(_.isUndefined(data.cancel) ? false : true);
                        });

                        $scope.checkDepositAuthorisation = function () {
                            if (!$scope.serviceRequest.DepositFromMatrix) {
                                $scope.sections.deposit.authorisationVisible = false;
                                $scope.authorisationPending = false;
                                return;
                            }

                            if ($scope.serviceRequest.DepositRequired !== $scope.serviceRequest.DepositFromMatrix) {
                                $scope.authorisationPending = true;
                                $scope.sections.deposit.authorisationVisible = true;
                            } else {
                                $scope.authorisationPending = false;
                                $scope.sections.deposit.authorisationVisible = false;
                            }
                        };

                        var depositRequiredAuthorisationSuccess = function () {
                            // All good
                            $scope.serviceRequest.DepositAuthorised = true;
                            $scope.serviceRequest.ManualDepositRequired = true;
                        };

                        var depositRequiredAuthorisationFailure = function (wasCanceled) {
                            if (!wasCanceled) {
                                $scope.serviceRequest.DepositAuthorised = false;
                                $scope.serviceRequest.DepositRequired = $scope.serviceRequest.DepositFromMatrix;
                            }
                        };

                        $scope.requestDepositChangeAuthorisation = function () {
                            var message = 'The required deposit is being changed from ' + $scope.serviceRequest.DepositFromMatrix +
                                ' to ' + $scope.serviceRequest.DepositRequired + '. This change requires authorisation.';
                            $rootScope.$broadcast('requestAuthorisation', {
                                text: message,
                                title: 'Deposit Required',
                                requiredPermission: 'AuthoriseDepositRequiredChange',
                                permissionArea: 'Service',
                                success: depositRequiredAuthorisationSuccess,
                                failure: depositRequiredAuthorisationFailure
                            });
                        };

                        pjax.set($('.history'));
                        $scope.decisionTableCtrl = srDecisionTable($scope);
                        // start running the charges decision table

                        $scope.$watch(function (scope) {
                            var keys = [
                                'Resolution',
                                'Type',
                                'ManufacturerWarrantyLength',
                                'WarrantyLength'
                            ];
                            return angular.toJson(_.pick(scope.serviceRequest, keys));
                        },

                            function () {
                                $scope.tableChargeToAuthorisation.evaluate($scope);
                            });

                        $scope.$watch(
                            function (scope) {
                                // these are the dependencies for the Charges decision table
                                var keys = [
                                    'ResolutionPrimaryCharge',
                                    'ResolutionSupplierToCharge',
                                    'ResolutionDelivererToCharge',
                                    'ResolutionCategory',
                                    'ResolutionAdditionalCost',
                                    'ResolutionTransportCost',
                                    'ResolutionLabourCost',
                                    'Parts',
                                    'RepairType',
                                    'PaymentBalance',
                                    'ItemSoldOn',
                                    'ManufacturerWarrantyLength',
                                    'WarrantyLength',
                                    'ReplacementIssued',
                                    'AllocationTechnicianIsInternal'
                                ];
                                var tmpJson = angular.toJson(_.pick(scope.serviceRequest, keys));
                                return tmpJson;
                            }, function () {
                                safeApply(function () {
                                    $scope.resolutionPrimaryChargeChanged = true;
                                    evaluateChargesDecisionTable();
                                });
                            });

                        $scope.$watch( // synchronize charges decision table after the SupplierCostMatrix loads (after updatePartType function runs)
                            function (scope) {
                                return scope.MasterData.SupplierCostMatrix || '';
                            }, function () {
                                safeApply(function () {
                                    $scope.resolutionPrimaryChargeChanged = true;
                                    evaluateChargesDecisionTable();
                                });
                            });

                        $scope.calculateOutstandingBalance = function () {

                            // var sum = function (list, f) {
                            //     f = f || function (v) {
                            //             return v || 0;
                            //         };
                            //     return _.reduce(list, function (memo, e) {
                            //         return memo + (f(e) || 0);
                            //     }, 0);
                            // };

                            // var charges = _.filter($scope.serviceRequest.Charges, function (c) {
                            //     return c.ChargeType === "Customer" || c.ChargeType === "Deliverer";
                            // });

                            // $scope.OutstandingBalance = sum(charges, function (c) {
                            //         return c.Value + (c.Tax || 0);
                            //     }) - ($scope.serviceRequest.PaymentBalance || 0);

                            return $scope.OutstandingBalance;
                        };

                        $scope.$watch(function (scope) {
                            return scope.serviceRequest.Charges;
                        }, function () {

                            $scope.calculateOutstandingBalance();

                            $scope.serviceRequest.DisplayCharges = [];
                            $scope.serviceRequest.ChargeTos = [];
                            if ($scope.serviceRequest.Type === 'II' || $scope.serviceRequest.Type === 'IE') {
                                // makePayment;
                                $scope.serviceRequest.ChargeTos = _.pluck($scope.MasterData.AvailableChargeTos, 'key');
                            } else {
                                $scope.serviceRequest.ChargeTos = $scope.MasterData.ServiceChargeTos;
                            }

                            var groupedCharges = _.groupBy($scope.serviceRequest.Charges, 'Label');
                            var taxes = [];
                            _.each($scope.serviceRequest.Charges, function (singleCharge) {
                                var t = _.find(taxes, _.matches({ ChargeType: singleCharge.ChargeType }));

                                if (t) {
                                    //ChargeType was already present, lets add the new value
                                    if (!isNaN(singleCharge.Tax)) {
                                        t.Value = t.Value + singleCharge.Tax;
                                    }
                                    taxes = _.reject(taxes, function (currentTax) {
                                        return currentTax.ChargeType === singleCharge.ChargeType;
                                    });
                                }
                                else {
                                    //new ChargeType
                                    t = {
                                        ChargeType: singleCharge.ChargeType,
                                        Label: 'Taxes',
                                        Value: singleCharge.Tax
                                    };
                                }
                                taxes.push(t);
                            });
                            groupedCharges.Taxes = taxes;

                            var cosacsTaxType = $scope.MasterData.Settings.TaxType;

                            _.each(groupedCharges, function (costs, costType) {

                                var charge = _.reduce(costs, function (memo, charge) {

                                    if ($scope.serviceRequest.State === 'Closed' || $scope.serviceRequest.State === 'Resolved' ||
                                        $scope.serviceRequest.State === 'Awaiting payment') {

                                        if (cosacsTaxType === 'I') {
                                            charge.displayValue = charge.displayValue || charge.Value + charge.Tax;
                                        }
                                    }

                                    memo[charge.ChargeType] = charge.displayValue || charge.Value || 0;
                                    memo.total += charge.displayValue || charge.Value || 0;
                                    return memo;
                                }, {
                                        total: 0
                                    });

                                // only display 'tax type' costs on 'E' (tax exclusive) countries
                                if ((costType === 'Taxes' && $scope.MasterData.Settings.TaxType === 'E') ||
                                    costType !== 'Taxes') { // and don't limit the display of any other 'non tax type' cost
                                    $scope.serviceRequest.DisplayCharges.push({
                                        costType: costType,
                                        charges: charge
                                    });
                                }
                            });

                            var chargesByType = _.pluck($scope.serviceRequest.DisplayCharges, 'charges');
                            var totalCost = {};
                            _.each($scope.serviceRequest.ChargeTos, function (chargeTo) {
                                var charges = _.pluck(chargesByType, chargeTo);
                                var sum = _.reduce(charges, function (memo, charge) {
                                    return memo + (charge || 0);
                                }, 0);
                                totalCost[chargeTo] = sum;
                            });

                            var allChargeTos = _.pluck(chargesByType, 'total');
                            var chargeToTotal = _.reduce(allChargeTos, function (memo, charge) {
                                return memo + (charge || 0);
                            }, 0);
                            totalCost.total = chargeToTotal;

                            $scope.serviceRequest.DisplayCharges.push({
                                costType: 'Total Cost',
                                charges: totalCost
                            });
                        });

                        $scope.hideScreen = false;

                        $scope.sections.customer.enabled = hasPermission('EnableCustomer');

                        $scope.sections.warranty.enabled = $scope.sections.product.allEnabled = hasPermission('EnableProduct');
                        $scope.sections.evaluation.enabled = hasPermission('EnableEvaluation');

                        $scope.dateCreatedOrCurrent.minDate = $scope.serviceRequest.CreatedOn;
                    };

                    //Request status hack. This is used to work out if the Sr is new or existing.
                    var id = $location.url().substring($location.url().lastIndexOf('/') + 1);
                    id = isNaN(id) ? 0 : id;

                    var isNewRequest = function () {

                        return id === 0;
                    };

                    // Main entry

                    loadAllPicklistData(pickLists);
                    //populatePickLists(pickLists);

                    xhr.get(url.resolve('/Service/Requests/GetRequest/') + id)
                        .success(function (data) {

                            $scope.serviceRequest = data.RequestItem;
                            if ($scope.serviceRequest.addtype != null) {
                                $scope.serviceRequest.DelieveryAddress = $scope.serviceRequest.addtype.trim();
                            }

                            if ($scope.serviceRequest.Type === 'SI') {
                                //$scope.hasShow = false;
                            }
                            if ($scope.serviceRequest.Type === 'S') {
                                $scope.hasShow = false;
                            }
                            if ($scope.serviceRequest.Type === 'II') {
                                //  $scope.hasShow = false;
                            }
                            //$scope.serviceRequest.Address = $scope.serviceRequest[0].Address;
                            $scope.MasterData = data.MasterData;
                            $scope.serviceFaultTags = {
                                tags: $scope.MasterData.Settings.ServiceFaultTag || [],
                                tokenSeparators: [",", " "],
                                width: "200px"
                            };
                            // Load  the department/category/class select's...
                            $scope.hierarchy.Division = _.isNull(data.RequestItem.ProductLevel_1) ? null : data.RequestItem.ProductLevel_1.toString();
                            $scope.hierarchy.Department = _.isNull(data.RequestItem.ProductLevel_2) ? null : data.RequestItem.ProductLevel_2.toString();
                            $scope.hierarchy.Class = _.isNull(data.RequestItem.ProductLevel_3) ? null : data.RequestItem.ProductLevel_3.toString();

                            if ($scope.serviceRequest.CreatedOn) {
                                $scope.resolutionDatePickerSettings.minDate = $scope.serviceRequest.CreatedOn;
                            }
                            setTechnicianAssignedOnLoad();
                            setup();

                            checkCostWarnings();

                            var customerId = url.getParameter('customerId');
                            if (isNewRequest() && customerId) {
                                $scope.srType = 'SI';
                                $scope.CustomerSearch.Type = 'Customer';
                                $scope.CustomerSearch.Value = customerId;
                                $scope.saveSrType();
                            }

                            $timeout(function () {
                                $('#navBar').affix({
                                    offset: {
                                        top: 90
                                    }
                                });
                            }, 0);

                            $("#serviceMainContainer").removeAttr("style");

                            loadHierarchy();

                            $scope.serviceready = true;
                        }).error(function () {
                            $scope.sections.screen.visible = false;
                            $scope.serviceready = true;
                            $scope.loadError = true;
                            $("#load-error").removeAttr("style");
                        });

                    // Change type selector page button label.
                    $scope.srTypeChange = function () {
                        ////debugger;
                        $scope.CustomerSearch.srType = $scope.srType;
                        if ($scope.srType === 'SI') {
                            $scope.srNewButtonText = 'Search';
                        } else {
                            $scope.srNewButtonText = 'Create';
                        }
                        //$scope.tableWorkflow.evaluate($scope);
                    };

                    // Enables disables create button on selector.
                    $scope.DisableCreate = function () {
                        return !$scope.srType || (($scope.srType === 'SI' || $scope.srType === 'II') && !$scope.CustomerSearch.Value) ||
                            (($scope.srType === 'SI' || $scope.srType === 'II') && $scope.CustomerSearch.Type === 'Invoice' && !$scope.CustomerSearch.Branch);
                    };

                    // Action when search result is selected.
                    $scope.saveSrType = function () {

                        if ($scope.srType !== 'SI' && $scope.srType !== 'II') {
                            $scope.serviceRequest.Type = $scope.srType;
                            if ($scope.srType === 'S') {
                                contacts.pop();
                            }
                        } else {
                            xhr.post(url.resolve('/Service/Requests/InternalSearch'), $scope.CustomerSearch)
                                .success(function (data) {
                                    $scope.searchResult = data;
                                    if (data === undefined || data === null || data.length === 0) {
                                        alert("There are no results found for your search.", "No results found");
                                    }
                                });
                        }
                    };
                    /// new address pop add hear by tosif ali 16/10/2018*@
                    $scope.saveSrType2 = function () {
                        if ($scope.srType != 'SE' && $scope.srType != 'IE') {
                            return;
                        }
                        $scope.CustomerSearch.value = $scope.serviceRequest.CustomerId;
                        $scope.CustomerSearch.Type = 'Customer';
                        xhr.post(url.resolve('/Service/Requests/ExternalSearch'), $scope.CustomerSearch)
                            .success(function (data) {
                                $scope.searchResult = data;
                                if (data === undefined || data === null || data.length === 0) {
                                 //   alert("There are no results found for your search.", "No results found");                                    $scope.notificationresult = "There are no results found for your search.", "No results found";
                                }
                                else {                                    $scope.notificationresult = '';
                                    $scope.serviceRequest.Type = $scope.srType;
                                    $scope.serviceRequest.CustomerId = $scope.searchResult[0].CustomerId;
                                    $scope.serviceRequest.CustomerTitle = $scope.searchResult[0].CustomerTitle;
                                    $scope.serviceRequest.CustomerFirstName = $scope.searchResult[0].CustomerFirstName;
                                    $scope.serviceRequest.CustomerLastName = $scope.searchResult[0].CustomerLastName;
                                    $scope.serviceRequest.CustomerAddressLine1 = $scope.searchResult[0].CustomerAddressLine1;
                                    $scope.serviceRequest.CustomerAddressLine2 = $scope.searchResult[0].CustomerAddressLine2;
                                    $scope.serviceRequest.CustomerAddressLine3 = $scope.searchResult[0].CustomerAddressLine3;
                                    $scope.serviceRequest.CustomerPostcode = $scope.searchResult[0].CustomerPostcode;
                                    $scope.serviceRequest.CustomerNotes = $scope.searchResult[0].CustomerNotes;


                                    $scope.serviceRequest.Address = $scope.searchResult[0].Address;

                                    $scope.serviceRequest.DelieveryAddress = $scope.searchResult[0].addtype.trim();

                                    $scope.serviceRequest.addtype = $scope.searchResult[0].addtype;

                                    $scope.serviceRequest.History = $scope.searchResult[0].History;
                                    $scope.serviceRequest.HistoryCharges = $scope.searchResult[0].HistoryCharges;
                                    $scope.serviceRequest.ScriptAnswer = $scope.searchResult[0].ScriptAnswer;

                                    //Quite hackky. Assigning directly doesn't work.
                                    if ($scope.searchResult[0].Contacts) {
                                        contacts.pop();
                                        _.each($scope.searchResult[0].Contacts, function (c) {
                                            contacts.push({
                                                Type: c.Type,
                                                Value: c.Value
                                            });
                                        });
                                    }

                                    $scope.serviceRequest.InvoiceNumber = $scope.searchResult[0].InvoiceNumber || $scope.searchResult[0].ItemInvoiceNo;
                                    $scope.serviceRequest.Account = $scope.searchResult[0].Account;

                                    convertDate(requestDateItems, $scope.serviceRequest);
                                    checkCostWarnings();
                                }
                            });

                    };
                    // end hear
                    $scope.ChangeAddress = function (DelieveryAddress) {

                        debugger
                        for (var i = 0; i < $scope.searchResult.length; i++) {

                            if ($scope.searchResult[i].addtype.trim() == $scope.serviceRequest.DelieveryAddress.trim()) {
                                $scope.serviceRequest.CustomerAddressLine1 = $scope.searchResult[i].CustomerAddressLine1;
                                $scope.serviceRequest.CustomerAddressLine2 = $scope.searchResult[i].CustomerAddressLine2;
                                $scope.serviceRequest.CustomerAddressLine3 = $scope.searchResult[i].CustomerAddressLine3;
                                $scope.serviceRequest.CustomerPostcode = $scope.searchResult[i].CustomerPostcode;
                                $scope.serviceRequest.CustomerNotes = $scope.searchResult[i].CustomerNotes;
                                $scope.serviceRequest.addtype = $scope.serviceRequest.DelieveryAddress;
                            }


                        }
                        if ($scope.searchResult.length <= 0) {
                            for (var i = 0; i < $scope.serviceRequest.Address.length; i++) {
                                if (DelieveryAddress == $scope.serviceRequest.Address[i].code.trim()) {
                                    $scope.serviceRequest.CustomerAddressLine1 = $scope.serviceRequest.Address[i].CustomerAddressLine1;
                                    $scope.serviceRequest.CustomerAddressLine2 = $scope.serviceRequest.Address[i].CustomerAddressLine2;
                                    $scope.serviceRequest.CustomerAddressLine3 = $scope.serviceRequest.Address[i].CustomerAddressLine3;
                                    $scope.serviceRequest.CustomerPostcode = $scope.serviceRequest.Address[i].CustomerPostcode;
                                    $scope.serviceRequest.addtype = $scope.serviceRequest.Address[i].code;
                                }
                            }
                        }



                    };

                    var addMonths = function (d, months) {
                        d = new Date(+d);
                        d.setMonth(d.getMonth() + months);
                        return d;
                    };

                    var insideWarranty = function (sr, months) {
                        return addMonths(sr.ItemDeliveredOn, months) >= new Date();
                    };

                    $scope.getWarrantyCoveredStatus = function (serviceRequest) {
                        serviceRequest.ManufacturerWarrantyLength = parseInt(serviceRequest.ManufacturerWarrantyLength, 10);
                        serviceRequest.WarrantyLength = parseInt(serviceRequest.WarrantyLength, 10);
                        if (serviceRequest.ItemDeliveredOn) {
                            serviceRequest.ItemDeliveredOn = moment(serviceRequest.ItemDeliveredOn).toDate();
                        }
                        var status = 'None';

                        if (insideWarranty(serviceRequest, serviceRequest.ManufacturerWarrantyLength || 0) &&
                            (serviceRequest.ManufacturerWarrantyContractNumber !== undefined && serviceRequest.ManufacturerWarrantyContractNumber !== "Man001" ||
                                (serviceRequest.ManufacturerWarrantyContractNo !== undefined && serviceRequest.ManufacturerWarrantyContractNo !== "Man001"))) {
                            status = 'Manufacturer Warranty';
                        } else if (insideWarranty(serviceRequest, (serviceRequest.WarrantyLength || 0) + (serviceRequest.ManufacturerWarrantyLength || 0)) &&
                            (serviceRequest.WarrantyContractNumber !== undefined && serviceRequest.WarrantyContractNumber !== "Man001" ||
                                (serviceRequest.WarrantyContractNo !== undefined && serviceRequest.WarrantyContractNo !== "Man001"))) {
                            if (serviceRequest.WarrantyType === 'I') {
                                status = 'Instant Replacement';
                            } else {
                                status = 'Extended Warranty';
                            }
                        }

                        return status;
                    };

                    $scope.getWarrantyCoveredContractNumber = function (serviceRequest) {
                        var status = this.getWarrantyCoveredStatus(serviceRequest);

                        if (status === 'Manufacturer Warranty') {
                            return serviceRequest.ManufacturerWarrantyContractNumber;
                        } else {
                            return serviceRequest.WarrantyContractNumber;
                        }
                    };

                    // Assigning search result to sr model.
                    $scope.hasShow = true;
                    $scope.AssignInternal = function (row) {

                        xhr.post(url.resolve('/Merchandising/Products/GetBySku?sku=' + row.ItemNumber), $scope.serviceRequest)
                            .success(function (data) {
                                if (data && data.Hierarchy) {
                                    $scope.serviceRequest.ProductLevel_1 = $scope.hierarchy.Division = data.Hierarchy.division;
                                    $scope.serviceRequest.ProductLevel_2 = $scope.hierarchy.Department = data.Hierarchy.department;
                                    /* jshint ignore:start */
                                    $scope.serviceRequest.ProductLevel_3 = $scope.hierarchy.Class = data.Hierarchy.class;
                                    /* jshint ignore:end */

                                    try {
                                        $scope.saveHierarchySettings($scope.serviceRequest.ProductLevel_1, 'Division');
                                    }
                                    catch (err) { }
                                    try {
                                        $scope.saveHierarchySettings($scope.serviceRequest.ProductLevel_2, 'Department');
                                    }
                                    catch (err) { }
                                    try {
                                        $scope.saveHierarchySettings($scope.serviceRequest.ProductLevel_3, 'Class');
                                    }
                                    catch (err) { }
                                }
                            });

                        $scope.serviceRequest.addtype = row.addtype;                        $scope.serviceRequest.Address = row.Address;
                        $scope.searchResult = row.Address;
                        $scope.serviceRequest.DelieveryAddress = row.addtype.trim();
                                                
                        $scope.serviceRequest.Type = $scope.srType;                        if ($scope.serviceRequest.Type === 'S') {
                            $scope.hasShow = false;
                        }
                        $scope.serviceRequest.CustomerId = row.CustomerId;
                        $scope.serviceRequest.CustomerTitle = row.CustomerTitle;
                        $scope.serviceRequest.CustomerFirstName = row.CustomerFirstName;
                        $scope.serviceRequest.CustomerLastName = row.CustomerLastName;
                        $scope.serviceRequest.CustomerAddressLine1 = row.CustomerAddressLine1;
                        $scope.serviceRequest.CustomerAddressLine2 = row.CustomerAddressLine2;
                        $scope.serviceRequest.CustomerAddressLine3 = row.CustomerAddressLine3;
                        $scope.serviceRequest.CustomerPostcode = row.CustomerPostcode;
                        $scope.serviceRequest.CustomerNotes = row.CustomerNotes;
                        $scope.serviceRequest.ItemId = row.ItemId;
                        $scope.serviceRequest.ItemNumber = row.ItemNumber;
                        $scope.serviceRequest.ProductLevel_1 = $scope.hierarchy.Division = row.ProductLevel_1;
                        $scope.serviceRequest.ProductLevel_2 = $scope.hierarchy.Department = row.ProductLevel_2;
                        $scope.serviceRequest.ProductLevel_3 = $scope.hierarchy.Class = row.ProductLevel_3;
                        $scope.serviceRequest.Manufacturer = row.Manufacturer;
                        $scope.serviceRequest.ItemAmount = row.ItemAmount;
                        $scope.serviceRequest.ItemSoldOn = row.ItemSoldOn;
                        $scope.serviceRequest.ItemSoldBy = row.ItemSoldByName;
                        $scope.serviceRequest.ItemDeliveredOn = row.ItemDeliveredOn;
                        $scope.serviceRequest.ItemStockLocation = row.ItemStockLocation;
                        $scope.serviceRequest.LineItemIdentifier = row.LineItemIdentifier;
                        $scope.serviceRequest.Item = row.Item;
                        $scope.serviceRequest.StockItem = {
                            CostPrice: row.ItemCostPrice
                        };
                        $scope.serviceRequest.ItemSupplier = row.ItemSupplier;
                        $scope.serviceRequest.WarrantyNumber = row.WarrantyNumber;
                        $scope.serviceRequest.WarrantyContractNo = row.WarrantyContractNumber;
                        $scope.serviceRequest.WarrantyContractId = row.WarrantyContractId;
                        $scope.serviceRequest.WarrantyLength = parseInt(row.WarrantyLength, 10);
                        $scope.serviceRequest.ManufacturerWarrantyNumber = row.ManufacturerWarrantyNumber;
                        $scope.serviceRequest.ManufacturerWarrantyContractNo = row.ManufacturerWarrantyContractNumber;
                        $scope.serviceRequest.ManufacturerWarrantyLength = parseInt(row.ManufacturerWarrantyLength, 10);
                        $scope.serviceRequest.Retailer = row.Retailer;
                        $scope.serviceRequest.ItemSerialNumber = row.ItemSerialNumber;

                        $scope.serviceRequest.History = row.History;
                        $scope.serviceRequest.HistoryCharges = row.HistoryCharges;
                        $scope.serviceRequest.ScriptAnswer = row.ScriptAnswer;

                        //Quite hackky. Assigning directly doesn't work.
                        if (row.Contacts) {
                            contacts.pop();
                            _.each(row.Contacts, function (c) {
                                contacts.push({
                                    Type: c.Type,
                                    Value: c.Value
                                });
                            });
                        }

                        $scope.serviceRequest.InvoiceNumber = row.InvoiceNumber || row.ItemInvoiceNo;
                        $scope.serviceRequest.Account = row.Account;

                        convertDate(requestDateItems, $scope.serviceRequest);
                        checkCostWarnings();
                    };

                    $scope.createServiceRequestFromCurrentRequest = function () {
                        $scope.serviceRequest.RepairType = null;
                        $scope.srType = $scope.serviceRequest.Type;
                        var row = {
                            Account: $scope.serviceRequest.Account,
                            CustomerId: $scope.serviceRequest.CustomerId,
                            CustomerTitle: $scope.serviceRequest.CustomerTitle,
                            CustomerFirstName: $scope.serviceRequest.CustomerFirstName,
                            CustomerLastName: $scope.serviceRequest.CustomerLastName,
                            CustomerAddressLine1: $scope.serviceRequest.CustomerAddressLine1,
                            CustomerAddressLine2: $scope.serviceRequest.CustomerAddressLine2,
                            CustomerAddressLine3: $scope.serviceRequest.CustomerAddressLine3,
                            CustomerPostcode: $scope.serviceRequest.CustomerPostcode,
                            CustomerNotes: $scope.serviceRequest.CustomerNotes,
                            ItemId: $scope.serviceRequest.ItemId,
                            ItemNumber: $scope.serviceRequest.ItemNumber,
                            ItemAmount: $scope.serviceRequest.ItemAmount,
                            ItemSoldOn: $scope.serviceRequest.ItemSoldOn,
                            ItemSoldByName: $scope.serviceRequest.ItemSoldBy,
                            ItemDeliveredOn: $scope.serviceRequest.ItemDeliveredOn,
                            ItemStockLocation: $scope.serviceRequest.ItemStockLocation,
                            LineItemIdentifier: $scope.serviceRequest.LineItemIdentifier,
                            Item: $scope.serviceRequest.Item,
                            ItemCostPrice: $scope.serviceRequest.StockItem.CostPrice,
                            ItemSupplier: $scope.serviceRequest.ItemSupplier,
                            WarrantyNumber: $scope.serviceRequest.WarrantyNumber,
                            WarrantyContractNumber: $scope.serviceRequest.WarrantyContractNo,
                            WarrantyLength: $scope.serviceRequest.WarrantyLength,
                            ManufacturerWarrantyNumber: $scope.serviceRequest.ManufacturerWarrantyNumber,
                            ManufacturerWarrantyContractNumber: $scope.serviceRequest.ManufacturerWarrantyContractNo,
                            ManufacturerWarrantyLength: $scope.serviceRequest.ManufacturerWarrantyLength,
                            Retailer: $scope.serviceRequest.Retailer,
                            ItemSerialNumber: $scope.serviceRequest.ItemSerialNumber,
                            Manufacturer: $scope.serviceRequest.Manufacturer,
                            ProductLevel_1: $scope.hierarchy.Division || $scope.serviceRequest.ProductLevel_1,
                            ProductLevel_2: $scope.hierarchy.Department || $scope.serviceRequest.ProductLevel_2,
                            ProductLevel_3: $scope.hierarchy.Class || $scope.serviceRequest.ProductLevel_3,

                            History: $scope.serviceRequest.History,
                            HistoryCharges: $scope.serviceRequest.HistoryCharges,

                            ScriptAnswer: $scope.serviceRequest.ScriptAnswer,
                            Contacts: []
                        };
                        _.each($scope.serviceRequest.Contacts, function (c) {
                            row.Contacts.push({
                                Type: c.Type,
                                Value: c.Value
                            });
                        });

                        $scope.serviceRequest = {};
                        $location.url($location.url().substring(0, $location.url().lastIndexOf('/')), true);

                        $scope.AssignInternal(row);

                        $scope.serviceRequest.CreatedBy = $scope.MasterData.User.UserName;
                        $scope.serviceRequest.CreatedById = $scope.MasterData.User.UserId;
                        $scope.serviceRequest.Branch = $scope.MasterData.User.Branch;
                        $scope.serviceRequest.CreatedOn = new Date();
                        $scope.serviceRequest.Parts = [];
                        $scope.serviceRequest.PaymentBalance = 0;

                        $scope.serviceRequestCreateFromOtherServiceRequest = true;
                    };

                    // Add and remove from forms.
                    $scope.addResolutionPart = function () {
                        if ((!$scope.serviceRequest.RepairType && !($scope.serviceRequest.Type === 'II' ||
                            $scope.serviceRequest.Type === 'IE')) || $scope.serviceRequest.State === 'Awaiting payment') {
                            return;
                        }

                        $scope.newPart = {};
                        $scope.addNewPart = true;
                    };

                    $scope.removeResolutionPart = function (part) {
                        for (var i = 0, ii = Parts.length; i < ii; i++) {
                            if (part === Parts[i]) {
                                $scope.serviceRequest.Parts.splice(i, 1);
                            }
                        }
                    };

                    $scope.partTypeRequired = function () {
                        if (!$scope.MasterData.SupplierCostMatrix || !$scope.addNewPart) {
                            return false;
                        }

                        return $scope.MasterData.SupplierCostMatrix.length > 0;
                    };

                    $scope.partDataComplete = function () {
                        return $scope.newPart &&
                            $scope.newPart.Source &&
                            $scope.newPart.quantity &&
                            ($scope.newPart.CostPrice ||
                                $scope.newPart.Source === 'Internal') &&
                            $scope.newPart.description &&
                            (!$scope.partTypeRequired() ||
                                $scope.newPart.type);
                    };

                    $scope.saveNewPart = function () {

                        var cosacsTaxType = $scope.MasterData.Settings.TaxType;

                        if ($scope.newPart.Source !== 'Internal') {
                            if (cosacsTaxType === 'I') { // tax type inclusive
                                $scope.newPart.CostPrice = $scope.newPart.CostPrice / (1 + ($scope.newPart.TaxRate || $scope.MasterData.Settings.TaxRate) / 100);
                            }
                        }

                        Parts.push({
                            number: $scope.newPart.number,
                            type: $scope.newPart.type,
                            Source: $scope.newPart.Source,
                            quantity: $scope.newPart.quantity,
                            CostPrice: $scope.newPart.CostPrice,
                            CashPrice: $scope.newPart.CashPrice,
                            TaxAmount: $scope.newPart.TaxAmount,
                            TaxRate: $scope.newPart.TaxRate || $scope.MasterData.Settings.TaxRate,
                            price: $scope.newPart.CashPrice || $scope.newPart.CostPrice,
                            description: $scope.newPart.description,
                            stockbranch: $scope.newPart.stockbranch,
                            stockbranchname: $scope.newPart.stockbranchname
                        });

                        $scope.newPart = null;
                        $scope.addNewPart = false;
                    };

                    $scope.cancelNewPart = function () {
                        $scope.addNewPart = false;
                        return false;
                    };

                    $scope.addContact = function () {
                        contacts.push({
                            Type: _.values($scope.MasterData.ContactTypes)[0],
                            Value: ''
                        });
                    };

                    $scope.removeContact = function (contact) {
                        for (var i = 0, ii = contacts.length; i < ii; i++) {
                            if (contact === contacts[i]) {
                                $scope.serviceRequest.Contacts.splice(i, 1);
                            }
                        }
                    };

                    $scope.addFoodLoss = function () {
                        FoodLoss.push({
                            item: '',
                            value: ''
                        });
                    };

                    $scope.removeFoodLoss = function (lossItem) {
                        for (var i = 0, ii = FoodLoss.length; i < ii; i++) {
                            if (lossItem === FoodLoss[i]) {
                                $scope.serviceRequest.FoodLoss.splice(i, 1);
                            }
                        }
                    };

                    $scope.printFoodLoss = function () {
                        url.open("/Service/Requests/PrintFoodLoss/" + $scope.serviceRequest.Id);
                    };

                    $scope.save = _.debounce(function () {
                        saving = true;                     
                        var flagNewRequest = true;
                        if (isNewRequest()) {
                            $scope.serviceRequest.CreatedBy = $scope.MasterData.User.UserName;
                            $scope.serviceRequest.CreatedById = $scope.MasterData.User.UserId;
                            $scope.serviceRequest.Branch = $scope.MasterData.User.Branch;
                            /// flagNewRequest = true;
                        }

                        checkCostWarnings();

                        $scope.tableServiceStatus.evaluate($scope);

                        $scope.serviceRequest.FaultTags = [];
                        if ($scope.serviceRequest.FaultTagsArray) {
                            _.each($scope.serviceRequest.FaultTagsArray, function (t) {
                                $scope.serviceRequest.FaultTags.push({
                                    Tag: t.trim()
                                });
                            });
                        }

                        if ($scope.serviceRequest.DepositAuthorised &&
                            $scope.serviceRequest.DepositRequired === $scope.serviceRequest.DepositFromMatrix) {
                            $scope.serviceRequest.DepositAuthorised = false; // clear authorisation if not necessary
                        }

                        //Added by Gurpreet - CR2018-010 - 31/10/18 - Setting of max no. of Jobs & Validation with allocated jobs for a technician.

                        var maxJobs = new Number($scope.MaxJob);
                        var currentJobs = new Number($scope.CurrJob);
                        var selectedTechId = new Number($scope.SelectTechnicianId);

                        if (flagNewRequest === true && $scope.sections.allocationEntireSection.visible === true) {                            if ($scope.techSelect.AllocationTechnician == "") {
                                notification.show('Technician allocation Can not be blank must be select any one');
                                $("#techy").focus();
                                saving = false;
                                return false;
                            }
                            if (maxJobs > currentJobs) {
                                xhr.post(url.resolve('/Service/Requests'), $scope.serviceRequest)
                                    .success(function (data) {
                                        $location.path(url.resolve('/Service/Requests/') + data.Id);
                                        id = $scope.serviceRequest.Id = data.Id;

                                        setTechnicianAssignedOnLoad();
                                        
                                        if (data.techError) {
                                            alert('Service Request was saved but the selected slot for technician allocation is no longer valid. \r\n' +
                                                'Please choose a new slot and save again.', 'Request Partially Saved');
                                        } else {
                                            notification.show('Service Request saved successfully.');
                                            $scope.weeks = [];
                                            $("#s2id_techy").find('span').text("Select Technician");
                                            if ($scope.serviceRequest.Comment) {
                                                RequestComments.push({
                                                    Date: moment(data.lastUpdated.LastUpdatedOn).toDate(),
                                                    AddedBy: data.lastUpdated.LastUpdatedUserName,
                                                    Comment: $scope.serviceRequest.Comment
                                                });
                                                RequestComments = _.sortBy(RequestComments, function (item) {
                                                    return (+item.Date);
                                                });
                                                $scope.serviceRequest.RequestComments = RequestComments.reverse();
                                                $scope.serviceRequest.Comment = "";
                                            }
                                        }

                                        var newSavedSrPageUrl = $location.absUrl();
                                        if (data.Id && newSavedSrPageUrl && $scope.serviceRequestCreateFromOtherServiceRequest) {
                                            $scope.serviceRequestCreateFromOtherServiceRequest = false;
                                            // Service requests created from other SR's must be reloaded right after their first valid save.
                                            window.location.replace(newSavedSrPageUrl); // So now we'll reload this newly saved SR...
                                        }
                                        $scope.dataId = data.Id;
                                        saving = false;                                        window.location = $location.url();
                                    }).error(function () {
                                        saving = false;
                                    });
                            }
                            else {                                
                                getConfirmationDialouge(selectedTechId);                                
                            }
                        } //CR2018-010 Changes End
                        else {
                            xhr.post(url.resolve('/Service/Requests'), $scope.serviceRequest)
                                .success(function (data) {
                                    $location.path(url.resolve('/Service/Requests/') + data.Id);
                                    id = $scope.serviceRequest.Id = data.Id;

                                    setTechnicianAssignedOnLoad();

                                    if (data.techError) {
                                        alert('Service Request was saved but the selected slot for technician allocation is no longer valid. \r\n' +
                                            'Please choose a new slot and save again.', 'Request Partially Saved');
                                    } else {
                                        notification.show('Service Request saved successfully.');
                                        $scope.weeks = [];
                                        $("#s2id_techy").find('span').text("Select Technician");
                                        if ($scope.serviceRequest.Comment) {
                                            RequestComments.push({
                                                Date: moment(data.lastUpdated.LastUpdatedOn).toDate(),
                                                AddedBy: data.lastUpdated.LastUpdatedUserName,
                                                Comment: $scope.serviceRequest.Comment
                                            });
                                            RequestComments = _.sortBy(RequestComments, function (item) {
                                                return (+item.Date);
                                            });
                                            $scope.serviceRequest.RequestComments = RequestComments.reverse();
                                            $scope.serviceRequest.Comment = "";
                                        }
                                    }

                                    var newSavedSrPageUrl = $location.absUrl();
                                    if (data.Id && newSavedSrPageUrl && $scope.serviceRequestCreateFromOtherServiceRequest) {
                                        $scope.serviceRequestCreateFromOtherServiceRequest = false;
                                        // Service requests created from other SR's must be reloaded right after their first valid save.
                                        window.location.replace(newSavedSrPageUrl); // So now we'll reload this newly saved SR...
                                    }

                                    saving = false;                                    window.location = $location.url();
                                }).error(function () {
                                    saving = false;
                                });
                        }
                        //CR2018-010 Changes End
                    }, 1000);

                    $scope.saveComment = function () {
                        xhr.put(url.resolve('/Service/Requests/SaveComment?serviceRequest=' + $scope.serviceRequest.Id + '&comment=' + $scope.serviceRequest.Comment))
                            .success(function (data) {
                                if ($scope.serviceRequest.Comment) {
                                    RequestComments.push({
                                        Date: moment(data.lastUpdated.LastUpdatedOn).toDate(),
                                        AddedBy: data.lastUpdated.LastUpdatedUserName,
                                        Comment: $scope.serviceRequest.Comment
                                    });
                                    RequestComments = _.sortBy(RequestComments, function (item) {
                                        return (+item.Date);
                                    });
                                    $scope.serviceRequest.RequestComments = RequestComments.reverse();
                                    $scope.serviceRequest.Comment = "";
                                }
                            });
                    };

                    $scope.RequiredCustomer = function () {
                        return $scope.serviceRequest.Type !== 'S';
                    };

                    $scope.RequiredItemSerial = function () {
                        return (!(_.isEmpty($scope.serviceRequest.Resolution)) && $scope.sections.resolutionEntireSection.visible === true);
                    };

                    $scope.RequiredItemRepairType = function () {
                        return (!(_.isEmpty($scope.serviceRequest.Resolution)) && $scope.sections.resolutionEntireSection.visible === true && $scope.serviceRequest.State === "Awaiting repair");
                    };

                    $scope.RequiredItemStockLocation = function () {
                        return $scope.serviceRequest.Type !== 'II' && $scope.serviceRequest.Type !== 'SI' && $scope.serviceRequest.Type !== 'S'; //required if: SE,IE
                    };

                    $scope.RequiredResolutionDate = function () {
                        if ($scope.sections.resolutionEntireSection && $scope.sections.resolutionEntireSection.visible === true) {
                            if ($scope.sections.finalise.resolutionDateRequired === true) {
                                return true;
                            }
                        }
                        return false;
                    };

                    $scope.print = function () {
                        url.open("/Service/Requests/Print/" + $scope.serviceRequest.Id);
                    };
                    $scope.printInvoice = function () {
                        window.open('/courts.net.ws/WTaxInvoice.aspx?customerID=&acctNo=' + encodeURI($scope.serviceRequest.Account) + '&RequestId=' + encodeURI($scope.serviceRequest.Id) +
                            '&accountType=&culture=&country=' + encodeURI($scope.MasterData.User.Country.substring(0, 1)) + '&branch=' + encodeURI($scope.serviceRequest.ItemStockLocation) +
                            '&buffno=&creditNote=false&multiple=false&user=' + encodeURI($scope.MasterData.User.UserId) + '&IsProofofPurchase=true');
                    };

                    var isSelectedSlotBeforePartsArrival = function (selectedSlotDay, allocationPartExpectDay) {
                        var datesOk = true,
                            retVal;

                        if (selectedSlotDay === undefined || selectedSlotDay === null) {
                            datesOk = false;
                        }
                        if (allocationPartExpectDay === undefined || allocationPartExpectDay === null) {
                            datesOk = false;
                        }

                        var OneDay = 1000 * 60 * 60 * 24;
                        if (datesOk && (selectedSlotDay <= new Date(+allocationPartExpectDay - OneDay))) {
                            retVal = true;
                            $scope.LastSelectedSlotMemory = {
                                selectedSlotDay: selectedSlotDay,
                                allocationPartExpectDay: allocationPartExpectDay
                            };
                            notification.show("Cannot allocated technician before spare parts arrive (Parts Expected On).", "Awaiting spare parts.");
                        } else {
                            retVal = false;
                        }

                        return retVal;
                    };

                    $scope.slotPopup = function (selectedSlot, day) {
                        if (!$scope.hasPermission('AddBooking')) {
                            alert('You do not have permission to add or modify bookings.', 'No Permission.');
                            return;
                        }
                        if (selectedSlot.booking || selectedSlot.holiday || selectedSlot.publicHoliday) {
                            return;
                        }
                        if (isSelectedSlotBeforePartsArrival(day, $scope.serviceRequest.AllocationPartExpectOn)) {
                            return;
                        }
                        calendar.addSelected({
                            day: day,
                            techId: parseInt($scope.techSelect.AllocationTechnician, 10),
                            selectedSlot: selectedSlot.slot,
                            id: parseInt(id, 10),
                            slots: null,
                            allocationType: $scope.serviceRequest.AllocationType
                        });
                        updateCalendar();
                        var save = calendar.saveDetail();

                        var technician = _.find($scope.Technicians, function (item) {
                            return item.UserId === save.techId;
                        });
                        $scope.AllocatedTechName = technician.Name;
                        $scope.serviceRequest.AllocationTechnicianIsInternal = technician.Internal;

                        $scope.serviceRequest.AllocationServiceScheduledOn = save.date;
                        $scope.resolutionDatePickerSettings.minDate = save.date;
                        $scope.serviceRequest.AllocationSlots = save.slot;
                        $scope.serviceRequest.AllocationSlotExtend = save.slotExtend;
                        $scope.serviceRequest.AllocationTechnician = save.techId;
                        $scope.serviceRequest.AllocationOn = new Date();
                    };

                    $scope.deleteAllocation = function () {
                        if ($scope.hasPermission('DeleteBooking')) {
                            if (!$scope.serviceRequest.TechnicianDeleteReason && technicianAssignedOnLoad) {
                                dialogue.headerText = 'Delete Booking? ';
                                dialogue.bodyText = ' Are you sure you wish to remove this booking?';
                                dialogue.selected = null;
                                dialogue.actionButtonClick = function () {
                                    $scope.serviceRequest.TechnicianBookingDeleteReason = dialogue.selected;

                                    dialogue.show = false;
                                    $scope.serviceRequest.AllocationServiceScheduledOn = null;
                                    $scope.resolutionDatePickerSettings.minDate = null;

                                    if (calendar) {
                                        calendar.removeAllSelected();
                                        updateCalendar();
                                    }

                                    $('#dialogueCommon').modal('hide');
                                };
                                dialogue.CancelClicked = function () {
                                    dialogue.show = false;
                                    $('#dialogueCommon').modal('hide');
                                };
                                dialogue.actionButtonText = 'Delete';
                                dialogue.cancelButtonText = 'Cancel';

                                dialogue.showAlternate = false;
                                dialogue.show = true;
                                $('#dialogueCommon').modal();
                                dialogue.hideSelect = false;
                                dialogue.placeholder = 'Select Reason for deleting';
                                dialogue.options = _.values($scope.MasterData.ServiceTechReasons);
                            }
                        }
                    };

                    $scope.makePayment = function () {
                        var customerId = $scope.serviceRequest.ResolutionPrimaryCharge === 'Deliverer' ? $scope.serviceRequest.ResolutionDelivererToCharge : $scope.serviceRequest.CustomerId;
                        $rootScope.$broadcast('makePayment', {
                            ServiceRequestNo: $scope.serviceRequest.Id,
                            Branch: $scope.serviceRequest.Branch,
                            CustomerId: customerId,
                            EmpeeNo: $scope.MasterData.User.UserId,
                            ChargeType: $scope.serviceRequest.ResolutionPrimaryCharge,
                            Amount: $scope.getOutstandingDeposit() > 0 ? $scope.getOutstandingDeposit() : $scope.OutstandingBalance,
                            ServiceBranch: $scope.serviceRequest.Branch
                            //Amount: $scope.getOutstandingDeposit() > 0 ? Math.round($scope.getOutstandingDeposit()*100)/100 : Math.round($scope.OutstandingBalance*100)/100
                        });
                    };

                    $scope.dayOnly = function () {
                        return $scope.weeks[0].length === 1 ? 'dayOnly' : '';
                    };

                    $scope.getRepairTotal = function (requestId) {
                        return _.reduce($scope.serviceRequest.HistoryCharges, function (memo, previousCharge) {
                            if (previousCharge.RequestId === requestId) {
                                return memo + previousCharge.Value;
                            } else {
                                return memo;
                            }
                        }, 0);
                    };

                    $scope.getOutstandingDeposit = function () {
                        if ($scope.serviceRequest.PaymentBalance >= $scope.serviceRequest.DepositRequired) {
                            return 0;
                        } else {
                            return ($scope.serviceRequest.DepositRequired - ($scope.serviceRequest.PaymentBalance || 0));
                        }
                    };

                    $scope.getTotalTaxAmount = function () {
                        var total = _.reduce($scope.serviceRequest.Charges, function (memo, charge) {
                            return memo + (charge.Tax || 0);
                        }, 0);
                        return total;
                    };

                    $scope.estimateRequired = function () {
                        var allocatedToTechnicianForEstimate = $scope.serviceRequest.AllocationType === 'Estimate' && $scope.serviceRequest.AllocationTechnician;
                        var awaitingEstimate = $scope.serviceRequest && $scope.serviceRequest.State === 'Awaiting estimate';

                        return ($scope.EvaluationRequired && !allocatedToTechnicianForEstimate) || awaitingEstimate;
                    };

                    $scope.depositRequired = function () {
                        var totalEstimate = $scope.serviceRequest.EstimateLabourCost + $scope.serviceRequest.EstimateAdditionalLabourCost + $scope.serviceRequest.EstimateTransportCost;
                        return ($scope.EvaluationRequired && totalEstimate > 0 && $scope.serviceRequest.State !== 'Awaiting estimate');
                    };

                    $scope.scrollTo = function (target) {
                        var position = 0;
                        if ($(target).position()) {
                            position = $(target).position().top;
                        }

                        $(window).scrollTop(position);
                    };

                    $scope.cancelReceiptPrinting = function () {
                        $scope.receipt = {};
                        $('#paymentReceipt-modal').modal('hide');
                    };

                    $scope.$on('stockResult', function (event, data) {
                        if (data) {
                            $scope.serviceRequest.ItemNumber = data.ItemNumber;
                            $scope.serviceRequest.Item = data.Description2;
                            $scope.serviceRequest.ItemSupplier = data.Supplier;
                            $scope.serviceRequest.ItemStockLocation = data.Location;
                            $scope.serviceRequest.ItemAmount = data.CashPrice;
                            $scope.serviceRequest.ManufacturerWarrantyLength = data.WarrantyLength;
                        }
                    });

                    $scope.$on('partResult', function (event, data) {
                        if (data) {
                            $scope.newPart.number = data.part.ItemNumber;
                            $scope.newPart.description = data.part.Description2;
                            //$scope.PartSources.push('Internal');
                            $scope.newPart.Source = 'Internal';
                            $scope.newPart.stockbranch = data.part.Location;
                            if (data.part.Location) {
                                pickList.k2v('BRANCH', data.part.Location, function (rows) {
                                    safeApply(function () {
                                        $scope.newPart.stockbranchname = rows[data.part.Location];
                                    });
                                });
                            }
                            $scope.newPart.CashPrice = data.part.CashPrice || 0;
                            $scope.newPart.CostPrice = data.part.CostPrice;
                            $scope.newPart.TaxAmount = data.part.TaxAmount || 0;
                            $scope.newPart.TaxRate = data.part.TaxRate;
                        }
                    });

                    $scope.$on('updatePaymentBalance', function (event, data) {
                        if (data) {
                            $scope.serviceRequest.PaymentBalance = $scope.serviceRequest.PaymentBalance + parseFloat(data.Amount);
                            $scope.calculateOutstandingBalance();
                        }
                    });

                    $scope.$on('paymentDone', function (event, data) {
                        $scope.isPrintDone = false;

                        var balanceTotal = data.balanceTotal || 0;
                        var amount = data.payment || 0;
                        var customerName = $scope.serviceRequest.CustomerTitle + ' ' +
                            $scope.serviceRequest.CustomerFirstName + ' ' + $scope.serviceRequest.CustomerLastName;

                        $scope.receipt = {
                            branchName: $scope.MasterData.UserUranchName,
                            branchAddress1: $scope.MasterData.BranchAddress1,
                            branchAddress2: $scope.MasterData.BranchAddress2,
                            branchAddress3: $scope.MasterData.BranchAddress3,
                            vatRegistration: $scope.MasterData.TaxNo,
                            customerName: customerName,
                            customerAddress1: $scope.serviceRequest.CustomerAddressLine1,
                            customerAddress2: $scope.serviceRequest.CustomerAddressLine2,
                            customerAddress3: $scope.serviceRequest.CustomerAddressLine3,
                            DELTitleC: $scope.serviceRequest.DELTitleC,
                            DELFirstName: $scope.serviceRequest.DELFirstName,
                            DELLastName: $scope.serviceRequest.DELLastName,
                            referenceNumber: $scope.serviceRequest.Id,
                            datePaid: new Date(),
                            paymentTotal: 100,
                            balanceTotal: balanceTotal,
                            type: data.payMethod,
                            amount: amount,
                            tendered: data.tendered || 0,
                            balance: balanceTotal - amount,
                            change: data.change || 0
                        };
                        $('#paymentReceipt-modal').modal();
                    });

                    $scope.saveHierarchySettings = function (tag, level) {
                        switch (level) {
                            case 'Division':
                                $scope.serviceRequest.ProductLevel_1 = getHierarchyId('Division', tag);
                                break;

                            case 'Department':
                                $scope.serviceRequest.ProductLevel_2 = getHierarchyId('Department', tag);
                                break;

                            case 'Class':
                                $scope.serviceRequest.ProductLevel_3 = getHierarchyId('Class', tag);
                                break;
                        }
                    };
                    $scope.hierarchyOptions = [];
                    $scope.hierarchy = {};

                    $scope.productItem = {
                        edit: true,
                        level_1_required: true,
                        level_2_required: true,
                        level_3_required: true,
                        IsGroupFilter: true
                    };

                    function transformTags(options) {
                        // adapt data to diego's list control {k:v..kn:vn}
                        _.each(options, function (level) {
                            level.key = level.name;


                            level.tags = _.object(_.map(level.tags, function (tag) {
                                return [tag.id, tag.name];
                            }));
                            level.value = level.tags;

                            delete level.id;
                            delete level.name;
                            delete level.tags;

                            return level;
                        });
                    }

                    function loadHierarchy() {
                        xhr.get(url.resolve('Merchandising/Hierarchy/Get'))
                            .success(function (response) {
                                $scope.hierarchyOptions = [];
                                var options = response.data;

                                transformTags(options);

                                var model = {};
                                _.each(options, function (v, k) {
                                    if (v) {
                                        model[k] = v;
                                        model[k].originalValue = model[k].value;
                                        model[k].value = _.values(model[k].value);
                                    }
                                });
                                $scope.hierarchyOptions = model;

                                $scope.hierarchy = createRecordHierarchy();
                            });
                    }

                    function createRecordHierarchy() {
                        return {
                            Division: getHierarchyDescription('Division', $scope.serviceRequest, 'ProductLevel_1'),
                            Department: getHierarchyDescription('Department', $scope.serviceRequest, 'ProductLevel_2'),
                            Class: getHierarchyDescription('Class', $scope.serviceRequest, 'ProductLevel_3')
                        };
                    }

                    function getHierarchyDescription(member, laborItem, property) {
                        if (laborItem[property]) {
                            return _.find($scope.hierarchyOptions, function (c) {
                                return c.key === member;
                            }).originalValue[laborItem[property]];
                        }

                        return null;
                    }

                    function getHierarchyId(member, property) {
                        if (property) {
                            return _.find(
                                _.pairs(
                                    _.find($scope.hierarchyOptions, function (c) {
                                        return c.key === member;
                                    }).originalValue),
                                function (c) {
                                    return c[1] === property;
                                })[0];
                        }

                        return null;
                    }
                };

                serviceCtrl.$inject = ['$scope', '$location', '$rootScope', 'xhr', '$filter', '$attrs', '$timeout'];

                app().controller('StockCtrl', stockController)
                    .controller('PaymentCtrl', payments)
                    .controller('AuthoriseController', authoriseController)
                    .controller('ServiceCtrl', serviceCtrl)
                    .controller('PaymentReceiptController', paymentReceiptController)
                    .directive('hierarchy', [hierarchyDirective]);


                return angular.bootstrap($el, ['myApp']);
            }
        };
    });