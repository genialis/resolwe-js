module.exports = (gulp, config) => {
    const path = require('path');
    const fs = require('fs');
    const minimist = require('minimist');
    const remapIstanbul = require('remap-istanbul/lib/gulpRemapIstanbul');
    const Server = require('karma').Server;
    const $ = require('gulp-load-plugins')();

    // Set singleRun to false if 'not-single-run' argument provided.
    const singleRun = !minimist(process.argv.slice(3))['not-single-run'];

    // Json summary file path.
    const jsonSummaryPath = path.join(config.coverageDirAbs, 'json', 'summary.json');

    return (done) => {
        new Server({
            configFile: path.join(config.projectDir, 'karma.conf.js'),
            singleRun: singleRun
        }, (exitCode) => {
            // Run remap when finished.
            gulp.src(path.join(config.coverageDirAbs, 'json', 'coverage-final.json'))
                .pipe(remapIstanbul({
                    reports: {
                        'html': path.join(config.coverageDirAbs, 'html'),
                        'json-summary': jsonSummaryPath,
                        'cobertura': path.join(config.coverageDirRel, 'cobertura', 'cobertura.xml')
                    }
                }))
                .pipe(gulp.dest(path.join(config.coverageDirAbs, 'json')))
                .on('end', () => {
                    // Print summary
                    try {
                        const summaryJson = JSON.parse(fs.readFileSync(jsonSummaryPath));
                        $.util.log($.util.colors.inverse(summaryJson.total.statements.pct + "%") + " of statements covered");
                        $.util.log("Full coverage report: file://" + path.join(config.coverageDirAbs, 'html', 'index.html'));
                    } catch (e) {
                        $.util.log("Failed to get coverage report");
                    }

                    // Finished.
                    done(exitCode);
                });
        }).start();
    };
};
