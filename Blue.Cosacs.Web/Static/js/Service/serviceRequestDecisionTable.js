/*global define*/
define(['underscore','moment'], function (_, moment) {
        'use strict';
        return function (scope) { // 'Class' declaration.

            return { // the controller :) ...
                "getTypeIsSet": function() {
                    // if sr.Type is not defined, the type selector control should be visible
                    return !_.isEmpty(scope.serviceRequest.Type);
                },
                "getSrTypeIsNull" : function() {
                    return _.isEmpty(scope.serviceRequest.Type);
                },
                "getIfSearchResultArrayIsEmpty": function() {
                    return _.isEmpty(scope.searchResult);
                },
                "structuralRule_hideIfEmptySearchResultArray": function() {
                    return this.getIfSearchResultArrayIsEmpty();
                },
                "structuralRule_hideServiceRequestForm": function() {
                    return !this.getTypeIsSet();
                },
                "structuralRule_showServiceRequestCreationForm": function() {
                    return this.getTypeIsSet();
                },
                "showSearchSelectorInputs": function() {
                    return this._isSearchSelectorInputVisible();
                },
                "showPrintInvoice": function() {
                    return this._isPrintInvoiceVisible();
                },
                "showFormReferenceField": function() {
                    return this._isFormReferenceFieldVisible();
                },
                "_isSearchSelectorInputVisible": function() {
                    return scope.sections.searchSelectorInput.visible || false;
                },
                "_isPrintInvoiceVisible": function() {
                    return scope.sections.showPrintInvoice.visible || false;
                },
                "_isFormReferenceFieldVisible": function() {
                    return scope.sections.formReferenceField.visible || false;
                }
            };
        };
    }
);