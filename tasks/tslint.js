module.exports = (gulp, config) => {
    return () => {
        const path = require('path');
        const tslint = require('gulp-tslint');

        return gulp.src(path.join(config.srcDir, '**', '*.ts'))
            .pipe(tslint({
                configuration: path.join(config.projectDir, 'tslint.json')
            }))
            .pipe(tslint.report('prose'));
    };
};
