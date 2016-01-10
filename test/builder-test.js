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


    lab.test('defaults for swagger root object properties', (done) => {

        Helper.createServer({}, routes, (err, server) => {

            expect(err).to.equal(null);
            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.result.swagger).to.equal('2.0');
                expect(response.result.schemes).to.deep.equal(['http']);
                expect(response.result.basePath).to.equal('/');
                expect(response.result.consumes).to.not.exist();
                expect(response.result.produces).to.not.exist();
                done();
            });

        });
    });


    lab.test('set values for swagger root object properties', (done) => {

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

        Helper.createServer(swaggerOptions, routes, (err, server) => {

            expect(err).to.equal(null);
            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(response.statusCode).to.equal(200);
                //console.log(JSON.stringify(response.result))
                expect(response.result.swagger).to.equal('2.0');
                expect(response.result.schemes).to.deep.equal(['https']);
                expect(response.result.basePath).to.equal('/base');
                expect(response.result.consumes).to.deep.equal(['application/x-www-form-urlencoded']);
                expect(response.result.produces).to.deep.equal(['application/json', 'application/xml']);
                expect(response.result.externalDocs).to.deep.equal(swaggerOptions.externalDocs);
                done();
            });

        });
    });


});



