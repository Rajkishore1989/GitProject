/*global define, console */
define(['angular', 'jquery', 'underscore', 'url', 'pjax'], function (angular, $, _, url, pjax) {
    'use strict';
    var searchController = function ($scope, $attrs, myHttp, $compile) {

        $scope.templateRetrieved = myHttp.get(url.resolve($attrs.resultsTemplate), {
            cache: true
        })
            .success(function (data) {
                         $scope.resultsTemplate = $compile(data);
                     });

        $scope.touchFriendly = $attrs.touchFriendly ? true : false;
        $scope.searchUrl = url.resolve($attrs.searchUrl);
        $scope.historyUrl = url.resolve($attrs.historyUrl);

        $scope.generateUrl = function (link) {
            return url.resolve(link);
        };

        var buttons = JSON.parse($attrs.buttons || '{}');
        $scope.searchButtons = [];
        angular.forEach(buttons, function (settings, name) {
            $scope.searchButtons.push({
                name: name,
                label: settings.label,
                enabled: settings.enabled
            });
        });

        $scope.fieldLabels = JSON.parse($attrs.fieldLabels || '{}');
        $scope.halfHeightFieldLabels = JSON.parse($attrs.halfFields || '{}');

        var dateFields = JSON.parse($attrs.dateFields || '{}');
        $scope.dateFields = _.map(dateFields, function (label, name) {
            return {
                name: name,
                label: label
            };
        });

        var customQuery = JSON.parse($attrs.customQuery || '[]');
        $scope.customQuery = _.map(customQuery, function (label, name) {
            return {
                name: name,
                label: label
            };
        });

        $scope.searchParameters = {
            'query': '',
            'facetFields': {},
            'dateFields': {},
            'customQuery': []
        };

        $scope.searchStartCount = 0;
        $scope.selectedFields = [];
        $scope.scrollPage = 0;
        $scope.displayedItemCount = 0;
        if ($scope.touchFriendly) {
            $scope.pageSize = $scope.maxPageSize = 24;
        } else {
            $scope.pageSize = 25;
        }

        $scope.getOnlyExportButton = function (buttonList) {
            if (!_.isEmpty(buttonList)) {
                return _.filter(buttonList, function (btn) {
                    return btn.label === "Export";
                });
            }
            return buttonList;
        };

        $scope.leaveOutExportButton = function (buttonList) {
            if (!_.isEmpty(buttonList)) {
                return _.filter(buttonList, function (btn) {
                    return btn.label !== "Export";
                });
            }
            return buttonList;
        };

        var getUpdatedResults = function (searchParameters, pushHistory) {
            $scope.searchParameters = searchParameters;
            $scope.searchStartCount = 0;

            if (pushHistory) {
                pjax.push('', $scope.historyUrl + '?q=' + JSON.stringify(searchParameters));
            }

            myHttp({
                method: 'GET',
                url: $scope.searchUrl,
                params: {
                    q: searchParameters,
                    start: $scope.searchStartCount
                }
            })
                .success(function (data) {
                             populateResults(data);
                         })
                .error(function () {
                           //console.log('Failed to search for SRs');
                       });
        };

        $scope.parseJson = function (data) {
            try {
                return JSON.parse(data);
            }
            catch (e) {
            }
            return null;
        };

        var getAdditionalResults = function (searchParameters) {
            $scope.searchParameters = searchParameters;
            myHttp({
                method: 'GET',
                url: $scope.searchUrl,
                params: {
                    q: searchParameters,
                    start: $scope.searchStartCount
                }
            })
                .success(function (data) {
                             addMoreResults(data);
                         })
                .error(function () {
                           //console.log('Failed to get additional search results');
                       });
        };

        var cloneDisplayFields = function () {
            var dfd = $.Deferred();

            var promises = [];
            $scope.displayFields = [];
            _.each($scope.fields, function (field) {
                var promise = $.Deferred();
                promises.push(promise);
                var fieldToAdd = {};
                _.each(field, function (value, key) {
                    if (key !== 'values') {
                        fieldToAdd[key] = value;
                    } else {
                        fieldToAdd.values = value.slice(0);
                    }
                });
                $scope.displayFields.push(fieldToAdd);
                promise.resolve();
            });

            $.when.apply(promises).then(function () {
                dfd.resolve();
            });

            return dfd.promise();
        };

        var populateResults = function (results) {

            $scope.results = results;
            if (!$scope.touchFriendly) {
                $scope.displayResults = results.response.docs;
            }

            _.each($scope.displayResults, function (result) {
                result.Free = (result.WarrantyType === 'Free');
            });
            $scope.totalResults = results.response.numFound;
            var fields = [];
            var halfHeightFields = [];
            angular.forEach(results.facet_counts.facet_fields, function (fieldResults, fieldLabel) {
                var search = {
                    name: fieldLabel,
                    label: $scope.fieldLabels[fieldLabel] || fieldLabel,
                    values: []
                };

                // Solr return format for facet fields is "field value 1", count1, "field value 2", count2...
                for (var i = 0; i < fieldResults.length; i += 2) {
                    search.values.push({
                        value: fieldResults[i],
                        count: fieldResults[i + 1]
                    });
                }

                if (_.contains($scope.halfHeightFieldLabels, fieldLabel)) {
                    halfHeightFields.push(search);
                } else {
                    fields.push(search);
                }
            });

            sortFacetFields(fields);  // Sort results
            $scope.fields = fields;

            sortFacetFields(halfHeightFields);  // Sort results
            $scope.halfHeightFields = halfHeightFields;
            if ($scope.touchFriendly) {
                var filtered = showFilterFields();
                $.when(filtered).then(function () {
                    showResultsForPage(true);
                });
            }
        };

        function sortFacetFields(fields) {
            if (!fields) {
                return fields;
            }

            angular.forEach(fields, function (field) {
                if (field.values) {
                    field.values = _.sortBy(field.values, 'value');
                }
            });
        }

        var addMoreResults = function (results) {
            if (results.response.docs.length === 0) {
                $scope.$broadcast('facet:search:no-more-results');
                return;
            }

            if (!$scope.touchFriendly) {
                $scope.displayResults = $scope.displayResults.concat(results.response.docs);
            }

            $scope.results.response.docs = $scope.results.response.docs.concat(results.response.docs);
            if ($scope.touchFriendly && $scope.displayResults.length < $scope.pageSize) {
                showResultsForPage();
            }
        };

        var filterSelectedFields = function () {
            var dfd = $.Deferred();
            var promises = [];
            _.each($scope.displayFields, function (field) {
                var promise = $.Deferred();
                promises.push(promise);
                field.values = _.reject(field.values, function (value) {
                    var selected = _.find($scope.selectedFields, function (selectedField) {
                        return selectedField.field === field.name && selectedField.value === value.value;
                    });
                    return selected ? true : false;
                });
                promise.resolve();
            });

            $.when.apply(promises).then(function () {
                dfd.resolve();
            });

            return dfd.promise();
        };

        var showFilterFields = function () {
            var dfd = $.Deferred();

            var cloned = cloneDisplayFields();
            var filtered = filterSelectedFields();

            var count = 0;
            _.each($scope.displayFields, function (field) {
                count += field.values.splice(0, ($scope.pageSize * $scope.scrollPage) - count).length;
            });

            $.when(cloned, filtered).then(function () {
                dfd.resolve();
            });

            return dfd.promise();
        };

        var showResultsForPage = function (filtered) {
            if (!$scope.results) {
                return;
            }

            var showingFields = _.flatten(_.pluck($scope.displayFields, 'values')).length;
            if ((showingFields > 0 || filtered) && showingFields < $scope.pageSize) {
                $scope.displayResults = $scope.results.response.docs.slice(0, $scope.pageSize - showingFields);
                $scope.displayedItemCount = $scope.displayResults.length;
            } else {
                var start = $scope.displayedItemCount;
                $scope.displayResults = $scope.results.response.docs.slice(start, start + $scope.pageSize);
            }
        };

        var showPreviousPage = function () {
            showFilterFields();
            $scope.displayedItemCount -= ($scope.displayResults.length + $scope.pageSize);
            if ($scope.displayedItemCount < 0) {
                $scope.displayedItemCount = 0;
            }
            showResultsForPage();
        };

        var showNextPage = function () {
            showFilterFields();
            showResultsForPage();
            $scope.displayedItemCount += $scope.displayResults.length;
        };

        var urlParameter = url.getParameter('q');
        if (urlParameter !== undefined && urlParameter !== null && urlParameter !== '') {
            var searchParameters = JSON.parse(url.getParameter('q'));
            getUpdatedResults(searchParameters, false);
        } else {
            var results = JSON.parse($attrs.results);
            populateResults(results);
        }

        return {
            getUpdatedResults: getUpdatedResults,
            getAdditionalResults: getAdditionalResults,
            showNextPage: showNextPage,
            showPreviousPage: showPreviousPage,
            showFilterFields: showFilterFields,
            showResultsForPage: showResultsForPage
        };
    };

    searchController.$inject = ['$scope', '$attrs', 'xhr', '$compile'];

    return searchController;
});