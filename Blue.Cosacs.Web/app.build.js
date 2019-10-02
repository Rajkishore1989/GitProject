// see: https://github.com/jrburke/r.js/blob/master/build/example.build.js
({
    appDir: "static/js/",
    baseUrl: ".",
    dir: "../minify/js/",
    /*mainConfigFile: 'static/js/requirejs-config.js',*/
    /*enforceDefine: true,*/
    inlineText: true,
    optimize: "uglify2", // "uglify", // "none", // "closure"
    uglify2: {
        compress: {
            global_defs: {
                DEBUG: false
            }
        },
        drop_console: true
    },
    generateSourceMaps: true,
    preserveLicenseComments: false,
    removeCombined: false,
    insertRequire: ['main'],
    /*wrap: { // for almond
        start: "(function() {",
        end: "window.require = require; }());"
    },*/
    fileExclusionRegExp: /^\.|\.coffee$|^test$|^images$|^css$|^Web.config$|^unused$/,
    "paths": {
        "sortable": "lib/jquery.ui.sortable",
        "backbone": "lib/backbone",
        "console": "lib/console",
        "underscore": "../components/underscore/underscore",
        "underscore.string": "lib/underscore.string",
        "d3": "../components/d3/d3",
        "jquery": "lib/jquery",
        "jquery.ui": "lib/jquery-ui.custom",
        "jquery.message": "lib/jquery.message",
        "jquery.validate": "lib/jquery.validate",
        "jquery.validate.unobtrusive": "lib/jquery.validate.unobtrusive",
        "json": "lib/json2",
        "angular": "lib/angular/angular-module",
        "angular-resource": "lib/angular/angular-resource",
        "angular-sanitize": "lib/angular/angular-sanitize",
        "angular.ui": "lib/angular.ui/angular.ui",
        "angular.bootstrap": "lib/bootstrap/ui-bootstrap-custom",
        "blue.timepicker": "directives/timepicker",
        "moment": "lib/moment",
        "select2": "lib/select2",
        "typeahead": "../components/typeahead.js/dist/typeahead",
        "chosen.jquery": "lib/chosen.jquery",
        "jquery.tmpl": "lib/jquery.tmpl",
        "date": "lib/date",
        "text": "lib/text",
        "growl": "lib/growl",
        "events": "lib/events",
        "codeeditor": "lib/codemirror/codemirror",
        "codeeditor.xml": "lib/codemirror/mode/xml/xml",
        "dropdown": "../components/bootstrap/js/dropdown",
        "modal": "../components/bootstrap/js/modal",
        "affix": "../components/bootstrap/js/affix",
        "tooltip": "../components/bootstrap/js/tooltip",
        "popover": "../components/bootstrap/js/popover"
    },
    "shim": {
        "backbone": {
            "deps": ["underscore", "jquery"],
            "exports": "Backbone"
        },
        "console": {
            "deps": [],
            "exports": "window.console"
        },
        "underscore": {
            "deps": ["jquery"],
            "exports": "_"
        },
        "d3": {
            "exports": "d3"
        },
        "angular.ui": {
            "deps": ["angular", "jquery", "lib/jquery.ui.datepicker.customized"]
        },
        "angular-resource": {
            "deps": ["angular"]
        },
        "angular-sanitize": {
            "deps": ["angular"]
        },
        "angular.bootstrap": {
            "deps": ["angular"]
        },
        "blue.timepicker": {
            "deps": ["angular.ui", "angular.bootstrap", "lib/bootstrap-timepicker"]
        },
        "lib/jquery.ui.datepicker": {
            "deps": ["jquery", "lib/jquery.ui.core", "lib/jquery.ui.widget"],
            "exports": "$.fn.datepicker"
        },
        "sortable": {
            "deps": ["jquery", "lib/jquery.ui.mouse", "lib/jquery.ui.widget"],
            "exports": "$.fn.sortable"
        },
        "jquery.message": {
            "deps": ["jquery"],
            "exports": "$.message"
        },
        "jquery.validate": {
            "deps": ["jquery"],
            "exports": "$.fn.validate"
        },
        "lib/bootstrap/collapse": {
            "deps": ["jquery"],
            "exports": "$.fn.collapse"
        },
        "lib/bootstrap/modal": {
            "deps": ["jquery"],
            "exports": "$.fn.modal"
        },
        "lib/bootstrap/typeahead": {
            "deps": ["jquery"],
            "exports": "$.fn.typeahead"
        },
         "lib/bootstrap/scrollspy": {
            "deps": ["jquery"],
            "exports": "$.fn.scrollspy"
         },
        "popover": {
            "deps": ["tooltip"],
            "exports": "popover"
        },
        "tooltip": {
        //"lib/bootstrap/tooltip": {
            "deps": ["jquery"],
            "exports": "$.fn.tooltip"
        },
        "lib/select2": {
            "deps": ["jquery"],
            "exports": "$.fn.select2"
        },
        "lib/jquery.pjax": {
            "deps": ["jquery"],
            "exports": "$.fn.pjax"
        },        
        "jquery.validate.unobtrusive": ["jquery", "lib/jquery.validate"],
        "lib/jquery.ui.mouse": ["jquery", "lib/jquery.ui.core", "lib/jquery.ui.widget"],
        "jquery.pjax": ["jquery"],
        "jquery.ui": ["jquery"],
        "jquery.form_params": ["jquery"],
        "growl": ["jquery"],
        "underscore.string": ["underscore"],
        "codeeditor": {
            "deps": [],
            "exports": "window.CodeMirror"
        },
        "codeeditor.xml": ["codeeditor"],
        "dropdown": {
            "deps": ["jquery"],
            "exports": "$.fn.dropdown"
        },
        "modal": {
            "deps": ["jquery"],
            "exports": "$.fn.modal"
        },
        "affix": {
            "deps": ["jquery"],
            "exports": "$.fn.affix"
        }
    },
    /*uglify: {
        toplevel: true,
        beautify: false,
        max_line_length: 1000
    },*/
    modules: [{
        name: 'lib/almond',
        //name: "main",
        include: [
            // BEGIN_MODULES
            "main",
            "audit",
            "Hub",
            "recoverPassword",

            "notification",
            "localisation",

            "admin/rolePermission",
            "admin/userRole",
            "admin/sessions",
            "admin/userCreate",
            "admin/users",
            "admin/lockUser",
            "admin/userDetails",
            "admin/userProfile",
            "admin/branchOpeningHours",

            "service/chargesMatrix",
            "service/myPayments",
            "service/partsMatrix",
            "service/serviceRequest",
            "service/supplierCosts",
            "service/search",
            "service/technicianDiary",
            "service/technicianProfile",
            "service/techPrintSearch",
            "service/technicianPayments",

            "config/publicHolidays",
            "config/decisionTableExplorer",
            "config/settingsEditor",

            "warehouse/bookings",
            "warehouse/bookingDetails",
            "warehouse/bookingDisplay",
            "warehouse/bookingItemReject",
            "warehouse/customerPickUps",
            "warehouse/deliveriesSearch",
            "warehouse/deliveryConfirm",
            "warehouse/load",
            "warehouse/loadPrinting",
            "warehouse/picking",
            "warehouse/pickingConfirmation",
            "warehouse/pickingSearch",
            "warehouse/picklistPrinting",
            "warehouse/PickUpNotePrinting",
            "warehouse/schedulePrinting",
            "warehouse/trucks",
            "warehouse/driverPayments",

            "warranty/linkController",
            "warranty/listTest",
            "warranty/warrantyTags",
            "warranty/warrantyPrices",
            "warranty/warrantyPricePromotions",
            "warranty/warrantyController",
            "warranty/warrantyReturn",
            "warranty/warrantyPromotions",
            "warranty/warrantySales",
            "warranty/simulatorController",

            "merchandising/associatedproduct/init",
            "merchandising/cintError/init",
            "merchandising/combo/init",
            "merchandising/export/init",
            "merchandising/goodscosting/init",
            "merchandising/goodsOnLoan/init",
            "merchandising/goodsreceipt/init",
            "merchandising/goodsreceiptdirect/init",
            "merchandising/hierarchy/init",
            "merchandising/location/init",
            "merchandising/perioddata/init",
            "merchandising/product/init",
            "merchandising/productStatus/init",
            "merchandising/promotion/init",
            "merchandising/purchase/init",
            "merchandising/reports/allocatedStockReport/init",
            "merchandising/reports/buyerSalesHistoryReport/init",
            "merchandising/reports/financialQueryReport/init",
            "merchandising/reports/negativeStock/init",
            "merchandising/reports/promotionReport/init",
            "merchandising/reports/salesComparison/init",
            "merchandising/reports/stockMovement/init",
            "merchandising/reports/stockReceived/init",
            "merchandising/reports/stockValue/init",
            "merchandising/reports/summaryUpdateControl/init",
            "merchandising/reports/topSku/init",
            "merchandising/reports/tradingReport/init",
            "merchandising/reports/warehouseOversupplyReport/init",
            "merchandising/reports/weeklyTradingReport/init",
            "merchandising/nonWarrantableItems/init",
            "merchandising/repossessedConditions/init",
            "merchandising/search/initSearch",
            "merchandising/set/init",
            "merchandising/stockAdjustment/init",
            "merchandising/stockAdjustmentReason/init",
            "merchandising/stockAllocation/init",
            "merchandising/stockCount/init",
            "merchandising/stockCountPrevious/init",
            "merchandising/stockCountSchedule/init",
            "merchandising/stockCountStart/init",
            "merchandising/stockMovement/init",
            "merchandising/stockTransfer/init",
            "merchandising/stockRequisition/init",
            "merchandising/supplier/init",
            "merchandising/tagValues/init",
            "merchandising/taxRate/init",
            "merchandising/ticketing/init",
            "merchandising/transactionType/init",
            "merchandising/vendorReturn/init",
            "merchandising/vendorReturnDirect/init",

            "text!Booking/Templates/BookingHistory.htm",
            "text!Booking/Templates/BookingSearch.htm",
            "text!Admin/Templates/UserSearch.htm",
            //"text!admin/templates/Login.htm",

            "report/WeeklySummary",
            "report/GenericReportResult",
            "report/TechnicianRejections",
            "report/GenericService",
            "report/spareParts",
            "report/serviceRequestResolution",
            "report/WarrantyHitRate",
            "report/customerFeedbackHappyCall",
            "report/WarrantyClaims",
            "report/WarrantiesDueRenewal",
            "report/WarrantyReturns",
            "report/secondEffortCandidates",
            "report/outstandingServiceRequests",
            "report/serviceRequestResolution",
            "report/WarrantySales",
            "report/installationHitRate",
            "report/serviceRequestFinancial",
            "report/ServiceFailure",
            "report/ResolutionTimesProductCategory",
            "report/ReplacementData",
            "report/ServiceClaims",
            "report/ServiceIncomeAnalysis",
            "report/monthlyClaimsSummary",
            "report/OutstandingSRsPerProductCategory",
            "report/DeliveryPerformanceSummary",
            "report/WarrantyTransactions",

            "credit/showFileName"

            // END_MODULES
        ]
    }]
})
