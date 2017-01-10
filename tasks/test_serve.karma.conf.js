// Karma configuration used in conjunction with test-serve task.

module.exports = function(config) {
    const path = require('path');
    const _ = require('lodash');
    const gulpfile = require('../gulpfile');

    const originalKarmaConf = require(path.join(gulpfile.config.projectDir, 'karma.conf.js'));
    originalKarmaConf({
        set: (originalConfig) => {
            const patchedConfig = _.cloneDeep(originalConfig);

            patchedConfig.basePath = '..'; // Fix path from here
            delete patchedConfig.preprocessors; // Remove 'coverage' preprocessor, because it makes sourcecode ugly
            delete patchedConfig.coverageReporter;
            delete patchedConfig.junitReporter;
            delete patchedConfig.browsers; // Remove PhantomJS default

            patchedConfig.reporters = ['progress'];

            config.set(patchedConfig);
        }
    });
};
