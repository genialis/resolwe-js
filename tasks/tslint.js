module.exports = (gulp, config) => {
    return () => {
        const path = require('path');
        const tslint = require('tslint');
        const $ = require('gulp-load-plugins')();

        const program = tslint.Linter.createProgram(path.join(config.projectDir, 'tsconfig.json'));

        return gulp.src(path.join(config.srcDir, '**', '*.ts'))
            .pipe($.tslint({
                program: program,
                configuration: path.join(config.projectDir, 'tslint.json'),
                formatter: 'verbose',
            }))
            .pipe($.tslint.report());
    };
};
