const Code = require('code');
const Joi = require('joi');
const Lab = require('lab');
const Helper = require('../helper.js');
const Validate = require('../../lib/validate.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();



lab.experiment('file', () => {

    let routes = {
        method: 'POST',
        path: '/test/',
        options: {
            handler: Helper.defaultHandler,
            plugins: {
                'hapi-swagger': {
                    payloadType: 'form'
                }
            },
            tags: ['api'],
            validate: {
                payload: {
                    file: Joi.any()
                        .meta({ swaggerType: 'file' })
                        .required()
                }
            },
            payload: {
                maxBytes: 1048576,
                parse: true,
                output: 'stream'
            }
        }
    };


    lab.test('upload', async() => {

        const server = await Helper.createServer({}, routes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
        expect(response.result.paths['/test/'].post.parameters).to.equal([
            {
                'type': 'file',
                'required': true,
                'x-meta': {
                    'swaggerType': 'file'
                },
                'name': 'file',
                'in': 'formData'
            }
        ]);
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });

    lab.test('upload with binary file type', async() => {
        routes.options.validate.payload.file = Joi.binary().meta({ swaggerType: 'file' }).required();

        const server = await Helper.createServer({}, routes);

        const response = await server.inject({ method: 'GET', url: '/swagger.json' });

        expect(response.statusCode).to.equal(200);
        expect(response.result.paths['/test/'].post.parameters).to.equal([
            {
                'type': 'file',
                'format': 'binary',
                'required': true,
                'x-meta': {
                    'swaggerType': 'file'
                },
                'name': 'file',
                'in': 'formData'
            }
        ]);
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();
    });



    lab.test('file type not fired on other meta properties', async() => {

        routes.options.validate.payload.file = Joi.any().meta({ anything: 'test' }).required();

        const server = await Helper.createServer({}, routes);

        const response = await server.inject({ method: 'GET', url: '/swagger.json' });

        expect(response.statusCode).to.equal(200);
        expect(response.result.paths['/test/'].post.parameters).to.equal([
            {
                'required': true,
                'x-meta': {
                    'anything': 'test'
                },
                'in': 'formData',
                'name': 'file',
                'type': 'string'
            }
        ]);
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();
    });

});
