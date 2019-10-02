/*global define*/
define(['angular', 'jquery', 'underscore', 'ConvertToISO8601Date', 'url', 'moment', 'lib/select2'],
    function (angular, $, _, isoDate, url, moment) {
        'use strict';
        var searchDirective = function () {

            var getSearchParameters = function (scope) {
                var search = {
                    'query': scope.searchString,
                    'facetFields': {},
                    'dateFields': {},
                    'customQuery': []
                };

                function pad(number) {
                    if (number < 10) {
                        return '0' + number;
                    }
                    return number;
                }

                function myISOFormat(d) {
                    return d.getFullYear() +
                        '-' + pad(d.getMonth() + 1) +
                        '-' + pad(d.getDate()) +
                        'T00:00:00.000Z';
                }

                angular.forEach($('.facet-field'), function (field) {
                    var fieldName = $(field).data('field');
                    var values = [];
                    angular.forEach($('.field-value.selected', field), function (fieldValue) {
                        values.push($(fieldValue).data('value'));
                    });

                    if (values.length > 0) {
                        search.facetFields[fieldName] = {
                            Values: values
                        };
                    }
                });

                angular.forEach(scope.dateFields, function (dateField) {
                    var searchFrom = '*';
                    var searchTo = '*';
                    var values = [];
                    var v;

                    if (dateField.fromValue) {
                        v = dateField.fromValue;
                        v.setHours(0,0,0,0);

                        searchFrom = myISOFormat(v); //.toISOString();
                    }

                    if (dateField.toValue) {
                        v = dateField.toValue;
                        v.setHours(0, 0, 0, 0);

                        searchTo = myISOFormat(v); //.toISOString();
                    }

                    if (searchFrom !== '*' || searchTo !== '*') {
                        values.push(searchFrom);
                        values.push(searchTo);
                    }

                    if (values.length > 0) {
                        search.dateFields[dateField.name] = {
                            Values: values
                        };
                    }
                });

                var customQuery = [];

                $('input[type=checkbox].field-value:checked').map(function () {
                    customQuery.push(this.value);
                });
                search.customQuery = customQuery;

                scope.searchParameters = search;

                return search;
            };

            return {
                restrict: 'EA',
                controller: 'FacetController',
                transclude: false,
                replace: true,
                scope: false,
                templateUrl: url.resolve('/Static/js/angularShared/templates/facetsearch.html'),
                link: function (scope, element, attrs, controller) {

                    scope.relativeurl = attrs.relativeurl || "";

                    var broadcastScope = scope.$parent || scope;

                    element.bind('$destroy', function () {
                        $('#resultsContainer').off('.facet');
                        $('#resultsContainerTouch').off('.facet');
                        $('.buttons').off('.facet');
                        $('.btn.clear').off('.facet');
                        $('.searchFields').off('.facet');
                        $('#body').off('.facet');
                        $(window).off('scroll.facet');
                    });

                    scope.$on('facet:search:no-more-results', function () {
                        $('#body').off('scroll.facet');
                        scope.noMoreResults = true;
                    });

                    $('#resultsContainer').on('click.facet', '.result', function (e) {
                        broadcastScope.$broadcast('facetsearch:result:click', {
                            element: $(this),
                            resultItem: scope.results.response.docs[$(this).index('.search-result')],
                            domEvent: e
                        });
                    });

                    $('#resultsContainerTouch').on('click.facet', '.result', function (e) {
                        broadcastScope.$broadcast('facetsearch:result:click', {
                            element: $(this),
                            resultItem: scope.displayResults[$(this).index('.search-result')],
                            domEvent: e
                        });
                    });

                    $('#resultsContainer').on('click.facet', '.expandable-toggle', function (e) {
                        var closestResultTarget = $(this).closest('.result');
                        broadcastScope.$broadcast('facetsearch:result:expandableToggle:click', {
                            element: closestResultTarget,
                            resultItem: scope.results.response.docs[closestResultTarget.index('.search-result')],
                            domEvent: e
                        });
                    });

                    $('#resultsContainerTouch').on('click.facet', '.expandable-toggle', function (e) {
                        var closestResultTarget = $(this).closest('.result');
                        broadcastScope.$broadcast('facetsearch:result:expandableToggle:click', {
                            element: closestResultTarget,
                            resultItem: scope.displayResults[closestResultTarget.index('.search-result')],
                            domEvent: e
                        });
                    });

                    $('.generatedButtons').on('click.facet', '.btn.action', function () {
                        var action = ($(this).data('action') || '').toLowerCase();
                        var searchParameters = getSearchParameters(scope);
                        broadcastScope.$broadcast('facetsearch:action:' + action, {
                            query: searchParameters,
                            results: scope.results.response.docs,
                            available: scope.results.response.numFound
                        });
                    });

                    var clearResult = function () {
                        $('.field-value').removeClass('selected');
                        angular.forEach(scope.dateFields, function (dateField) {
                            dateField.fromValue = null;
                            dateField.toValue = null;
                            dateField.numberOfDays = null;
                        });
                        scope.searchString = '';
                        $('input.field-value').attr('checked', false);
                        performSearch();
                    };

                    $('.btn.clear').on('click.facet', clearResult);
                    scope.$watch('isResetSearch', function (newVal) {
                        if (newVal) {
                            clearResult();
                        }
                    });

                    $('.searchFields').on('click.facet', '.field-value', function () {
                        $(this).toggleClass('selected');
                        performSearch();
                    });

                    var getMoreResults = function () {
                        var endOfList = $('#center').height() - $(window).height() - 60;
                        var currentPosition = $(window).scrollTop();
                        if (currentPosition >= endOfList || (scope.touchFriendly)) {
                            scope.searchStartCount += 25;
                            var searchParameters = getSearchParameters(scope);
                            controller.getAdditionalResults(searchParameters);
                        }
                    };

                    var addScrollListener = function () {
                        $(window).on('scroll.facet', _.debounce(getMoreResults, 250));
                    };

                    var performSearch = function () {
                        var searchParameters = getSearchParameters(scope);
                        controller.getUpdatedResults(searchParameters, true);
                        addScrollListener();
                        scope.isResetSearch = false;
                        scope.noMoreResults = false;
                        return false;
                    };

                    var highlightSelectedSearchFields = function (scope) {
                        if (scope.searchParameters !== undefined) {
                            scope.selectedFields = [];
                            angular.forEach(scope.searchParameters.facetFields, function (values, fieldName) {
                                var facetField = $('.facet-field[data-field="' + fieldName + '"]');
                                var vals = [];
                                angular.forEach(values.Values, function (value) {
                                    var fieldValue = facetField.find('.field-value[data-value="' + value + '"]');
                                    fieldValue.addClass('selected');
                                    if (scope.touchFriendly) {
                                        var touchField = $('.touch-search-field[data-field="' + fieldName + '"]');
                                        var touchValue = touchField.find('.touch-field-value[data-value="' + value + '"]');
                                        var count = fieldValue.data('count');
                                        touchValue.hide();
                                        scope.selectedFields.push({
                                            field: fieldName,
                                            value: value,
                                            count: count
                                        });
                                    }
                                });
                            });
                            if (scope.touchFriendly) {
                                scope.pageSize = scope.maxPageSize - scope.selectedFields.length;
                                controller.showFilterFields();
                                controller.showResultsForPage(true);
                            }

                            angular.forEach(scope.searchParameters.dateFields, function (values, fieldName) {
                                var dateField = _.find(scope.dateFields, function (field) {
                                    return field.name === fieldName;
                                });
                                var v, d;
                                if (values.Values.length === 2) {
                                    if (values.Values[0] !== '*') {
                                        v = values.Values[0];
                                        d = v.substring(0, 10);
                                        dateField.fromValue = moment(d).toDate(); //new Date(v.substring(0, v.length - 1));
                                    }

                                    if (values.Values[1] !== '*') {
                                        v = values.Values[1];
                                        d = v.substring(0, 10);
                                        dateField.toValue = moment(d).toDate(); // = new Date(v.substring(0, v.length - 1));
                                    }
                                }
                            });

                            angular.forEach(scope.searchParameters.customQuery, function (queryName) {
                                $('#custom-query-' + queryName).attr('checked', true);
                            });

                            if (scope.searchString === undefined || scope.searchString === null || scope.searchString === '') {
                                scope.searchString = scope.searchParameters.query;
                            }
                        }
                    };

                    scope.searchByText = _.debounce(performSearch, 250);

                    scope.templateRetrieved.then(function () {

                        var resultsHtml = scope.resultsTemplate(scope);
                        if (!scope.touchFriendly) {
                            angular.element('#resultsContainer').html(resultsHtml);
                        } else {
                            angular.element('#resultsContainerTouch').html(resultsHtml);
                        }

                        highlightSelectedSearchFields(scope);

                        addScrollListener();
                    });

                    if (scope.datePickerSettings) {
                        scope.datePickerSettings.onSelect = performSearch;
                    }

                    scope.$watch('results', function () {
                        scope.templateRetrieved.then(function () {
                            highlightSelectedSearchFields(scope);
                        });

                        if (scope.totalResults === 0) {
                            scope.noMoreResults = true;
                        }
                    });

                    scope.$on('facet:searchFields:changed', function () {
                        performSearch();
                    });

                    scope.numberOfDaysChanged = function () {
                        if (this.dateField.numberOfDays) {
                            this.dateField.fromValue = undefined;
                            var now = new Date();
                            this.dateField.toValue = new Date(now.getTime() - (this.dateField.numberOfDays * 24 * 60 * 60 * 1000));
                            performSearch();
                        }
                    };

                    scope.pageNext = function () {
                        if (scope.noMoreResults) {
                            return;
                        }

                        scope.scrollPage += 1;
                        getMoreResults();
                        controller.showNextPage();
                    };

                    scope.pagePrevious = function () {
                        if (scope.scrollPage > 0) {
                            scope.scrollPage -= 1;
                        }

                        controller.showPreviousPage();
                    };

                    var fixSwapping= function (searchField) {
                        if(searchField==='Level_1'){
                            $('ul[data-field="Level_2"]>li.field-value.selected').removeClass('selected');
                            $('ul[data-field="Level_3"]>li.field-value.selected').removeClass('selected');
                        }
                        else if (searchField==='Level_2'){
                            $('ul[data-field="Level_3"]>li.field-value.selected').removeClass('selected');
                        }

                    };

                    scope.applyFilter = function (event, searchField, fieldValue) {
                        var target = $(event.currentTarget);

                        fixSwapping(searchField);

                        $('.facet-field[data-field="' + searchField + '"]')
                            .find('.field-value[data-value="' + fieldValue + '"]').toggleClass('selected');

                        scope.scrollPage = 0;
                        scope.displayedItemCount = 0;
                        performSearch();
                    };

                    scope.numberOfDays = [
                        {
                            value: 1,
                            label: '1 day'
                        },
                        {
                            value: 7,
                            label: '1 week'
                        },
                        {
                            value: 14,
                            label: '2 weeks'
                        },
                        {
                            value: 21,
                            label: '3 weeks'
                        },
                        {
                            value: 30,
                            label: '1 month'
                        }
                    ];
                }
            };
        };

        return searchDirective;
    });