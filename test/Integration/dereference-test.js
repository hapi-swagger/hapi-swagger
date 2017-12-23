const Code = require('code');
const Joi = require('joi');
const Lab = require('lab');
const Builder = require('../../lib/builder.js');
const Helper = require('../helper.js');
const Validate = require('../../lib/validate.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();



lab.experiment('dereference', () => {

    const routes = [{
        method: 'POST',
        path: '/store/',
        options: {
            handler: Helper.defaultHandler,
            tags: ['api'],
            validate: {
                payload: {
                    a: Joi.number(),
                    b: Joi.number(),
                    operator: Joi.string(),
                    equals: Joi.number()
                }
            }
        }
    }];


    lab.test('flatten with no references', async() => {

        const server = await Helper.createServer({ deReference: true }, routes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
        expect(response.result.paths['/store/'].post.parameters).to.equal([
            {
                'in': 'body',
                'name': 'body',
                'schema': {
                    'properties': {
                        'a': {
                            'type': 'number'
                        },
                        'b': {
                            'type': 'number'
                        },
                        'operator': {
                            'type': 'string'
                        },
                        'equals': {
                            'type': 'number'
                        }
                    },
                    'type': 'object'
                }
            }
        ]);
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });


    lab.test('dereferences error', async() => {

        try {
            await Builder.dereference(null);
        } catch(err) {
            expect(err).to.exists();
            expect(err.message).to.equal('failed to dereference schema');
        }

    });


});
