const path = require('path');
const gulpfile = require('./gulpfile');

const buildDir = path.basename(gulpfile.config.buildDir);
const srcDir = path.basename(gulpfile.config.srcDir);

const preprocessors = {};
preprocessors[path.join(buildDir, '!(*spec).js')] = ['coverage'];

module.exports = function(config) {
    config.set({

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: './',


        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['systemjs', 'jasmine'],


        // list of files / patterns to load in the browser
        files: [
            // Ensure that test initialization is loaded first.
            path.join(buildDir, 'tests', 'initialization.js'),
            // After initialization, load all the test files.
            path.join(buildDir, '**', '*.spec.js'),
        ],


        proxies: {
        },


        // list of files to exclude
        exclude: [
        ],


        // SystemJS.
        systemjs: {
            configFile: 'system.conf.js',
            serveFiles: [
                path.join(buildDir, '**', '!(*.spec).js'),
                path.join('node_modules', '**', '*.js')
            ],
        },


        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: preprocessors,


        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['progress', 'coverage', 'junit'],


        // web server port
        port: 9876,


        // enable / disable colors in the output (reporters and logs)
        colors: true,


        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,


        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: false,


        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['ChromeHeadless'],
        browserNoActivityTimeout: 30000,


        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        // This is set in gulp task
        // singleRun: false,

        // Concurrency level
        // how many browser should be started simultaneous
        concurrency: Infinity,

        coverageReporter: {
            dir : gulpfile.config.coverageDirRel,
            reporters: [
                { type: 'json', subdir: 'json' }
            ]
        },

        junitReporter: {
            outputDir: path.join(gulpfile.config.reportsDirRel, 'junit'),
            outputFile: 'report.xml',
            useBrowserName: false
        }
    })
};
