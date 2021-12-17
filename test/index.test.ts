import { describe, before } from 'mocha';
import chai from 'chai';
import compiler from './compiler';
import 'chai-string';
import { Stats } from 'webpack';
import chaiString from 'chai-string';

const expect = chai.expect;

chai.use(chaiString);

describe('ajv-json-loader', () => {
  let stats: Stats.ToJsonOutput;

  function compile(fixture: string, done: () => void) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    compiler(fixture).then((s: any) => {
      stats = s.toJson();
      done();
    });
  }

  context('invalid JSON', () => {
    before((done) => {
      compile('invalid-json.json', done);
    });

    it('should error if schema is not a valid JSON', () => {
      expect(stats.errors).to.have.lengthOf(1);
      expect(stats.errors[0]).to.contain('Schema is not a valid JSON: Unexpected end of JSON input');
    });
  });

  context('invalid schema', () => {
    before((done) => {
      compile('invalid.json', done);
    });

    it('should error if schema is not a valid JSON-schema', () => {
      expect(stats.errors).to.have.lengthOf(1);
      expect(stats.errors[0]).to.contain('schema is invalid: data/properties must be object');
    });
  });

  context('simple schema', () => {
    before((done) => {
      compile('simple.json', done);
    });

    it('should emit correct module code for simple schema', () => {
      expect(stats.errors).to.be.empty;
      const output = stats?.modules?.[0]?.source;

      // region const simpleSchemaCode = `...`;
      const simpleSchemaCode = `"use strict";
          module.exports = validate10;
          module.exports.default = validate10;
          const schema11 = {
            "type":"object",
            "required":["key"]
          };
          function validate10(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
            let vErrors = null;
            let errors = 0;if(errors === 0){
              if(data && typeof data == "object" && !Array.isArray(data)){
                let missing0;
                if((data.key === undefined) && (missing0 = "key")){
                  validate10.errors = [{
                    instancePath,
                    schemaPath:"#/required",
                    keyword:"required",
                    params:{
                      missingProperty: missing0
                    },
                    message:"must have required property '"+missing0+"'"
                  }];
                  return false;
                }
              } else {
                validate10.errors = [{
                  instancePath,
                  schemaPath:"#/type",
                  keyword:"type",
                  params:{
                    type: "object"
                  },
                  message:"must be object"
                }];
                return false;
              }
            }
            validate10.errors = vErrors;
            return errors === 0;
          }`;
      // endregion
      expect(output).to.equalIgnoreSpaces(simpleSchemaCode);
    });
  });

  context('schema with missing ref', () => {
    before((done) => {
      compile('missing-ref.json', done);
    });

    it("should error if referenced schema couldn't be loaded", () => {
      expect(stats.errors).to.have.lengthOf(1);
      expect(stats.errors[0]).to.contain("Couldn't load schema: Cannot find module");
    });
  });

  context('schema with ref', () => {
    before((done) => {
      compile('with-ref.json', done);
    });

    it('should emit correct module code for schema with external references', () => {
      expect(stats.errors).to.be.empty;
      const output = stats?.modules?.[0]?.source;

      // region const complexSchemaCode = `...`;
      const complexSchemaCode = `"use strict";
        module.exports = validate11;
        module.exports.default = validate11;
        const schema11 = {
          "type":"object",
          "properties":{
            "key":{
              "$ref":"referenced.json#/definitions/key"
            }
          }
        };
        const schema14 = {
          "required":["prop"]
        };
        function validate11(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
          let vErrors = null;
          let errors = 0;
          if(errors === 0){
            if(data && typeof data == "object" && !Array.isArray(data)){
              if(data.key !== undefined){
                let data0 = data.key;
                if(data0 && typeof data0 == "object" && !Array.isArray(data0)){
                  let missing0;
                  if((data0.prop === undefined) && (missing0 = "prop")){
                    validate11.errors = [{
                      instancePath:instancePath+"/key",
                      schemaPath:"referenced.json#/definitions/key/required",
                      keyword:"required",
                      params:{
                        missingProperty: missing0},
                        message:"must have required property '"+missing0+"'"}];
                        return false;
                      }
                    }
                  }
                } else {
                  validate11.errors = [{
                    instancePath,
                    schemaPath:"#/type",keyword:"type",
                    params:{
                      type: "object"
                    },
                    message:"must be object"
                  }];
                  return false;
                }
              }
              validate11.errors = vErrors;return errors === 0;
            }`;
      // endregion
      expect(output).to.equalIgnoreSpaces(complexSchemaCode);
    });
  });
});
