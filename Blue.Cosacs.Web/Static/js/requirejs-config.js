({
    "baseUrl": "js/",
    "paths": {
        "sortable": "lib/jquery.ui.sortable",
        "backbone": "lib/backbone",
        "console": "lib/console",
        "underscore": "../components/underscore/underscore",
        "underscore.string": "lib/underscore.string",
        "d3": "../components/d3/d3",
        "jquery": "lib/jquery",
        "jquery.ui": "lib/jquery-ui.custom",
        "jquery.message": "lib/jquery.message",
        "jquery.validate": "lib/jquery.validate",
        "jquery.validate.unobtrusive": "lib/jquery.validate.unobtrusive",
        "json": "lib/json2",
        "angular": "lib/angular/angular-module",
        "angular-resource": "lib/angular/angular-resource",
        "angular-sanitize": "lib/angular/angular-sanitize",
        "angular.ui": "lib/angular.ui/angular.ui",
        "angular.bootstrap": "lib/bootstrap/ui-bootstrap-custom",
        "blue.timepicker": "directives/timepicker",
        "moment": "lib/moment",
        "select2": "lib/select2",
        "typeahead": "../components/typeahead.js/dist/typeahead",
        "chosen.jquery": "lib/chosen.jquery",
        "jquery.tmpl": "lib/jquery.tmpl",
        "date": "lib/date",
        "text": "lib/text",
        "growl": "lib/growl",
        "codeeditor": "lib/codemirror/codemirror",
        "codeeditor.xml": "lib/codemirror/mode/xml/xml",
        "dropdown": "../components/bootstrap/js/dropdown",
        "modal": "../components/bootstrap/js/modal",
        "affix": "../components/bootstrap/js/affix",
        "popover": "../components/bootstrap/js/popover",
        "tooltip": "../components/bootstrap/js/tooltip"
    },
    "shim": {
        "backbone": {
            "deps": ["underscore", "jquery"],
            "exports": "Backbone"
        },
        "console": {
            "deps": [],
            "exports": "window.console"
        },
        "underscore": {
            "deps": ["jquery"],
            "exports": "_"
        },
        "d3": {
            "exports": "d3"
        },
        "angular": {
            "deps": ["jquery"],
            "exports": "window.angular"
        },
        "angular.ui": {
            "deps": ["angular", "jquery", "lib/jquery.ui.datepicker.customized"]
        },
        "angular.bootstrap": {
            "deps": ["angular"]
        },
        "angular-resource": {
            "deps": ["angular"]
        },
        "angular-sanitize": {
            "deps": ["angular"]
        },
        "blue.timepicker": {
            "deps": ["angular.ui", "angular.bootstrap", "lib/bootstrap-timepicker"]
        },
        "lib/jquery.ui.datepicker.customized": {
            "deps": ["jquery", "lib/jquery.ui.core", "lib/jquery.ui.widget"],
            "exports": "$.fn.datepicker"
        },
        "sortable": {
            "deps": ["jquery", "lib/jquery.ui.mouse", "lib/jquery.ui.widget"],
            "exports": "$.fn.sortable"
        },
        "jquery.message": {
            "deps": ["jquery"],
            "exports": "$.message"
        },
        "jquery.validate": {
            "deps": ["jquery"],
            "exports": "$.fn.validate"
        },
        "lib/bootstrap/collapse": {
            "deps": ["jquery"],
            "exports": "$.fn.collapse"
        },
        "lib/bootstrap/modal": {
            "deps": ["jquery"],
            "exports": "$.fn.modal"
        },
        "lib/bootstrap/typeahead": {
            "deps": ["jquery"],
            "exports": "$.fn.typeahead"
        },
         "lib/bootstrap/scrollspy": {
            "deps": ["jquery"],
            "exports": "$.fn.scrollspy"
        },
        "lib/bootstrap/tooltip": {
            "deps": ["jquery"],
            "exports": "$.fn.tooltip"
        },
        "lib/select2": {
            "deps": ["jquery"],
            "exports": "$.fn.select2"
        },
        "lib/jquery.pjax": {
            "deps": ["jquery"],
            "exports": "$.fn.pjax"
        },
        "lib/bootstrap/tooltip": {
            "deps": ["jquery"],
            "exports": "$.fn.tooltip"
        },
        "jquery.validate.unobtrusive": ["jquery", "lib/jquery.validate"],
        "lib/jquery.ui.mouse": ["jquery", "lib/jquery.ui.core", "lib/jquery.ui.widget"],
        "jquery.pjax": ["jquery"],
        "jquery.ui": ["jquery"],
        "jquery.form_params": ["jquery"],
        "growl": ["jquery"],
        "underscore.string": ["underscore"],
        "codeeditor": {
            "deps": [],
            "exports": "window.CodeMirror"
        },
        "codeeditor.xml": ["codeeditor"],
        "dropdown": {
            "deps": ["jquery"],
            "exports": "$.fn.dropdown"
        },
        "modal": {
            "deps": ["jquery"],
            "exports": "$.fn.modal"
        },
        "affix": {
            "deps": ["jquery"],
            "exports": "$.fn.affix"
        }
    }
})