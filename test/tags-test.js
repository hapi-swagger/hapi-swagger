'use strict';
const Code = require('code');
const Lab = require('lab');
const Helper = require('../test/helper.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();



lab.experiment('tags', () => {

    const routes = [{
        method: 'GET',
        path: '/test',
        handler: Helper.defaultHandler,
        config: {
            tags: ['api']
        }
    }];


    lab.test('no tag objects passed', (done) => {

        Helper.createServer({}, routes, (err, server) => {

            expect(err).to.equal(null);
            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.result.tags).to.deep.equal([]);
                done();
            });
        });
    });


    lab.test('name property passed', (done) => {

        const swaggerOptions = {
            tags: [{
                'name': 'test'
            }]
        };

        Helper.createServer(swaggerOptions, routes, (err, server) => {

            expect(err).to.equal(null);
            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.result.tags[0].name).to.equal('test');
                done();
            });
        });
    });


    lab.test('full tag object', (done) => {

        const swaggerOptions = {
            tags: [{
                'name': 'test',
                'description': 'Everything about test',
                'externalDocs': {
                    'description': 'Find out more',
                    'url': 'http://swagger.io'
                }
            }]
        };

        Helper.createServer(swaggerOptions, routes, (err, server) => {

            expect(err).to.equal(null);
            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.result.tags).to.deep.equal(swaggerOptions.tags);
                done();
            });
        });
    });

});
