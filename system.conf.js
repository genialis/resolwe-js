// SystemJS configuration used during tests.
System.config({
    transpiler: 'none',

    defaultJSExtensions: true,

    paths: {
        // Base SystemJS dependencies.
        'systemjs': 'node_modules/systemjs/dist/system.js',
        'system-polyfills': 'node_modules/systemjs/dist/system-polyfills.js',
        'es6-module-loader': 'node_modules/es6-module-loader/dist/es6-module-loader.js',

        // Dependencies from package.json.
        'lodash': 'node_modules/lodash/index.js',
        'rx': 'node_modules/rx/index.js',
        'immutable': 'node_modules/immutable/dist/immutable.js',
        'jquery': 'node_modules/jquery/dist/jquery.js',
        'jquery.cookie': 'node_modules/jquery.cookie/jquery.cookie.js',
        'angular': 'node_modules/angular/index.js',
        'angular-mocks': 'node_modules/angular-mocks/angular-mocks.js',
        'ng-file-upload': 'node_modules/ng-file-upload/index.js',
        'pako': 'node_modules/pako/index.js',
    }
});
