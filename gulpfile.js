const gulp = require('gulp');
const path = require('path');
const runSequence = require('run-sequence');

const config = {
    projectDir: __dirname,
    srcDir: path.join(__dirname, 'src'),
    buildDir: path.join(__dirname, 'dist'),
    taskDir: path.join(__dirname, 'tasks'),
    testDir: path.join(__dirname, '.test')
};
const reportsDir = '_reports';
config.reportsDirRel = path.join(path.basename(config.testDir), reportsDir);
config.reportsDirAbs = path.join(config.testDir, reportsDir);
const coverageDir = 'coverage';
config.coverageDirRel = path.join(config.reportsDirRel, coverageDir);
config.coverageDirAbs = path.join(config.reportsDirAbs, coverageDir);

// Cleanup.
gulp.task('clean:build', require('./tasks/clean')(gulp, config.buildDir));
gulp.task('clean', ['clean:build']);

// TypeScript compilation.
gulp.task('compile', ['clean'], require('./tasks/compile')(gulp, config));

// AngularJS postprocessing.
gulp.task('ng:directives', ['compile'], require('./tasks/ngdirectives')(gulp, config));
gulp.task('ng:annotate', ['ng:directives'], require('./tasks/ngannotate')(gulp, config));

// Meta task.
gulp.task('prepare', ['ng:annotate']);
gulp.task('prepare:production', (callback) => {
    // Enable production compilation.
    // TODO: Rename to RESOLWE_PRODUCTION.
    process.env['GENJS_PRODUCTION'] = '1';

    runSequence('prepare', callback);
});

// TypeScript lint.
gulp.task('tslint', [], require('./tasks/tslint')(gulp, config));

// All source code checks.
gulp.task('check', ['tslint']);

// TypeScript documentation.
gulp.task('typedoc', [], require('./tasks/typedoc')(gulp, config));

// Unit tests.
gulp.task('test:bare', require('./tasks/test')(gulp, config));
gulp.task('test', (callback) => {
    runSequence(
        'prepare',
        'test:bare',
        callback
    );
});

// Helper task when writing unit tests.
// Serves karma server so unit tests and app can be run at the same time.
// 'serve' task has to be running prior to running this task (handles compiling).
// Task has to be restarted when adding new *.ts files.
gulp.task('test-serve', require('./tasks/test_serve')(gulp, config));

gulp.task('sanity', ['check', 'test']);

// Build production version.
gulp.task('build', ['prepare:production'])

// Exports.
module.exports = {
    config: config
};
