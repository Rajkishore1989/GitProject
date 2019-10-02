/* global define */
define(['angular', 'url', 'underscore'],
    function (angular, url, _) {
        "use strict";

        var reportResult = function ($scope, GenericResultService, myHttp, controllerRouting, $timeout) {
            $scope.MasterData = {};
            $scope.MasterData.Report = {
                Data: null,
                ColumnParameters: null
            };
            $scope.emptyResults = true;
            $scope.hideTableData = true;

            var clearDataResultTable = function () {
                $scope.MasterData.Report = {
                    Data: null,
                    ColumnParameters: null
                };

                $scope.emptyResults = true;
                $scope.hideTableData = true;
            };

            $scope.selectPage = function (page) {
                GenericResultService.ServerParameters.PageIndex = page;
                GenericResultService.onSearching(GenericResultService.ServerParameters);
            };

            var returnColumnIndex = function (data, columnName) {
                var returnValue = -1;
                _.each($scope.MasterData.Report.Data[0], function (value, index) {
                    if (value === columnName) {
                        returnValue = index;
                    }
                });

                return returnValue;
            };

            $scope.display = function () {
                $scope.emptyResults = false;

                if ($scope.MasterData.Report.Data === null || $scope.MasterData.Report.Data.length === 0) {
                    $scope.hideTableData = true;
                    return false;
                }

                $scope.hideTableData = false;

                $scope.RowNoIndx = -1;
                $scope.TotalCountIndx = -1;

                _.each($scope.MasterData.Report.Data[0], function (s, idx) {
                    if (s === 'RowNo') {
                        $scope.RowNoIndx = idx;
                    } else if (s === 'TotalCount') {
                        $scope.TotalCountIndx = idx;
                    }
                });

                $scope.data = {
                    headers: [_.map($scope.MasterData.Report.Data[0], function (s) {
                        return { title: s };
                    })],
                    rows: $scope.MasterData.Report.Data.slice(1, $scope.MasterData.Report.Data.length)
                };

                $scope.columnParameters = $scope.MasterData.Report.ColumnParameters;

                var defaultFormatter = function (valueToFormat) {
                    return valueToFormat;
                };

                var urlFormatter = function (valueToFormat, columnParameter, row) {

                    var returnValue = '<a href="';

                    returnValue += url.resolve(columnParameter.Format.replace('?', valueToFormat));
                    returnValue += '">' + valueToFormat + '</a>';

                    return returnValue;
                };

                $scope.data = GenericResultService.onTransform($scope.data);

                var formatters = {
                    'default': defaultFormatter,
                    'url': urlFormatter
                };

                $scope.columnsFormatters = [];
                _.each($scope.MasterData.Report.Data[0], function (value) {

                    var result = _.find($scope.columnParameters, function (column) {
                        return column.ParentColumn === value;
                    });

                    result = result || { Type: 'default' };

                    $scope.columnsFormatters.push({
                        formatFunc: formatters[result.Type],
                        column: result
                    });
                });

                angular.forEach($scope.data.rows, function (value) {

                    angular.forEach(value, function (v, k) {

                        var func = $scope.columnsFormatters[k].formatFunc;
                        this[k] = func(this[k], $scope.columnsFormatters[k].column, value);
                    }, value, null);
                });

                return true;
            };

            $scope.clear = function () {
                GenericResultService.onClear();
                clearDataResultTable();
               
            };

            $scope.exportResults = function () {
                GenericResultService.onExport();
            };

            $scope.$on(GenericResultService.EventsNames.onExporting, function (e, parameters) {
                var passedValues = parameters || GenericResultService.ServerParameters;

                var par = {
                    ReportId: passedValues.ReportId,
                    Filter: passedValues.Filter
                };

                var urlToFile = controllerRouting.exportUrl + '?parameters=' +
                    encodeURIComponent(JSON.stringify(par)) +
                    '&fileName=' +
                    encodeURIComponent(passedValues.FileName);

                return url.open(urlToFile);
            });

            $scope.PageCount = GenericResultService.ServerParameters.PageCount;
            $scope.PageIndex = GenericResultService.ServerParameters.PageIndex;
            $scope.PageSize = GenericResultService.ServerParameters.PageSize;

            $scope.$on(GenericResultService.EventsNames.onSearching, function (e, parameters) {
                return executeQuery(parameters || GenericResultService.ServerParameters, function (data) {

                    if (data.Report) {
                        _.extend($scope.MasterData.Report, { ColumnParameters: data.Report.ColumnParameters, Data: data.Report.Data });

                        if (data.ChartData && data.ChartData.Data) {
                            _.extend($scope.MasterData.Report, { ChartData: data.ChartData.Data });
                        }

                        _.extend(GenericResultService.ServerParameters, {
                            PageIndex: data.Report.PageIndex,
                            PageSize: data.Report.PageSize,
                            PageCount: data.Report.PageCount
                        });
                    } else {
                      
                        _.extend(GenericResultService.ServerParameters, {
                            PageIndex: 0,
                            PageCount: 0
                        });

                    }

                    $scope.PageCount = GenericResultService.ServerParameters.PageCount;
                    $scope.PageIndex = GenericResultService.ServerParameters.PageIndex;
                    $scope.PageSize = GenericResultService.ServerParameters.PageSize;

                    $scope.display();
                    $timeout(function () {
                        GenericResultService.onAfterDisplay($scope.MasterData.Report);
                    }, 0, true);

                    return true;
                });
            });

            var executeQuery = function (reportParameters, callBack) {
                myHttp({
                    method: 'GET',
                    url: url.resolve(controllerRouting.reportUrl),
                    params: { parameters: reportParameters },
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                    }
                }).success(function (data) {
                    callBack(data);
                });

                return true;
            };

            $scope.search = function () {
                GenericResultService.PageIndex = 1;
                clearDataResultTable();
                GenericResultService.onSearch();
            };


        };


        reportResult.$inject = ['$scope', 'GenericResultService', 'xhr', 'controllerRouting', '$timeout'];

        return reportResult;
    });