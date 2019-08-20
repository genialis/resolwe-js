module.exports = (gulp, config) => {
    const path = require('path');
    const fs = require('fs');
    const minimist = require('minimist');
    const remapIstanbul = require('remap-istanbul/lib/gulpRemapIstanbul');
    const Server = require('karma').Server;
    const $ = require('gulp-load-plugins')();

    const chromiumHeadlessNoSandbox = !!minimist(process.argv.slice(3))['chromium-headless-no-sandbox'];
    const chromeHeadlessNoSandbox = !!minimist(process.argv.slice(3))['chrome-headless-no-sandbox'];

    // Json summary file path.
    const jsonSummaryPath = path.join(config.coverageDirAbs, 'json', 'summary.json');

    return (done) => {
        const karmaConfig = {
            configFile: path.join(config.projectDir, 'karma.conf.js'),
            singleRun: true
        };
        if (chromiumHeadlessNoSandbox) karmaConfig.browsers = ['ChromiumHeadlessNoSandbox'];
        if (chromeHeadlessNoSandbox) karmaConfig.browsers = ['ChromeHeadlessNoSandbox'];

        new Server(karmaConfig, (exitCode) => {
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
