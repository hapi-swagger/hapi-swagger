'use strict';
const Code = require('code');
const Lab = require('lab');
const Helper = require('../test/helper.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();



lab.experiment('info', () => {

    const routes = [{
        method: 'GET',
        path: '/test',
        handler: Helper.defaultHandler,
        config: {
            tags: ['api']
        }
    }];


    lab.test('no info object passed', (done) => {

        Helper.createServer({}, routes, (err, server) => {

            expect(err).to.equal(null);
            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.result.info).to.deep.equal({ 'title': 'API documentation' });
                done();
            });
        });
    });


    lab.test('no info title property passed', (done) => {

        const swaggerOptions = {
            info: {}
        };

        Helper.createServer(swaggerOptions, routes, (err, server) => {

            expect(err).to.equal(null);
            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.result.info).to.deep.equal({ 'title': 'API documentation' });
                done();
            });
        });
    });



    lab.test('min valid info object', (done) => {

        const swaggerOptions = {
            info: { title: 'test title for lab' }
        };

        Helper.createServer(swaggerOptions, routes, (err, server) => {

            expect(err).to.equal(null);
            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.result.info).to.deep.equal(swaggerOptions.info);
                done();
            });
        });
    });


    lab.test('full info object', (done) => {

        const swaggerOptions = {
            info: {
                'title': 'Swagger Petstore',
                'description': 'This is a sample server Petstore server.',
                'version': '1.0.0',
                'termsOfService': 'http://swagger.io/terms/',
                'contact': {
                    'email': 'apiteam@swagger.io'
                },
                'license': {
                    'name': 'Apache 2.0',
                    'url': 'http://www.apache.org/licenses/LICENSE-2.0.html'
                }
            }
        };

        Helper.createServer(swaggerOptions, routes, (err, server) => {

            expect(err).to.equal(null);
            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.result.info).to.deep.equal(swaggerOptions.info);
                done();
            });
        });
    });

});
