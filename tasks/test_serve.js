module.exports = (gulp, config) => {
    const path = require('path');
    const Karma = require('karma').Server;

    return (done) => {
        const server = new Karma({
            configFile: path.join(config.taskDir, 'test_serve.karma.conf.js'),
            browsers: [],
            port: 9876,
            singleRun: false,
        }, () => {
            done();
        });
        server.start();
    };
};

