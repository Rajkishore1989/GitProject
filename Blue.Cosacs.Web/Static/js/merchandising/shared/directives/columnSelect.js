define(['angular', 'jquery', 'underscore', 'url'],
function (angular, $, _, url) {
    'use strict';
    return function() {
        return {
            restrict: 'E',
            scope: {
                columns: '=',       // required: An array of objects specifying column names and their initial state eg [{ name: 'Column Name', selected: true }...] 
                data: '=',          // required: The data with which to populate the grid. No. and order of columns should match those in the column definition.
                templateUrl: '=',   // required: The location of the grid template. Table cells (td/th) that can be hidden must have the class .hidable-col applied. 
                utils: '=',         // optional: An object holding functions required by the template.
                hasData: '=',       // optional: A function called to check if the model had data and so the grid controls should be shown.
                count: '='          // optional: The number of results returned, to be displayed before rendering.
            },
            templateUrl: url.resolve('/Static/js/merchandising/shared/templates/column-select.html'),
            controller: ['$scope', function (scope) {

                    function getSelector(index) {
                        return '.colSelectContainer tr td.hidable-col:nth-child(' + (index + 1) + '), .colSelectContainer tr th.hidable-col:nth-child(' + (index + 1) + ')';
                    }

                    function showColumn(index) {
                        $(getSelector(index)).show();
                    }

                    function hideColumn(index) {
                        $(getSelector(index)).hide();
                    }

                    function update(index) {
                        var item = scope.columns[index];

                        if (item.selected === true) {
                            // Check we've selected at least one column
                            if (scope.selectedCount > 1) {
                                scope.selectedCount--;
                                hideColumn(index);
                                item.selected = false;
                            }
                        } else {
                            scope.selectedCount++;
                            showColumn(index);
                            item.selected = true;
                        }
                    }

                    function isDisplayed(index) {
                        return scope.columns[index] && scope.columns[index].selected === true ? "" : "none";
                    }

                    function setSelectedCount(cols) {
                        scope.selectedCount = _.where(cols, function(col) {
                            return col.selected === true;
                        }).length;
                    }

                    function drill(element) {
                        if (!element.isExpanded) {
                            element.isExpanded = true;
                        } else {
                            element.isExpanded = false;
                        }
                    }

                    function showResultsCount() {
                        return scope.count && scope.count > 0;
                    }

                    scope.rendering = false;
                    scope.canChangeColumns = false;
                    scope.$watch('data', function(data) {
                        setSelectedCount(scope.columns);
                        scope.canChangeColumns = typeof data !== 'undefined' && Object.keys(data).length !== 0;
                        scope.rendering = false;
                    });

                    scope.$watch('resultCount', function () {
                        scope.rendering = true;
                    });

                    setSelectedCount(scope.columns);
                    scope.update = update;
                    scope.open = open;
                    scope.isDisplayed = isDisplayed;
                    scope.drill = drill;
                    scope.resolve = url.resolve;
                    scope.showResultsCount = showResultsCount;
                }
            ]
        };
    };
});