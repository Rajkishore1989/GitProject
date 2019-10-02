/*global define*/
/*
 * use like this for html templates/partials: 
 * define(['partial!template1'], function(template1) { 
 *   (where file is in partials/template1.html)
 */
define(['text', 'underscore'], function (text, _) {
    'use strict';
    return _.extend({}, text, { 
        parseName: function (name) {
            return text.parseName('../partials/' + name + '.html');
        } 
    });
});