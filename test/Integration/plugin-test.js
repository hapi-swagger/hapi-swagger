const Code = require('code');
const Hapi = require('hapi');
const Inert = require('inert');
const Joi = require('joi');
const Lab = require('lab');
const Vision = require('vision');
const HapiSwagger = require('../../lib/index.js');
const Helper = require('../helper.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();

lab.experiment('plugin', () => {

    const routes = [{
        method: 'POST',
        path: '/store/',
        config: {
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


    lab.test('plug-in register no vision dependency', async() => {

        try {
            const server = new Hapi.Server();
            await server.register([
                Inert,
                HapiSwagger
            ]);
            server.route(routes);
            await server.start();
        } catch (err) {
            expect(err.message).to.equal('Plugin hapi-swagger missing dependency vision');
        }
    });

    lab.test('plug-in register no inert dependency', async() => {

        try {
            const server = new Hapi.Server();
            await server.register([
                Vision,
                HapiSwagger
            ]);
            server.route(routes);
            await server.start();
        } catch (err) {
            expect(err.message).to.equal('Plugin hapi-swagger missing dependency inert');
        }
    });

    lab.test('plug-in register no options', async() => {

        try {
            const server = new Hapi.Server();
            await server.register([
                Inert,
                Vision,
                HapiSwagger
            ]);
            server.route(routes);
            await server.start();
            expect(server).to.be.an.object();
        } catch(err) {
            expect(err).to.equal(undefined);
        }

    });

    lab.test('plug-in register test', async() => {

        const server = await Helper.createServer({}, routes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
        expect(response.result.paths).to.have.length(1);
    });

    lab.test('default jsonPath url', async() => {

        const server = await Helper.createServer({}, routes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
    });

    lab.test('default documentationPath url', async() => {

        const server = await Helper.createServer({}, routes);
        const response = await server.inject({ method: 'GET', url: '/documentation' });
        expect(response.statusCode).to.equal(200);

    });

    lab.test('default swaggerUIPath url', async() => {

        const server = await Helper.createServer({}, routes);
        const response = await server.inject({ method: 'GET', url: '/swaggerui/swagger-ui.js' });
        expect(response.statusCode).to.equal(200);
    });

    lab.test('swaggerUIPath + extend.js remapping', async() => {
        const server = await Helper.createServer({}, routes);
        const response = await server.inject({ method: 'GET', url: '/swaggerui/extend.js' });
        expect(response.statusCode).to.equal(200);
    });

    const swaggerOptions = {
        'jsonPath': '/test.json',
        'documentationPath': '/testdoc',
        'swaggerUIPath': '/testui/'
    };

    lab.test('repathed jsonPath url', async () => {
        const server = await Helper.createServer(swaggerOptions, routes);
        const response = await server.inject({ method: 'GET', url: '/test.json' });
        expect(response.statusCode).to.equal(200);
    });

    lab.test('repathed documentationPath url', async () => {

        const server = await Helper.createServer(swaggerOptions, routes);
        const response = await server.inject({ method: 'GET', url: '/testdoc' });
        expect(response.statusCode).to.equal(200);
    });


    lab.test('disable documentation path', async() => {

        const swaggerOptions = {
            'documentationPage': false
        };

        const server = await Helper.createServer(swaggerOptions, routes);
        const response = await server.inject({ method: 'GET', url: '/documentation' });
        expect(response.statusCode).to.equal(404);

    });

    lab.test('disable swagger UI', async() => {

        const swaggerOptions = {
            'swaggerUI': false,
            'documentationPage': false
        };

        const server = await Helper.createServer(swaggerOptions, routes);
        const response = await server.inject({ method: 'GET', url: '/swaggerui/swagger-ui.js' });
        expect(response.statusCode).to.equal(404);
    });

    lab.test('disable swagger UI overriden by documentationPage', async() => {

        const swaggerOptions = {
            'swaggerUI': false,
            'documentationPage': true
        };

        const server = await Helper.createServer(swaggerOptions, routes);
        const response = await server.inject({ method: 'GET', url: '/swaggerui/swagger-ui.js' });
        expect(response.statusCode).to.equal(200);

    });

    lab.test('should take the plugin route prefix into account when rendering the UI', async() => {

        const server = new Hapi.Server();
        await server.register([
            Inert,
            Vision,
            {
                plugin: HapiSwagger,
                routes: {
                    prefix: '/implicitPrefix'
                },
                options: {}
            }
        ]);

        server.route(routes);
        await server.start();
        const response = await server.inject({ method: 'GET', url: '/implicitPrefix/documentation' });
        expect(response.statusCode).to.equal(200);
        const htmlContent = response.result;
        expect(htmlContent).to.contain([
            '/implicitPrefix/swaggerui/swagger-ui.js',
            '/implicitPrefix/swagger.json'
        ]);

    });

    lab.test('enable cors settings, should return headers with origin settings', async() => {

        const swaggerOptions = {
            'cors': true
        };

        const server = await Helper.createServer(swaggerOptions, routes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });

        expect(response.statusCode).to.equal(200);
        // https://stackoverflow.com/questions/25329405/why-isnt-vary-origin-response-set-on-a-cors-miss
        expect(response.headers.vary).to.equal('origin');
        expect(response.result.paths['/store/'].post.parameters.length).to.equal(1);
        expect(response.result.paths['/store/'].post.parameters[0].name).to.equal('body');
    });

    lab.test('disable cors settings, should return headers without origin settings', async() => {

        const swaggerOptions = {
            'cors': false
        };

        const server = await Helper.createServer(swaggerOptions, routes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
        expect(response.headers.vary).to.not.equal('origin');
        expect(response.result.paths['/store/'].post.parameters.length).to.equal(1);
        expect(response.result.paths['/store/'].post.parameters[0].name).to.equal('body');
    });

    lab.test('default cors settings as false, should return headers without origin settings', async() => {

        const swaggerOptions = {};

        const server = await Helper.createServer(swaggerOptions, routes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
        expect(response.headers.vary).to.not.equal('origin,accept-encoding');
        expect(response.result.paths['/store/'].post.parameters.length).to.equal(1);
        expect(response.result.paths['/store/'].post.parameters[0].name).to.equal('body');
    });

    lab.test('payloadType = form global', async() => {

        const swaggerOptions = {
            'payloadType': 'json'
        };

        const server = await Helper.createServer(swaggerOptions, routes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
        expect(response.result.paths['/store/'].post.parameters.length).to.equal(1);
        expect(response.result.paths['/store/'].post.parameters[0].name).to.equal('body');
    });

    lab.test('payloadType = json global', async() => {

        const swaggerOptions = {
            'payloadType': 'form'
        };

        const server = await Helper.createServer(swaggerOptions, routes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
        expect(response.result.paths['/store/'].post.parameters.length).to.equal(4);
        expect(response.result.paths['/store/'].post.parameters[0].name).to.equal('a');

    });

    lab.test('pathPrefixSize global', async() => {

        const swaggerOptions = {
            'pathPrefixSize': 2
        };

        const prefixRoutes = [{
            method: 'GET',
            path: '/foo/bar/extra',
            config: {
                handler: Helper.defaultHandler,
                tags: ['api']
            }
        }];

        const server = await Helper.createServer(swaggerOptions, prefixRoutes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
        expect(response.result.paths['/foo/bar/extra'].get.tags[0]).to.equal('foo/bar');
    });

    lab.test('expanded none', async() => {

        // TODO find a way to test impact of property change
        const server = await Helper.createServer({ 'expanded': 'none' });
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
    });


    lab.test('expanded list', async() => {

        const server = await Helper.createServer({ 'expanded': 'list' });
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
    });

    lab.test('expanded full', async() => {

        const server = await Helper.createServer({ 'expanded': 'full' }, routes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
    });

    lab.test('pass through of tags querystring', async() => {

        const server = await Helper.createServer({}, routes);
        const response = await server.inject({ method: 'GET', url: '/documentation?tags=reduced' });
        expect(response.statusCode).to.equal(200);
        expect(response.result.indexOf('swagger.json?tags=reduced') > -1).to.equal(true);
    });

    lab.test('test route x-meta appears in swagger', async() => {
        const testRoutes = [{
            method: 'POST',
            path: '/test/',
            config: {
                handler: Helper.defaultHandler,
                tags: ['api'],
                plugins: {
                    'hapi-swagger': {
                        'x-meta': {
                            test1: true,
                            test2: 'test',
                            test3: {
                                test: true,
                            }
                        },
                    },
                },
            }
        }];
        const server = await Helper.createServer({}, testRoutes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.result.paths['/test/'].post['x-meta']).to.equal({
            test1: true,
            test2: 'test',
            test3: {
                test: true,
            }
        });
    });


    lab.test('test {disableDropdown: true} in swagger', async() => {
        const testRoutes = [{
            method: 'POST',
            path: '/test/',
            config: {
                handler: Helper.defaultHandler,
                tags: ['api'],
                validate: {
                    payload: {
                        a: Joi.number().integer().allow(0).meta( {disableDropdown: true} )
                    }
                }
            }
        }];
        const server = await Helper.createServer({}, testRoutes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        //console.log(JSON.stringify(response.result));
        expect(response.result.definitions).to.equal(
            {
                'Model 1': {
                    'type': 'object',
                    'properties': {
                        'a': {
                            'type': 'integer',
                            'x-meta': {
                                'disableDropdown': true
                            }
                        }
                    }
                }
            }
        );
    });

});
