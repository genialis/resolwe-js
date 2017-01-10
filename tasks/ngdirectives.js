module.exports = (gulp, config) => {
    return () => {
        const path = require('path');
        const $ = require('gulp-load-plugins')();

        return gulp.src(path.join(config.buildDir, '**', '*.js'))
            .pipe($.directiveReplace({root: config.srcDir}))
            .pipe(gulp.dest(config.buildDir));
    };
};
