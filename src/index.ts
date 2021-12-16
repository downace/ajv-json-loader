import Ajv, { AnySchemaObject, Options } from 'ajv'
import loaderUtils from 'loader-utils'
import path       from 'path';
import { loader } from 'webpack';
import { assert } from 'assert-ts';
import standaloneCode from 'ajv/dist/standalone';

export default function makeStandalone (this: loader.LoaderContext, schemaStr: string, sourceMap: string) {
    const done = this.async();

    assert(!!done, `no done function`);

    const loadSchema = (uri: string) => {
        const filePath = path.resolve(this.context, uri);
        return new Promise<AnySchemaObject>(function (resolve, reject) {
            try {
                const schema = require(filePath);
                resolve(schema);
            } catch (e) {
                e.message = `Couldn't load schema: ${e.message}`;
                reject(e);
            }
        });
    };

    const options           = loaderUtils.getOptions(this) || {};
    const loaderOptions        = options.ajv ?? {};
    const ajvOptions: Options       = { loadSchema, ...loaderOptions, code: { source: true }};

    const ajv = new Ajv(ajvOptions);

    let schema;

    try {
        schema = JSON.parse(schemaStr);
    } catch (e) {
        e.message = `Schema is not a valid JSON: ${e.message}`;
        done(e);
        return;
    }

    ajv.compileAsync(schema)
        .then(validate => {
            let moduleCode = standaloneCode(ajv, validate)
            done(null, moduleCode, sourceMap);
        }, e => {
            done(e);
        });
};
