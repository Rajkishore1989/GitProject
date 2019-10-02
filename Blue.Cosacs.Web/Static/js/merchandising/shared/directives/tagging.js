define(['angular', 'url', 'underscore'],
function (angular, url, _) {
    'use strict';
    return function() {
        return {
            restrict: 'E',
            scope: {
                tags: '=',
                selectedTags: '=',
                clearFlag: '=',
                addCallback: '&',
                removeCallback: '&',
                placeholder: '@',
                textBinding: '@',
                valueBinding: '@',
                editable: '&'
            },
            templateUrl: url.resolve('/Static/js/merchandising/shared/templates/tagList.html'),
            link: function (scope, element) {

                if (scope.editable() === undefined) {
                    scope.editable = function() { return true; };
                }
                
                var input = angular.element(element.find('input.taglist'));

                function resetAvailableTags() {
                    if (typeof scope.textBinding !== 'undefined') {
                        scope.values = _.chain(scope.tags)
                                        .sortBy(function (tag) { return tag.id; })
                                        .map(function (tag) { return tag[scope.textBinding]; })
                                        .value();
                    } else {
                        scope.values = scope.tags;
                    }
                    scope.values = _.difference(scope.values, scope.selectedTags);
                    scope.new_value = "";
                }

                scope.$watch('tags', function () {
                    resetAvailableTags();
                });

                scope.$watch('selectedTags', function () {
                    resetAvailableTags();
                });

                scope.$watch('clearFlag', function () {
                    scope.new_value = "";
                });

                scope.add = function () {

                    var index = _.indexOf(scope.values, scope.new_value);
                   
                    // Disallow if already selected
                    var selectedIndex = _.indexOf(scope.selectedTags, scope.new_value);

                    if (typeof scope.new_value !== 'undefined' &&
                        scope.new_value !== '' && 
                        index > -1 &&
                        selectedIndex === -1) {

                        scope.selectedTags = scope.selectedTags || [];
                        scope.selectedTags.push(scope.new_value);
                        scope.values = _.reject(scope.values, function (v) { return v === scope.new_value; });
                        
                        if (typeof scope.valueBinding !== 'undefined' && typeof scope.textBinding !== 'undefined') {
                            var bindingIndex = _.indexOf(_.map(scope.tags, function (x) { return x[scope.textBinding]; }), scope.new_value);
                            scope.new_value = scope.tags[bindingIndex][scope.valueBinding];
                        }

                        // Return the updated list to callback if specified
                        if (typeof scope.addCallback !== 'undefined') {
                            scope.addCallback({ item: scope.new_value });
                        }

                        scope.new_value = "";
                    }
                };

                scope.remove = function (idx, item) {
                    scope.selectedTags.splice(idx, 1);

                    if (typeof scope.removeCallback !== 'undefined') {
                        var id;
                        if (typeof scope.valueBinding !== 'undefined') {

                            var itemObj = _.find(scope.tags, function (tag) {
                                return tag.name === item;
                            });

                            id = itemObj[scope.valueBinding];
                        } else {
                            id = item;
                        }
                        scope.values.push(item);
                        scope.removeCallback({ item: id });
                    }
                };
                
                input.on('keypress', function (event) {
                    if (event.keyCode === 13) {
                         scope.$apply(scope.add);
                    }
                });
            }
        };
    };
});