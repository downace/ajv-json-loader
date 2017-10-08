# ajv-json-loader
[Webpack loader](https://webpack.js.org/concepts/loaders)
that compiles JSON strings into
[Ajv](https://github.com/epoberezkin/ajv) validation functions
using [ajv-pack](https://github.com/epoberezkin/ajv-pack)

Slightly increases application performance - all schemas are compiled
at build step, not at runtime

It also decreases build size because of excluding Ajv library itself from bundle
>However, it may depend on total size of schemas.
>For few schemas with small size it's a 100% profit.
>Not sure about the ratio between size of JSON-schema and size of compiled function,
>so for large schemas it may be not so useful

## Installation

```npm
npm i -D ajv-json-loader
```

## Usage

Use it as loader for JSON-schemas in your webpack config like this:
```javascript
module.exports = {
  // ...
  module: {
    loaders: [
      {
        test: /\.schema\.json$/,
        use: [
          {
            loader: 'ajv-json-loader',
            options: {
              ajv: {
                // Pass any Ajv constructor options here
                allErrors: true,
              }
            }
          }
        ]
      }
    ]
  }
};
```

Then you can use your schemas like this:

```javascript
const validateMySchema = require('/path/to/schemas/my.schema.json');

if (validateMySchema(data)) {
  console.log('Valid!');
} else {
  console.error('Invalid: ' + validateMySchema.errors.join(','));
}

```

## Referencing to external schemas (using `$ref`)

Loader uses Ajv's [`loadSchema`](https://github.com/epoberezkin/ajv#options) option to load external schemas.
Default implementation will try to just `require` file with name specified in `$ref` field
to load referenced schema.
You can override it by passing corresponding option to loader (see example above)
>If you think that your custom `loadSchema` option is pretty general,
>feel free to create an issue or PR to add it as loader option to make webpack config more clean

For example, if you have following schemas in `/path/to/schemas`:

**foo.json**
```json
{
  "id": "foo.json#",
  "properties": {
    "bar": { "$ref": "bar.json#/definitions/bar" }
  }
}
```
**bar.json**
```json
{
  "id": "bar.json#",
  "properties": {
    "baz": {
      "type": "string"
    }
  }
}

```
Loader will call `require(path.resolve('/path/to/schemas'), 'bar.json')` to load `bar.json#` schema

## TypeScript typings

If you are using [TypeScript](https://github.com/Microsoft/TypeScript),
you can add typings to your project like this:
```typescript
declare module '*.schema.json' {
  import { ErrorObject } from 'ajv';

  interface ValidateFn {
      (data: object): boolean;
      errors: ErrorObject[] | null;
  }
  const validate: ValidateFn;
  export default validate;
}
```
Then when you import your schema
After this TypeScript compiler will know that modules ending with `.schema.json`
exports an `ValidateFn` object

## Limitations

This loader uses `ajv-pack` package, so limitations are
[the same](https://github.com/epoberezkin/ajv-pack#limitations)
