import {describe, before} from 'mocha'
import chai     from 'chai';
import compiler from './compiler';
import 'chai-string';
import { Stats } from 'webpack';

export {};

const expect   = chai.expect;

chai.use(require('chai-string'));

describe('ajv-json-loader', () => {

    let stats: Stats.ToJsonOutput;

    function compile(fixture: string, done: () => void) {
        compiler(fixture).then((s: any) => {
            stats = s.toJson();
            done();
        });
    }

    context('invalid JSON', () => {

        before(done => {
            compile('invalid-json.json', done);
        });

        it('should error if schema is not a valid JSON', () => {

            expect(stats.errors).to.have.lengthOf(1);
            expect(stats.errors[ 0 ]).to.contain('Schema is not a valid JSON: Unexpected end of JSON input');

        });

    });

    context('invalid schema', () => {

        before(done => {
            compile('invalid.json', done);
        });

        it('should error if schema is not a valid JSON-schema', () => {

            expect(stats.errors).to.have.lengthOf(1);
            expect(stats.errors[ 0 ]).to.contain('schema is invalid: data.properties should be object');

        });

    });

    context.only('simple schema', () => {

        before(done => {
            compile('simple.json', done);
        });

        it.only('should emit correct module code for simple schema', () => {
            console.dir({stats}, {depth: 333})

            expect(stats.errors).to.be.empty;
            const output = stats?.modules?.[ 0 ]?.source;

            // region const simpleSchemaCode = `...`;
            const simpleSchemaCode = `'use strict';
                var validate = (function() {
                  var refVal = [];
                  return function validate(data, dataPath, parentData, parentDataProperty, rootData) {
                    'use strict';
                    if ((data && typeof data === "object" && !Array.isArray(data))) {
                      var missing0;
                      if (((data.key === undefined) && (missing0 = '.key'))) {
                        validate.errors = [{
                          keyword: 'required',
                          dataPath: (dataPath || '') + "",
                          schemaPath: '#/required',
                          params: {
                            missingProperty: '' + missing0 + ''
                          },
                          message: 'should have required property \\'' + missing0 + '\\''
                        }];
                        return false;
                      }
                    }
                    validate.errors = null;
                    return true;
                  };
                })();
                validate.schema = {
                  "required": ["key"]
                };
                validate.errors = null;
                module.exports = validate;`;
            // endregion
            console.dir({output})
            expect(output).to.equalIgnoreSpaces(simpleSchemaCode);

        });

    });

    context('schema with missing ref', () => {

        before(done => {
            compile('missing-ref.json', done);
        });

        it('should error if referenced schema couldn\'t be loaded', () => {

            expect(stats.errors).to.have.lengthOf(1);
            expect(stats.errors[ 0 ]).to.contain('Couldn\'t load schema: Cannot find module');

        });

    });

    context('schema with ref', () => {

        before(done => {
            compile('with-ref.json', done);
        });

        it('should emit correct module code for schema with external references', () => {

            expect(stats.errors).to.be.empty;
            const output = stats?.modules?.[ 0 ]?.source;

            // region const complexSchemaCode = `...`;
            const complexSchemaCode = `'use strict';
                var validate = (function() {
                  var refVal = [];
                  var refVal1 = {
                    "required": ["prop"]
                  };
                  refVal[1] = refVal1;
                  return function validate(data, dataPath, parentData, parentDataProperty, rootData) {
                    'use strict';
                    var vErrors = null;
                    var errors = 0;
                    if ((data && typeof data === "object" && !Array.isArray(data))) {
                      var errs__0 = errors;
                      var valid1 = true;
                      var data1 = data.key;
                      if (data1 === undefined) {
                        valid1 = true;
                      } else {
                        var errs_1 = errors;
                        var errs_2 = errors;
                        if ((data1 && typeof data1 === "object" && !Array.isArray(data1))) {
                          var missing2;
                          if (((data1.prop === undefined) && (missing2 = '.prop'))) {
                            validate.errors = [{
                              keyword: 'required',
                              dataPath: (dataPath || '') + '.key',
                              schemaPath: 'referenced.json#/definitions/key/required',
                              params: {
                                missingProperty: '' + missing2 + ''
                              },
                              message: 'should have required property \\'' + missing2 + '\\''
                            }];
                            return false;
                          }
                        }
                        var valid2 = errors === errs_2;
                        var valid1 = errors === errs_1;
                      }
                    }
                    validate.errors = vErrors;
                    return errors === 0;
                  };
                })();
                validate.schema = {
                  "properties": {
                    "key": {
                      "$ref": "referenced.json#/definitions/key"
                    }
                  }
                };
                validate.errors = null;
                module.exports = validate;`;
            // endregion
            expect(output).to.equalIgnoreSpaces(complexSchemaCode);

        });

    });

});
