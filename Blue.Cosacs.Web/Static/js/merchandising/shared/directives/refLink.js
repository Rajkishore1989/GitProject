define([],
    function () {
        'use strict';

        return function () {
            return {
                restrict: 'A',
                scope: {
                    ngModel: '='
                },
                template: '<span ng-bind-html-unsafe="ngModel|pbLinkRefs" style="white-space:pre-wrap"></span>'
            };
        };
    });
