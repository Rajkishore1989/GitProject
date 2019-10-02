// load after require.js
//
// monkey patch requirejs, to use append timestamps to sources
// to take advantage of testacular's heavy caching
// it would work even without this hack, but with reloading all the files all the time

(function() {
    var timestamps = {};
    var scripts = document.getElementsByTagName('script');

    for (var i = 0; i < scripts.length; i++) {
        var src = scripts[i].src;
        src = src.replace(/^https?\:\/\/[^\/]*/, '');
        timestamps[src.replace(/\?.*$/, '')] = src;
    }

    var load_original = requirejs.load;
    requirejs.load = function (context, moduleName, url) {
        console.log("load module: " + moduleName + " url: " + url);
        url = timestamps[url];
        return load_original.call(this, context, moduleName, url);
    };

    var requireConfig = {
        baseUrl: '/base',
        paths: {
            'underscore': 'lib/underscore',
            'console': 'lib/console'
        }
    };

    // make it async
    var start = window.__testacular__.start;
    window.__testacular__.start = function() {};

    $.get('/base/requirejs-config.js?' + (+new Date()), function(data) {
        var config = JSON.parse(data.replace('(','').replace(')',''));
        config.baseUrl = '/base';

        window.require.config(config);

        // bootstrap
        window.require(['test/unit/decisionTable'], function() {
            start();
        });
    }, 'html');
})();