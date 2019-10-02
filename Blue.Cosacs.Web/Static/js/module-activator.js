/*jslint nomen: true */
/*global define,require */
define(['jquery', 'underscore'], function ($, _) {
    var module = {}, loadModule = function (domElement) {
        var $el = $(domElement),
            moduleName = $el.data("module");

        require([moduleName], function (module) {
            module.init($el);
        });
    };

    module.execute = function (element, selector) {
        element = element || $('html');
        var dataModules = (selector ? $(selector, element).filter("[data-module]") : $("[data-module]", element));
        _.each(dataModules, loadModule);
    };

    return module;
});