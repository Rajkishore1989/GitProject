define([],
function() {
    'use strict';

    return function() {
        var that = this;

        that.debounce = function debounce(func, wait, immediate) {
            var timeout;
            return function() {
                var context = this, args = arguments;
                var later = function() {
                    timeout = null;
                    if (!immediate) func.apply(context, args);
                };
                var callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) func.apply(context, args);
            };
        };

        // Removes any properties with null or undefined values from an object
        that.cleanse = function(obj) {
            for (var i in obj) {
                if (obj.hasOwnProperty(i)) {
                    if (obj[i] === null || obj[i] === undefined) {
                        delete obj[i];
                    }
                }
            }
            return obj;
        };
    };
});