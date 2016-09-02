'use strict';
const Code = require('code');
const Lab = require('lab');
const Validate = require('../../lib/validate.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();


const swaggerJSON = {
    'swagger': '2.0',
    'host': 'localhost:3000',
    'basePath': '/v1',
    'schemes': [
        'http'
    ],
    'info': {
        'title': 'Test API Documentation',
        'version': '7.0.0'
    },
    'paths': {
        '/test': {
            'post': {
                'operationId': 'postTest',
                'parameters': [
                    {
                        'in': 'body',
                        'name': 'body',
                        'schema': {
                            '$ref': '#/definitions/Model 1'
                        }
                    }
                ],
                'tags': [
                    'test'
                ],
                'responses': {
                    'default': {
                        'schema': {
                            'type': 'string'
                        },
                        'description': 'Successful'
                    }
                }
            }
        }
    },
    'definitions': {
        'Model 1': {
            'type': 'object',
            'properties': {
                'a': {
                    'type': 'string'
                }
            }
        }
    }
};


lab.experiment('validate - log ', () => {

    lab.test('bad schema', (done) => {

        Validate.log({}, (tags) => {
            expect(tags).to.equal(['validation', 'error']);
            done();
        });
    });


    lab.test('good schema', (done) => {

        Validate.log(swaggerJSON, (tags) => {
            expect(tags).to.equal(['validation', 'info']);
            done();
        });
    });


});


lab.experiment('validate - test ', () => {

    lab.test('bad schema', (done) => {

        Validate.test({}, ( err, status ) => {
            expect( status ).to.equal(false);
            done();
        });
    });


    lab.test('good schema', (done) => {

        Validate.test(swaggerJSON, ( err, status ) => {
            expect( status ).to.equal(true);
            done();
        });
    });


});
