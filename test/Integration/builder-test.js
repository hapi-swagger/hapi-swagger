const Joi = require('joi');
const Code = require('code');
const Lab = require('lab');
const Helper = require('../helper.js');
const Validate = require('../../lib/validate.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();



const routes = [{
    method: 'GET',
    path: '/test',
    handler: Helper.defaultHandler,
    options: {
        tags: ['api']
    }
}];

const xPropertiesRoutes = [{
    method: 'POST',
    path: '/test',
    handler: Helper.defaultHandler,
    options: {
        tags: ['api'],
        validate: {
            payload: {
                'number': Joi.number().greater(10),
                'string': Joi.string().alphanum(),
                'array': Joi.array().items(Joi.string()).length(2)
            }
        }
    }
}];


const reuseModelsRoutes = [{
    method: 'POST',
    path: '/test',
    handler: Helper.defaultHandler,
    options: {
        tags: ['api'],
        validate: {
            payload: {
                'a': Joi.object({ 'a': Joi.string() }),
                'b': Joi.object({ 'a': Joi.string() })
            }
        }
    }
}];



lab.experiment('builder', () => {


    lab.test('defaults for swagger root object properties', async() => {

        const server = await Helper.createServer({}, routes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });

        expect(response.statusCode).to.equal(200);
        expect(response.result.swagger).to.equal('2.0');
        expect(response.result.schemes).to.equal(['http']);
        expect(response.result.basePath).to.equal('/');
        expect(response.result.consumes).to.not.exist();
        expect(response.result.produces).to.not.exist();
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();
    });


    lab.test('set values for swagger root object properties', async() => {

        const swaggerOptions = {
            'swagger': '5.9.45',
            'schemes': ['https'],
            'basePath': '/base',
            'consumes': ['application/x-www-form-urlencoded'],
            'produces': ['application/json', 'application/xml'],
            'externalDocs': {
                'description': 'Find out more about HAPI',
                'url': 'http://hapijs.com'
            }
        };

        const server = await Helper.createServer(swaggerOptions, routes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });

        expect(response.statusCode).to.equal(200);
        expect(response.result.swagger).to.equal('2.0');
        expect(response.result.schemes).to.equal(['https']);
        expect(response.result.basePath).to.equal('/base');
        expect(response.result.consumes).to.equal(['application/x-www-form-urlencoded']);
        expect(response.result.produces).to.equal(['application/json', 'application/xml']);
        expect(response.result.externalDocs).to.equal(swaggerOptions.externalDocs);
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });




    lab.test('xProperties : false', async() => {

        const server = await Helper.createServer({ 'xProperties': false }, xPropertiesRoutes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });

        expect(response.result.definitions).to.equal({
            'array': {
                'type': 'array',
                'items': {
                    'type': 'string'
                }
            },
            'Model 1': {
                'type': 'object',
                'properties': {
                    'number': {
                        'type': 'number'
                    },
                    'string': {
                        'type': 'string'
                    },
                    'array': {
                        '$ref': '#/definitions/array'
                    }
                }
            }
        });

        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();
    });


    lab.test('xProperties : false', async() => {

        const server = await Helper.createServer({ 'xProperties': true }, xPropertiesRoutes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });

        expect(response.result.definitions).to.equal({
            'array': {
                'type': 'array',
                'x-constraint': {
                    'length': 2
                },
                'items': {
                    'type': 'string'
                }
            },
            'Model 1': {
                'type': 'object',
                'properties': {
                    'number': {
                        'type': 'number',
                        'x-constraint': {
                            'greater': 10
                        }
                    },
                    'string': {
                        'type': 'string',
                        'x-format': {
                            'alphanum': true
                        }
                    },
                    'array': {
                        '$ref': '#/definitions/array'
                    }
                }
            }
        });

        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();
    });


    lab.test('reuseDefinitions : true', async() => {

        const server = await Helper.createServer({ 'reuseDefinitions': true }, reuseModelsRoutes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });

        expect(response.result.definitions).to.equal({
            'a': {
                'type': 'object',
                'properties': {
                    'a': {
                        'type': 'string'
                    }
                }
            },
            'Model 1': {
                'type': 'object',
                'properties': {
                    'a': {
                        '$ref': '#/definitions/a'
                    },
                    'b': {
                        '$ref': '#/definitions/a'
                    }
                }
            }
        });

        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();
    });


    lab.test('reuseDefinitions : false', async() => {

        const server = await Helper.createServer({ 'reuseDefinitions': false }, reuseModelsRoutes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });

        //console.log(JSON.stringify(response.result));
        expect(response.result.definitions).to.equal({
            'a': {
                'type': 'object',
                'properties': {
                    'a': {
                        'type': 'string'
                    }
                }
            },
            'b': {
                'type': 'object',
                'properties': {
                    'a': {
                        'type': 'string'
                    }
                }
            },
            'Model 1': {
                'type': 'object',
                'properties': {
                    'a': {
                        '$ref': '#/definitions/a'
                    },
                    'b': {
                        '$ref': '#/definitions/b'
                    }
                }
            }
        });

        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();
    });

    lab.test('getSwaggerJSON determines host and port from request info', async () => {

        const server = await Helper.createServer({});

        const response = await server.inject({ method: 'GET', headers: { host: '194.418.15.24:7645' }, url: '/swagger.json' });

        expect(response.statusCode).to.equal(200);
        expect(response.result.host).to.equal('194.418.15.24:7645');
    });

    lab.test('getSwaggerJSON doesn\'t specify port from request info when port is default', async () => {

        const server = await Helper.createServer({});

        const response = await server.inject({ method: 'GET', headers: { host: '194.418.15.24:80' }, url: '/swagger.json' });

        expect(response.statusCode).to.equal(200);
        expect(response.result.host).to.equal('194.418.15.24');
    });

});


lab.experiment('builder', () => {

    let logs = [];
    lab.before(async() => {
        const server = await Helper.createServer({ 'debug': true }, reuseModelsRoutes);

        return new Promise((resolve) => {
            server.events.on('log', (event) => {

                logs = event.tags;
                //console.log(event);
                if (event.data === 'PASSED - The swagger.json validation passed.') {
                    logs = event.tags;
                    resolve();
                }
            });
            server.inject({ method: 'GET', url: '/swagger.json' });
        });

    });


    lab.test('debug : true', () => {
        expect(logs).to.equal(['hapi-swagger', 'validation', 'info']);
    });

});
