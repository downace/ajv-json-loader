const Ajv         = require('ajv');
const ajvPack     = require('ajv-pack');
const loaderUtils = require('loader-utils');
const path        = require('path');

module.exports = function (schemaStr, sourceMap) {
    const done = this.async();

    const loadSchema = uri => {
        const filePath = path.resolve(this.context, uri);
        return new Promise(function (resolve, reject) {
            try {
                const schema = require(filePath);
                resolve(schema);
            } catch (e) {
                e.message = `Couldn't load schema: ${e.message}`;
                reject(e);
            }
        });
    };

    const defaultAjvOptions = { loadSchema };
    // Maybe will be used in future
    const options           = loaderUtils.getOptions(this) || {};
    const ajvOptions        = options.ajv || {};
    // { sourceCode: true } should not be overridden
    Object.assign(ajvOptions, defaultAjvOptions, ajvOptions, { sourceCode: true });

    const ajv = new Ajv(ajvOptions);

    let schema;

    try {
        schema = JSON.parse(schemaStr);
    } catch (e) {
        e.message = 'Schema is not a valid JSON: ' + e.message;
        done(e);
        return;
    }

    ajv.compileAsync(schema)
        .then(validate => {
            let moduleCode = ajvPack(ajv, validate);
            done(null, moduleCode, sourceMap);
        }, e => {
            done(e);
        });
};
