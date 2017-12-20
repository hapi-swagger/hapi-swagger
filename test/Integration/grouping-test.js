const Code = require('code');
const Hapi = require('hapi');
const Inert = require('inert');
const Lab = require('lab');
const Vision = require('vision');
const HapiSwagger = require('../../lib/index.js');
const Validate = require('../../lib/validate.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();


const testPlugin = {
    name: 'grouping1',
    register: (server) => {

        server.route({
            method: 'GET',
            path: '/grouping1',
            options: {
                handler: () => 'Hi from grouping 1',
                description: 'plugin1',
                tags: ['api', 'hello group', 'another group']
            }
        });
    }
};


let swaggerOptions = {
    schemes: ['http'],
    info: {
        'title': 'Test API Documentation',
        'description': 'This is a sample example of API documentation.',
        'version': '1.0.0',
        'termsOfService': 'https://github.com/glennjones/hapi-swagger/',
        'contact': {
            'email': 'glennjonesnet@gmail.com'
        },
        'license': {
            'name': 'MIT',
            'url': 'https://raw.githubusercontent.com/glennjones/hapi-swagger/master/license.txt'
        }
    }
};


lab.experiment('default grouping', () => {

    lab.test('group by path', async() => {

        const server = await new Hapi.Server({});
        await server.register([
            Inert,
            Vision,
            {
                plugin: testPlugin
            },
            {
                plugin: HapiSwagger,
                options: swaggerOptions
            }
        ]);
        await server.start();

        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
        expect(response.result.paths['/grouping1']).to.equal({

            'get': {
                'tags': [
                    'grouping1'
                ],
                'responses': {
                    'default': {
                        'schema': {
                            'type': 'string'
                        },
                        'description': 'Successful'
                    }
                },
                'operationId': 'getGrouping1',
                'summary': 'plugin1'
            }
        });
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });

    lab.experiment('tag grouping', async() => {

        lab.test('group by tags', async() => {

            const server = await new Hapi.Server({});
            swaggerOptions.grouping = 'tags';
            await server.register([
                Inert,
                Vision,
                testPlugin,
                {
                    plugin: HapiSwagger,
                    options: swaggerOptions
                }
            ]);
            await server.start();
            const response = await server.inject({ method: 'GET', url: '/swagger.json' });
            expect(response.statusCode).to.equal(200);
            expect(response.result.paths['/grouping1']).to.equal({

                'get': {
                    'tags': [
                        'hello group',
                        'another group'
                    ],
                    'responses': {
                        'default': {
                            'schema': {
                                'type': 'string'
                            },
                            'description': 'Successful'
                        }
                    },
                    'operationId': 'getGrouping1',
                    'summary': 'plugin1'
                }
            });
            const isValid = await Validate.test(response.result);
            expect(isValid).to.be.true();
        });

    });


    lab.experiment('tag grouping with tagsGroupingFilter', () => {

        lab.test('group by filtered tags', async() => {

            const server = await new Hapi.Server({});
            swaggerOptions.grouping = 'tags';
            swaggerOptions.tagsGroupingFilter = (tag) => tag === 'hello group';

            await server.register([
                Inert,
                Vision,
                testPlugin,
                {
                    plugin: HapiSwagger,
                    options: swaggerOptions,
                }
            ]);

            await server.start();
            const response = await server.inject({ method: 'GET', url: '/swagger.json' });

            expect(response.statusCode).to.equal(200);
            expect(response.result.paths['/grouping1']).to.equal({

                'get': {
                    'tags': [
                        'hello group'
                    ],
                    'responses': {
                        'default': {
                            'schema': {
                                'type': 'string'
                            },
                            'description': 'Successful'
                        }
                    },
                    'operationId': 'getGrouping1',
                    'summary': 'plugin1'
                }
            });
            const isValid = await Validate.test(response.result);
            expect(isValid).to.be.true();
        });
    });
});
