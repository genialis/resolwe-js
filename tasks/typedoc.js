module.exports = (gulp, config) => {
    return () => {
        const path = require('path');
        const typedoc = require("gulp-typedoc");

        return gulp
            .src(path.join(config.srcDir, '**', '*.ts'))
            .pipe(typedoc({
                module: "amd",
                target: "es5",
                experimentalDecorators: true,
                // TODO: Remove this when TypeDoc can handle all supported options from Typescript 2.1.
                ignoreCompilerErrors: true,
                out: "docs/",
                name: "Resolwe"
            }));
    };
};
