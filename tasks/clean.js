module.exports = (gulp, dir) => {
    return () => {
        const path = require('path');
        const del = require('del');

        return del([path.join(dir, '**')]);
    };
};
