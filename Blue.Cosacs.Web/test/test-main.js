var tests = ['main'];
for (var file in window.__karma__.files) {
    if (window.__karma__.files.hasOwnProperty(file)) {
        if (/\.spec\.js$/.test(file)) {
            tests.push(file);
        }
    }
}

window.DEBUG = false;

require.config({
    baseUrl: '/base/Static/js',
    paths: {
        'sortable': 'lib/jquery.ui.sortable',
        'backbone': 'lib/backbone',
        'console': 'lib/console',
        'underscore': '../components/underscore/underscore',
        'underscore.string': 'lib/underscore.string',
        'jquery': 'lib/jquery',
        'jquery.ui': 'lib/jquery-ui.custom',
        'jquery.message': 'lib/jquery.message',
        'jquery.validate': 'lib/jquery.validate',
        'jquery.validate.unobtrusive': 'lib/jquery.validate.unobtrusive',
        'json': 'lib/json2',
        'angular': 'lib/angular/angular-module',
        'angular-resource': 'lib/angular/angular-resource',
        'angular.ui': 'lib/angular.ui/angular.ui',
        'angular.bootstrap': 'lib/bootstrap/ui-bootstrap-custom',
        'angular.mock': '../../test/lib/angular/angular-mocks',
        'blue.timepicker': 'directives/timepicker',
        'moment': 'lib/moment',
        'select2': 'lib/select2',
        'typeahead': '../components/typeahead.js/dist/typeahead',
        'chosen.jquery': 'lib/chosen.jquery',
        'jquery.tmpl': 'lib/jquery.tmpl',
        'date': 'lib/date',
        'text': 'lib/text',
        'growl': 'lib/growl',
        'codeeditor': 'lib/codemirror/codemirror',
        'codeeditor.xml': 'lib/codemirror/mode/xml/xml',
        'dropdown': '../components/bootstrap/js/dropdown',
        'modal': '../components/bootstrap/js/modal',
        'affix': '../components/bootstrap/js/affix',
        'json.loader': 'test/fakes/jsonFilesLoader',
        'jasmine-expect':'lib/jasmine-matchers',
        'DecisionTableUtils': '../../test/lib/DecisionTablesTestUtils'
    },
    shim: {
        'backbone': {
            'deps': ['underscore', 'jquery'],
            'exports': 'Backbone'
        },
        'console': {
            'deps': [],
            'exports': 'window.console'
        },
        'underscore': {
            'deps': ['jquery'],
            'exports': '_'
        },
        'angular': {
            'deps': ['jquery'],
            'exports': 'window.angular'
        },
        'angular.ui': {
            'deps': ['angular', 'jquery', 'lib/jquery.ui.datepicker.customized']
        },
        'angular.bootstrap': {
            'deps': ['angular']
        },
        'angular-resource': {
            'deps': ['angular']
        },
        'angular.mock': {
            'deps': ['angular']
        },
        'blue.timepicker': {
            'deps': ['angular.ui', 'angular.bootstrap', 'lib/bootstrap-timepicker']
        },
        'lib/jquery.ui.datepicker.customized': {
            'deps': ['jquery.ui'],
            'exports': '$.fn.datepicker'
        },
        'sortable': {
            'deps': ['jquery', 'lib/jquery.ui.mouse', 'lib/jquery.ui.widget'],
            'exports': '$.fn.sortable'
        },
        'jquery.message': {
            'deps': ['jquery'],
            'exports': '$.message'
        },
        'jquery.validate': {
            'deps': ['jquery'],
            'exports': '$.fn.validate'
        },
        'lib/bootstrap/collapse': {
            'deps': ['jquery'],
            'exports': '$.fn.collapse'
        },
        'lib/bootstrap/modal': {
            'deps': ['jquery'],
            'exports': '$.fn.modal'
        },
        'lib/bootstrap/typeahead': {
            'deps': ['jquery'],
            'exports': '$.fn.typeahead'
        },
        'lib/bootstrap/scrollspy': {
            'deps': ['jquery'],
            'exports': '$.fn.scrollspy'
        },
        'lib/bootstrap/tooltip': {
            'deps': ['jquery'],
            'exports': '$.fn.tooltip'
        },
        'lib/select2': {
            'deps': ['jquery'],
            'exports': '$.fn.select2'
        },
        'lib/jquery.pjax': {
            'deps': ['jquery'],
            'exports': '$.fn.pjax'
        },
        'jquery.validate.unobtrusive': ['jquery', 'lib/jquery.validate'],
        'lib/jquery.ui.mouse': ['jquery.ui'],
        'jquery.pjax': ['jquery'],
        'jquery.ui': ['jquery'],
        'jquery.form_params': ['jquery'],
        'growl': ['jquery'],
        'underscore.string': ['underscore'],
        'codeeditor': {
            'deps': [],
            'exports': 'window.CodeMirror'
        },
        'codeeditor.xml': ['codeeditor'],
        'dropdown': {
            'deps': ['jquery'],
            'exports': '$.fn.dropdown'
        },
        'modal': {
            'deps': ['jquery'],
            'exports': '$.fn.modal'
        },
        'affix': {
            'deps': ['jquery'],
            'exports': '$.fn.affix'
        }
    },
    deps: tests,
    callback: window.__karma__.start
});