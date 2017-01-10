module.exports = (gulp, config) => {
    const _ = require('lodash');
    const path = require('path');
    const preprocess = require('gulp-preprocess');
    const $ = require('gulp-load-plugins')();

    if (!global.tsProjectCreate) { // memoized singleton
        global.tsProjectCreate = _.memoize($.typescript.createProject, (...args) => JSON.stringify(args));
    }

    return () => {
        const tsProject = tsProjectCreate(path.join(config.projectDir, 'tsconfig.json'));

        return gulp.src(path.join(config.srcDir, '**', '*.ts'))
                   .pipe($.sourcemaps.init())
                   .pipe(preprocess())
                   .pipe(tsProject($.typescript.reporter.defaultReporter()))
                   .pipe($.sourcemaps.write())
                   .pipe(gulp.dest(config.buildDir));
    };
};
