define(['underscore'],
    function(_) {
        'use strict';

        return function() {
            return function(input, delimiter) {
                return (input || []).join(delimiter || ',');
            };
        };
    });
    
