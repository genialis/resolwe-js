module.exports = (gulp, config) => {
    return () => {
        const path = require('path');
        const typedoc = require("gulp-typedoc");

        return gulp
            .src(path.join(config.srcDir, '**', '*.ts'))
            .pipe(typedoc({
                tsconfig: path.join(config.projectDir, 'tsconfig.json'),
                out: "docs/",
                name: "Resolwe"
            }));
    };
};
