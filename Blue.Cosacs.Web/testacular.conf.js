// Testacular configuration
// Generated on Sun Sep 16 2012 20:06:56 GMT+0100 (GMT Daylight Time)

// base path, that will be used to resolve files and exclude
basePath = 'static/js/';

// list of files / patterns to load in the browser
files = [
    JASMINE,
    JASMINE_ADAPTER,
    // for configuring Require.JS with Testacular see https://github.com/vojtajina/testacular/blob/requirejs/test/e2e/requirejs
    'test/adapter-first.js', // // first

    // all the sources, tests
    // 'main.js',
    // 'dependency.js',
    'requirejs-config.js',
    'lib/underscore.js',
    'lib/console.js',
    'config/decisionTable.js',
    'test/unit/*.js',

    // require.js itself
    'test/adapter-before.js',
    'lib/require-jquery.js',
    //'test/require-config.js',
    'test/adapter-after.js'
];

// list of files to exclude
exclude = [
    'test/hilo.*',
    'test/jquery.pickList.*',
    'test/main.*',
    'test/qunit.js'
];

// test results reporter to use
// possible values: dots || progress
reporter = 'progress';

// web server port
port = 8080;

// cli runner port
runnerPort = 9100;

// enable / disable colors in the output (reporters and logs)
colors = true;

// level of logging
// possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
logLevel = LOG_INFO;

// enable / disable watching file and executing tests whenever any file changes
autoWatch = true;

// Start these browsers, currently available:
// - Chrome
// - ChromeCanary
// - Firefox
// - Opera
// - Safari
// - PhantomJS
browsers = ['ChromeCanary'];
//browsers = ['PhantomJS','ChromeCanary','Chrome','Firefox','Opera','IE'];

// Continuous Integration mode
// if true, it capture browsers, run tests and exit
singleRun = false;

preprocessors = {
    '**/*.coffee': 'coffee'
};
