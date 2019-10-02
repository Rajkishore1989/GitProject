define([],
function () {
    'use strict';

    var keyCodes = {
        esc: 27,
        space: 32,
        enter: 13,
        tab: 9,
        backspace: 8,
        shift: 16,
        ctrl: 17,
        alt: 18,
        capslock: 20,
        numlock: 144
    };

    function map(obj) {
        var mapped = {};
        for (var key in obj) {
            var action = obj[key];
            if (keyCodes.hasOwnProperty(key)) {
                mapped[keyCodes[key]] = action;
            }
        }
        return mapped;
    }

    return function() {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                var bindings = map(scope.$eval(attrs.pbKeypress));
                element.bind("keypress", function(event) {
                    if (bindings.hasOwnProperty(event.which)) {
                        scope.$apply(function() {
                            scope.$eval(bindings[event.which]);
                        });
                    }
                });
            }
        };
    };
});