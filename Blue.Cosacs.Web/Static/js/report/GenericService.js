/* global define */
define([],
    function () {
        "use strict";
        return function ($rootScope) {
            var returnValue = {
                // this has { headers: [[{title: ...}, {title: ...}],[]], rows: [[],[]] }
                onTransform: function(data) { return data; },
                EventsNames: {
                    onSearch: 'genericReportOnSearch',
                    onExport: 'genericReportExport',
                    onClear: 'genericReportClear',
                    onSearching: 'genericReportOnSearching',
                    onExporting: 'genericReportOnExporting',
                    onAfterDisplay: 'genericReportOnAfterDisplay'
                },
                ServerParameters: {
                    ReportId: '',
                    Filter: {},
                    PageIndex: 1,
                    PageSize: 250,
                    PageCount: 0,
                    FileName: ''
                }
            };

            returnValue.onSearch = function () {
                eventRaiser(returnValue.EventsNames.onSearch, function (cancel, postParameters) {
                    if (!cancel) {
                        returnValue.onSearching(postParameters);
                    }
                });
            };
            returnValue.onSearching = function (postParameters) {
                eventRaiser(returnValue.EventsNames.onSearching, postParameters);
            };

            returnValue.onExport = function () {
                eventRaiser(returnValue.EventsNames.onExport, function (cancel, postParameters) {
                    if (!cancel) {
                        eventRaiser(returnValue.EventsNames.onExporting, postParameters);
                    }
                });
            };

            returnValue.onAfterDisplay = function (reportData) {
                eventRaiser(returnValue.EventsNames.onAfterDisplay, reportData);
            };

            returnValue.onClear = function () {
                eventRaiser(returnValue.EventsNames.onClear);
            };

            function eventRaiser(eventName, argument) {
                $rootScope.$broadcast(eventName, argument);
            }

            return returnValue;
        };
    });