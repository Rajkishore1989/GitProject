/*global define*/
define(['returnCodeActions'], function (action) {
    'use strict';
    return function () {
       return  function (promise ) {
            var reject = function( reason ) {
                action[reason.status]( reason.data );
            };
            promise.then( function () {}, reject );
            return promise;
        };
    };
});
