/**
 * Gulp task for checking API type consistency.
 *
 * It works like this:
 *
 *  - find all types in type files with `// api-typecheck:[file_name.json.gz]` comment
 *  - for each file with api-typecheck comments:
 *    - create a copy of type file
 *    - add variables with types to check at the bottom and assign remote file contents
 *    - run typescript compile and report issues
 *    - delete temporary file
 *
 * Things to note:
 *  - it's assumed that all remote files are gzipped
 */
module.exports = (gulp, config) => {
    const _ = require('lodash');
    const path = require('path');
    const typescript = require('gulp-typescript');
    const fs = require('fs');
    const request = require('request');
    const Promise = require('es6-promise').Promise;
    const zlib = require('zlib');
    const isJSON = require('is-json');
    const file = require('gulp-file');

    const TYPE_FILES_BASE_DIR = path.join(config.srcDir, 'api', 'types');
    const TYPECHECK_REGEX = /(interface|type) (\w+).+api-typecheck:(.+\.\w+)(\s*\*\/)?/g;
    const TS_CONFIG_FILE_PATH = path.join(config.projectDir, 'tsconfig.json');

    /**
     * Hardcoded url path to resolwe bio.
     *
     * TODO This could be configurable.
     */
    const getRemoteFileUrl = (fileName) => {
        return `https://github.com/genialis/resolwe-bio/blob/master/resolwe_bio/tests/files/${fileName}?raw=true`;
    };

    return (done) => {
        let error = false;
        let typesToCheckCount = 0;

        // Check each file containing type definitions.
        const allPromises =_.map(fs.readdirSync(TYPE_FILES_BASE_DIR), (localTypeFile) => {
            const localTypeFilePath = path.join(TYPE_FILES_BASE_DIR, localTypeFile);

            // Open type file and gather all types to check.
            const fileContents = fs.readFileSync(localTypeFilePath, { encoding: 'utf-8' });
            let found = TYPECHECK_REGEX.exec(fileContents);

            const typesToCheckPromises = []; // [{type1, remoteFile1, remoteFileContents1}, {type2, remoteFile2, remoteFileContents2}, ...]
            while(found) {
                // Use regex to extract type and remote file name.
                const type = found[2];
                const remoteFile = found[3];

                typesToCheckPromises.push(new Promise((resolve, reject) => {
                    // Fetch remote file.
                    request(getRemoteFileUrl(remoteFile), { encoding: null }, (error, response, body) => {
                        const statusCode = response.statusCode;
                        if (statusCode === 200) {
                            resolve({type, remoteFile, body });
                        } else if (statusCode === 404) {
                            reject(`Remote file ${remoteFile} not found`);
                        } else {
                            reject(`Error ${statusCode} when fetching remote file ${remoteFile}: ${response.statusMessage}`);
                        }
                    });
                }));

                // Continue with regex search.
                found = TYPECHECK_REGEX.exec(fileContents);
            }

            if (_.isEmpty(typesToCheckPromises)) return Promise.resolve();

            // Continue once all types are gathered and remote files fetched.
            return Promise.all(typesToCheckPromises).then((types) => {
                return new Promise((resolve) => {
                    fs.readFile(localTypeFilePath, 'utf-8', (err, localTypeFileContents) => {
                        if (err) throw err;

                        // Collect all found types we want to check in the form of
                        // `export const SomeType: SomeType = remoteFileContents;
                        const typesToAppend = _.map(types, ({type, remoteFile, body}) => {
                            typesToCheckCount++;

                            const assignment = zlib.gunzipSync(body).toString(); // Remote files are gzipped (TODO maybe add check)

                            // Make sure json is in fact json
                            if (!isJSON(assignment)) {
                                error = true;

                                const invalidJsonMessage = `Remote file ${remoteFile} is not valid JSON`;
                                console.log(invalidJsonMessage);
                                return `// ${invalidJsonMessage}`;
                            }

                            return `export const ${type}: ${type} = ${assignment};`;
                        });

                        // Prepare contents of temporary local type file to which we append types to check.
                        const virtualTypecheckFile = [
                            localTypeFileContents,
                            ...typesToAppend,
                        ];

                        const virtualFilePath = path.join(TYPE_FILES_BASE_DIR, `__${localTypeFile}`);

                        // Run typescript compiler.
                        const stream = file(virtualFilePath, virtualTypecheckFile.join('\n'), { src: true })
                            .pipe(typescript.createProject(TS_CONFIG_FILE_PATH)());

                        stream.on('error', () => {
                            error = true;
                        });
                        stream.on('data', _.noop);
                        stream.on('end', () => {
                            resolve();
                        });
                    });
                });
            }).catch((reason) => {
                error = true;
                console.log(reason);
            });
        });

        // Wait for all type checks to finish.
        Promise.all(allPromises)
            .catch(_.noop) // Errors caught in previous handler
            .then(() => {
                console.log(`Number of checked resolwe-bio types: ${typesToCheckCount}`);

                if (error) {
                    done('Type check failed.');
                } else {
                    done();
                }
            });
    };
};
