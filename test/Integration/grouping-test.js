'use strict';
const Code = require('code');
const Hapi = require('hapi');
const Inert = require('inert');
const Lab = require('lab');
const Vision = require('vision');
const HapiSwagger = require('../../lib/index.js');
const Helper = require('../helper.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();


let testPlugin = function (plugin, options, next) {

    plugin.route({
        method: 'GET',
        path: '/grouping1',
        config: {
            handler: function (request, reply) {

                reply('Hi from grouping 1');
            },
            description: 'plugin1',
            tags: ['api', 'hello group']
        }
    });

    next();
};
testPlugin.attributes = { name: 'grouping1' };

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
    },
    connectionLabel: 'api'
};

lab.experiment('default grouping', () => {

    const server = new Hapi.Server();

    lab.before(function (done) {

        server.connection({ host: 'localhost', port: 3000, labels: 'api' });
        server.connection({ host: 'localhost', port: 3001, labels: 'docs' });
        server.register([
            Inert,
            Vision,
            {
                register: testPlugin,
                select: ['api']
            },
            {
                register: HapiSwagger,
                options: swaggerOptions,
                select: ['docs']
            }
        ]);

        server.start(() => { done(); });
    });

    lab.test('group by path', (done) => {

        const connection = server.select('docs');
        connection.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

            expect(response.statusCode).to.equal(200);
            expect(response.result.host).to.equal('localhost:3000');
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
            Helper.validate(response, done, expect);
        });
    });
});

lab.experiment('tag grouping', () => {

    const server = new Hapi.Server();

    lab.before(function (done) {

        swaggerOptions.grouping = 'tags';
        server.connection({ host: 'localhost', port: 3000, labels: 'api' });
        server.connection({ host: 'localhost', port: 3001, labels: 'docs' });
        server.register([
            Inert,
            Vision,
            {
                register: testPlugin,
                select: ['api']
            },
            {
                register: HapiSwagger,
                options: swaggerOptions,
                select: ['docs']
            }
        ]);

        server.start(() => { done(); });
    });

    lab.test('group by tags', (done) => {

        const connection = server.select('docs');
        connection.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

            expect(response.statusCode).to.equal(200);
            expect(response.result.host).to.equal('localhost:3000');
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
            Helper.validate(response, done, expect);
        });
    });
});
