/*global define*/
define(['underscore', 'angular', 'angularShared/app', 'notification', 'moment', 'angularShared/interceptor',
        'angularShared/loader', 'jquery.pickList', 'report/GenericReportResult', 'report/GenericService',
        'url', 'angular.ui', 'angular.bootstrap', 'jquery.ui'],

    function (_, angular, app, notification, moment, interceptor, loader, pickList, genericReportResult, GenericService, url) {
        'use strict';
        return {
            init: function ($el) {
                var SecondEffortController = function ($scope, $location, GenericResultService, xhr) {

                    $scope.hasPagination = true;
                    _.extend(GenericResultService.ServerParameters, $location.search(), { PageIndex: 0, PageSize: 250, PageCount: 0, ReportId: 'SecondEffortSolicitation' });
                    $scope.filterParameters = GenericResultService.ServerParameters;

                    $scope.filterParameters = $location.search();
                    if (objectIsEmpty($scope.filterParameters)) {
                        $scope.filterParameters = {};
                    }

                    if (!$scope.filterParameters.CustomerGroup ||
                        isNaN($scope.filterParameters.CustomerGroup)) {
                        $scope.filterParameters.CustomerGroup = "1";
                    }

                    if (!$scope.filterParameters.SalesPersonId) {
                        $scope.filterParameters.SalesPersonId = null;
                    }

                    if (!$scope.filterParameters.Chain) {
                        $scope.filterParameters.Chain = "A";
                    }

                    var settingsModuleNamespace = 'Blue.Cosacs.Report';
                    var settingsModuleCategory = 'Second Effort Solicitation';
                    $scope.ReportSettings = {};
                    xhr.get(url.resolve('/Config/Settings/GetSetting?' +
                        'moduleNamespace=' + settingsModuleNamespace + '&category=' + settingsModuleCategory))
                        .success(function (settings) {
                            var settingsData =
                                _.map(settings, function (setting) {
                                    if (setting.meta) {
                                        return { id: setting.meta.Id, value: setting.value };
                                    } else {
                                        return null;
                                    }
                                });

                            _.each(settingsData, function (setting) {
                                $scope.ReportSettings[setting.id] = setting.value;
                            });
                        });

                    $scope.customersGroups = {
                        1: "Recent missed EW sales",
                        2: "No EW with FYW expiring soon",
                        3: "No EW with recent FYW repair"
                    };

                    $scope.chains = {
                        "A": "All",
                        "C": "Courts",
                        "N": "Lucky Dollar"
                    };

                    var getBranchData = function () {
                        // the $http API is based on the deferred/promise APIs exposed by the $q service
                        // so it returns a promise for us by default
                        return xhr
                            .get(url.resolve('PickLists/Load?ids=BRANCH'))
                            .then(function (data) {
                                return data.data.BRANCH.rows;
                            });
                    };
                    $scope.branches = getBranchData();

                    $scope.salesPersonLabel = 'Sales Person';
                    $scope.branchLabel = 'Branch';
                    $scope.chainLabel = 'Chain';

                    function objectIsEmpty(obj) {
                        if (obj === undefined || obj === null) {
                            return true;
                        }

                        for (var key in obj) {
                            if (obj.hasOwnProperty(key)) {
                                return false;
                            }
                        }

                        return true;
                    }

                    var safeApply = function (fn) {

                        var phase = $scope.$root.$$phase;
                        if (phase === '$apply' || phase === '$digest') {
                            return $scope.$eval(fn);
                        } else {
                            return $scope.$apply(fn);
                        }
                    };

                    $scope.$on(GenericResultService.EventsNames.onSearch, function (e, callBack) {
                        var values = $scope.filterParameters;
                        if (getPostData(values)) {
                            return callBack(false, values); // no errors
                        } else {
                            return callBack(true, null); // signal error
                        }
                    });

                    $scope.$on(GenericResultService.EventsNames.onClear, function () {
                        // clear every field on $scope.filterParameters object and set the appropriate default values if any
                        safeApply(function () {
                            $scope.filterParameters = {};
                            $scope.filterParameters.CustomerGroup = null;
                            $scope.filterParameters.SalesPersonId = null;
                            $scope.filterParameters.Chain = null;
                            $scope.filterParameters.Branch = null;
                        });
                    });

                    $scope.$on(GenericResultService.EventsNames.onExport, function (e, callBack) {
                        var values = $scope.filterParameters;
                        if (getPostData(values)) {
                            values.FileName = getFileName();
                            return callBack(false, values); // no errors
                        } else {
                            return callBack(true, null); // signal error
                        }
                    });

                    function getFileName() {

                        var fileName = moment().format('YYYYMMDD');

                         
                        fileName += '_' + 'SecondEffortSolicitationCandidatesReport';

                        fileName += '_customerGroup-' + $scope.filterParameters.CustomerGroup;
                        if ($scope.filterParameters.SalesPersonId) {
                            fileName += '_salesPersonId-' + $scope.filterParameters.SalesPersonId;
                        }
                        if ($scope.filterParameters.Chain) {
                            fileName += '_chain-' + $scope.filterParameters.Chain;
                        }
                        if ($scope.filterParameters.Branch) {
                            fileName += '_branch-' + $scope.filterParameters.Branch;
                        }
                        
                        fileName += '.csv';

                        return fileName;
                    }

                    function getPostData(values) {
                        var validationResult = validatePost(values);

                        if (!validationResult.isValid) {
                            return false;
                        }

                        values.ReportId = 'SecondEffortSolicitation';
                        for (var v in $scope.filterParameters) {
                            if ($scope.filterParameters.hasOwnProperty(v)) {
                                values[v] = $scope.filterParameters[v];
                            }
                        }
                        values.Filter = {
                            "@CurrentDate": moment(new Date())._d,
                            "@CustomerGroup": values.CustomerGroup,
                            "@SalesPersonId": values.SalesPersonId || null,
                            "@ExactDaysFromDeliveryOnCustomersWithNoEWIR": $scope.ReportSettings.ExactDaysFromDeliveryOnCustomersWithNoEWIR || "0",
                            "@DaysToFywExpirationOnCustomersWithNoEW": $scope.ReportSettings.DaysToFywExpirationOnCustomersWithNoEW || "0",
                            "@DaysSinceFywRepairOnCustomersWithNoEW": $scope.ReportSettings.DaysSinceFywRepairOnCustomersWithNoEW || "0",
                            "@Chain": values.Chain || 'A',
                            "@Branch": values.Branch || null
                        };

                        return true;
                    }

                    function validatePost(values) {
                        var retValue = {
                            isValid: false
                        };

                        // clean values var...
                        if (values === undefined ||
                            values === null) {
                            values = {};
                        }

                        // clean values.CustomerGroup var...
                        if (values.CustomerGroup === undefined ||
                            values.CustomerGroup === null) {
                            values.CustomerGroup = 0;
                        }
                        if ((values.CustomerGroup < 1 || values.CustomerGroup > 3)) {
                            return retValue;
                        }

                        // clean values.Chain var...
                        if (values.Chain === undefined ||
                            values.Chain === null) {
                            values.Chain = '';
                        }
                        if ((values.Chain.toUpperCase() !== 'A' &&
                            values.Chain.toUpperCase() !== 'N' &&
                            values.Chain.toUpperCase() !== 'C')) {
                            return retValue;
                        }

                        retValue.isValid = true;

                        return retValue;
                    }
                };

                SecondEffortController.$inject = ['$scope', '$location', 'GenericResultService', 'xhr'];

                app().service('GenericResultService',['$rootScope', function ($rootScope) {
                    return GenericService($rootScope);
                }])
                .service('controllerRouting', function () {
                    return {
                        exportUrl: '/Report/SecondEffortSolicitation/GenericReportExport', //SecondEffortSolicitation
                        reportUrl: '/Report/SecondEffortSolicitation/GenericReport'
                    };
                })
                .controller('SecondEffortController', SecondEffortController)
                .controller('GenericReportController', genericReportResult);

                return angular.bootstrap($el, ['myApp']);
            }
        };
    });