define(['jquery'], function($) {
    'use strict';

    var builder = function($compile, $timeout, $filter, lookup) {
        
		return {
            restrict: 'E',
            scope: {
                selectedKey: '=ngModel',
                itemList: '=scope',
                placeholder: '@',
                disabled: '=ngDisabled',
                ngChange: '&'
            },
            link: function ( scope, element, attrs ) {
                scope.template = '<div class="list-container" ng-class="{\'opened\':listOpened, \'disabled\':disabled}">' +
                    '<div class="list-placeholder" ng-click="openList()">' +
                        '<span class="list-value selected" ng-show="selectedValue" title="{{selectedValue}}">{{selectedValue}}</span>' +
                        '<span class="list-value" ng-hide="selectedValue">{{placeholder}}</span>' +
                    '</div>' +
                    '<div class="list-clear" ng-show="selectedValue" ng-click="clearList()"><div><i class="glyphicons remove_2"></i></div></div>' +
                    '<div class="list-arrow" ng-class="{\'opened\':listOpened}" ng-click="openList()"><div><i class="glyphicons play"></i></div></div>' +
                '</div>';

                //that.$inject = ['$q']; //if we nee to use a particular service
                scope.list = [];
                scope.search = null;
                //scope.hoveredItem = null;
                scope.selectedValue = null;
                scope.hoveredIndex = null;
                scope.listDOM = null;
                scope.listOpened = false;

                var KEY = {
                    TAB: 9,
                    ENTER: 13,
                    ESC: 27,
                    SPACE: 32,
                    LEFT: 37,
                    UP: 38,
                    RIGHT: 39,
                    DOWN: 40,
                    SHIFT: 16,
                    CTRL: 17,
                    ALT: 18,
                    PAGE_UP: 33,
                    PAGE_DOWN: 34,
                    HOME: 36,
                    END: 35,
                    BACKSPACE: 8,
                    DELETE: 46
                };
                var safeApply = function (fn) {
                    var phase = scope.$root.$$phase;
                    if (phase === '$apply' || phase === '$digest') {
                        return scope.$eval(fn);
                    } else {
                        return scope.$apply(fn);
                    }
                };
                var killEvent = function(event) {
                    event.preventDefault();
                    event.stopPropagation();
                };
                var listInsideViewport = function(){
                    var win = $(window);
                    var obj = scope.listDOM.find('.list-item-container');

                    if (obj.length > 0) {
                        var viewport = {
                            top : win.scrollTop()
                        };
                        //viewport.right = viewport.left + win.width();
                        viewport.bottom = viewport.top + win.height();

                        var bounds = obj.offset();
                        //bounds.right = bounds.left + this.outerWidth();
                        bounds.bottom = bounds.top + obj.outerHeight();

                        if (viewport.top > bounds.top || viewport.bottom < bounds.bottom) {
                            //resize the height to be fixed
                            obj.css('height', (viewport.bottom - bounds.top - 10) + 'px');
                        }
                    }
                };
                var resizeList = function() {
                    var elementWidth = element.find('.list-container').width();

                    scope.listDOM.css('width', (elementWidth + 2) + 'px');
                };
                var positionList = function() {
                    var elementOffset = element.find('.list-container').offset();
                    var scrollTop = $(window).scrollTop();
                    var scrollLeft = $(window).scrollLeft();

                    scope.listDOM.css({left: (elementOffset.left - scrollLeft) + 'px', top: (elementOffset.top - scrollTop + 31) + 'px'});
                };
                var resizeHandler = function() {
                    resizeList();
                    positionList();
                    listInsideViewport();
                };
                var readArray = function(array) {
                    scope.list = [];
                    if (array.length > 0) {
                        var i;
                        if (array[0].k) {
                            for (i = 0; i < array.length; i++) {
                                scope.list.push({k:array[i].k, v:array[i].v});
                            }
                        } else {
                            for (i = 0; i < array.length; i++) {
                                scope.list.push({k:array[i], v:array[i]});
                            }
                        }
                    }
                };
                var readObject = function(array) {
                    scope.list = [];
                    var keys = Object.keys ? Object.keys(array) : [];
                    for (var i = 0; i < keys.length; i++) {
                        scope.list.push({k:keys[i], v:array[keys[i]]});
                    }
                };
                var renderList = function() {
                    scope.listDOM.append($compile(scope.itemTemplate)(scope));
                    $timeout(listInsideViewport, 200);
                };
                var listWatcher = null;
                var selectedValueWatcher = null;
                var populateList = function() {
                    if (scope.itemList && attrs.scope) {
                        //var x = scope.itemList();
                        if (scope.itemList) {
                            //itemList can be an array or a function or a promise
                            if ($.isArray(scope.itemList)) { //ARRAY or FUNCTION that return an ARRAY
                                readArray(scope.itemList);
                                selectedItem();
                            } else if (scope.itemList.then) { //PROMISE
                                scope.itemList.then(function(data) {
                                    if ($.isArray(data)) { //ARRAY
                                        readArray(data);
                                    } else {
                                        //object with {k1:v1, k2:v2, k3:v3 [..., kn:vn]}
                                        readObject(data);
                                    }
                                    selectedItem();
                                });
                            } else {
                                //object with {k1:v1, k2:v2, k3:v3 [..., kn:vn]}
                                readObject(scope.itemList);
                                selectedItem();
                            }
                        } 
                    } else if (attrs.lookup) {
                        lookup.populate(attrs.lookup).then(function(data) {
                            if ($.isArray(data)) { //ARRAY
                                readArray(data);
                            } else {
                                //object with {k1:v1, k2:v2, k3:v3 [..., kn:vn]}
                                readObject(data);
                            }
                            selectedItem();
                        });
                    } else if (attrs.url) {

                    }
                };
                var chooseTemplate = function() {
                    if (attrs.scope || attrs.lookup) {
                        scope.itemTemplate = '<div class="list-search">' +
                            '<input type="text" ng-model="search">' +
                            '<div class="list-search-icon"><div><i class="glyphicons search"></i></div></div>' +
                        '</div>' +
                        '<div class="list-item-container">' +
                            '<div class="list-item" ng-show="list.length > 0" ng-repeat="item in list | filter:search" ng-click="selectItem(item)" data-idx="{{$index}}" ' +
                            'ng-class="{\'selected\':hoveredIndex == $index}" ng-mouseover="hoverItem($index)" ng-mouseleave="resetHoverItem()">{{item.v}}</div>' +
                            '<div class="list-item muted" ng-hide="list.length > 0">Empty list</div>' +
                        '</div>';
                    } else if (attrs.url) {

                    }
                };
                var selectedItem = function() {
                    if (scope.list && scope.selectedKey) {
                        scope.selectedValue = null;
                        scope.hoveredIndex = null;

                        for (var i = 0; i < scope.list.length; i++) {
                            if (scope.list[i].k === scope.selectedKey) {
                                scope.selectedValue = scope.list[i].v;
                                scope.hoveredIndex = i;

                                scope.$emit('list.keychanged', {value:scope.selectedValue});
                                break;
                            }
                        }
                    } else {
                        scope.selectedValue = null;
                        scope.hoveredIndex = null;
                    }
                };
                var ensureOptionVisible = function() {
                    var listContainer = $('.list-item-container');
                    var child = $('.list-item[data-idx="' + scope.hoveredIndex + '"]');
                    if (child.length > 0 && listContainer.length > 0) {
                        var hb = child.offset().top + child.outerHeight(true);
                        var rb = listContainer.offset().top + listContainer.outerHeight(true);

                        if (hb > rb) {
                            listContainer.scrollTop(listContainer.scrollTop() + (hb - rb));
                        }
                        var y = child.offset().top - listContainer.offset().top;

                        // make sure the top of the element is visible
                        if (y < 0 && child.css('display') !== 'none' ) {
                            listContainer.scrollTop(listContainer.scrollTop() + y); // y is negative
                        }
                    }
                };
                var selectItemKeyPressed = function(event) {
                    switch (event.which) {
                        case KEY.UP:
                        case KEY.DOWN:
                            safeApply(function() {
                                if (scope.hoveredIndex !== null) {
                                    var newIndex = scope.hoveredIndex + ((event.which === KEY.DOWN) ? 1 : -1);
                                    //circular selection behaviour
                                    if (scope.list && scope.list.length) {
                                        if (newIndex < 0) {
                                            scope.hoveredIndex = scope.list.length - 1;
                                        } else if (newIndex >= scope.list.length) {
                                            scope.hoveredIndex = 0;
                                        } else {
                                            scope.hoveredIndex = newIndex;
                                        }
                                    } else {
                                        scope.hoveredIndex = 0;
                                    }
                                } else {
                                    scope.hoveredIndex = 0;
                                }
                                //ensure element is visible
                                ensureOptionVisible();
                            });
                            killEvent(event);
                            break;
                        case KEY.TAB:
                        case KEY.ENTER:
                            safeApply(function() {
                                if (scope.hoveredIndex !== null && scope.list && scope.list.length > 0 && scope.hoveredIndex >= 0 && scope.hoveredIndex < scope.list.length) {
                                    var array = $filter('filter')(scope.list, scope.search);
                                    scope.selectItem(array[scope.hoveredIndex]);
                                    scope.closeList();
                                }
                            });
                            killEvent(event);
                            break;
                        case KEY.ESC:
                            safeApply(function() {
                                scope.closeList();
                            });
                            killEvent(event);
                            break;
                    }
                };

                scope.hoverItem = function(index) {
                    if (scope.list && scope.list.length > 0 && index >= 0 && index < scope.list.length) {
                        scope.hoveredIndex = index;
                    }
                };
                scope.resetHoverItem = function() {
                    scope.hoveredIndex = null;
                };
                scope.selectItem = function(item) {
                    scope.closeList();
                    scope.selectedKey = item.k;
                    scope.selectedValue = item.v;
                    $timeout(scope.ngChange, 0);
                };
                scope.clearList = function() {
                    if (!scope.disabled) {
                        scope.selectedKey = null;
                        scope.selectedValue = null;
                        $timeout(scope.ngChange, 0);
                    }
                };
                scope.openList = function() {
                    if (!scope.disabled) {
                        scope.listOpened = true;
                        scope.search = null;

                        //this method creates the overlay
                        var overlay = '<div class="list-options-mask" ng-click="closeList()"></div>';
                        scope.listDOM = $('<div class="list-options"></div>');

                        element.append($compile(overlay)(scope));
                        //resize list
                        resizeList();
                        //position list
                        positionList();

                        element.append($compile(scope.listDOM)(scope));

                        //populate list
                        renderList();
                        $timeout(ensureOptionVisible, 200);

                        //set the hovered option
                        if (scope.list && scope.list.length > 0) {
                            for (var i = 0; i < scope.list.length; i++) {
                                if (scope.list[i].k === scope.selectedKey) {
                                    //scope.hoveredItem = scope.list[i];
                                    scope.hoveredIndex = i;
                                    break;
                                }
                            }
                        }

                        $('.list-options > .list-search > input').focus();

                        //register event handlers to resize and scroll
                        $(window).on('scroll', positionList);
                        $(window).on('resize', resizeHandler);

                        //register event handlers to arrow down and up
                        //register event handlers to enter key
                        $(window).on('keydown', selectItemKeyPressed);
                    }
                };
                scope.closeList = function() {
                    $('.list-options').remove();
                    $('.list-options-mask').remove();
                    scope.listOpened = false;
                    scope.listDOM = null;
                    //remove or not the list??

                    scope.resetHoverItem();

                    //deregister event handlers to resize and scroll
                    $(window).off('scroll', positionList);
                    $(window).off('resize', resizeHandler);

                    //deregister event handlers to arrow down and up
                    //deregister event handlers to enter key
                    $(window).off('keydown', selectItemKeyPressed);
                };

                var init = function() {
                    chooseTemplate();

                    scope.placeholder = scope.placeholder || 'Select..';
                    if (!attrs.ngModel) {
                        throw 'List directive: ng-model data attribute missing!';
                    }

                    if (attrs.scope) {
                        if (!scope.itemList) {
                            listWatcher = scope.$watch('itemList', populateList);
                        } else {
                            populateList();
                        }
                    } else {
                        populateList();
                    }

                    selectedValueWatcher = scope.$watch('selectedKey', selectedItem);
                    element.html($compile(scope.template)(scope));
                };
                return init();
            }
        };
    };

    builder.$inject = ['$compile', '$timeout', '$filter', 'lookup'];
    return builder;

});