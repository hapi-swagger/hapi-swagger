'use strict';
const Code = require('code');
const Hapi = require('hapi');
const Inert = require('inert');
const Lab = require('lab');
const Vision = require('vision');
const HapiSwagger = require('../lib/index.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();


let testPlugin = function (plugin, options, next) {

    plugin.route({
        method: 'GET',
        path: '/plugin1',
        config: {
            handler: function (request, reply) {

                reply('Hi from plugin 1');
            },
            description: 'plugin1',
            tags: ['api']
        }
    });
    next();
};
testPlugin.attributes = { name: 'plugin1' };


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



lab.experiment('document another connection', () => {

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




    lab.test('connectionLabel', (done) => {

        const connection = server.select('docs');
        connection.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

            //console.log(JSON.stringify(response.result.paths['/plugin1']))
            expect(response.statusCode).to.equal(200);
            expect(response.result.paths['/plugin1']).to.equal({
                'get': {
                    'tags': [
                        'plugin1'
                    ],
                    'responses': {
                        'default': {
                            'schema': {
                                'type': 'string'
                            },
                            'description': 'Successful'
                        }
                    },
                    'operationId': 'getPlugin1',
                    'summary': 'plugin1'
                }
            });
            done();
        });
    });


});





lab.experiment('document another connection error', () => {

    const server = new Hapi.Server();

    lab.before(function (done) {

        server.connection({ host: 'localhost', port: 3000, labels: 'api' });
        server.connection({ host: 'localhost', port: 3001, labels: 'docs' });
        server.connection({ host: 'localhost', port: 3002, labels: 'api' });
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



    lab.test('select first connection', (done) => {

        server.connection({ host: 'localhost', port: 3002, labels: 'api' });

        const connection = server.select('docs');
        connection.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

            //console.log(JSON.stringify(response.result.paths));
            expect(response.statusCode).to.equal(200);
            expect(response.result.paths['/plugin1']).to.equal({
                'get': {
                    'tags': [
                        'plugin1'
                    ],
                    'responses': {
                        'default': {
                            'schema': {
                                'type': 'string'
                            },
                            'description': 'Successful'
                        }
                    },
                    'operationId': 'getPlugin1',
                    'summary': 'plugin1'
                }
            });
            done();
        });

    });

});
