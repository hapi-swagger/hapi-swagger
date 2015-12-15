'use strict';
const Code = require('code');
const Hoek = require('hoek');
const Lab = require('lab');
const Helper = require('../test/helper.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();



lab.experiment('path', () => {

    let routes = {
        method: 'GET',
        path: '/test',
        handler: Helper.defaultHandler,
        config: {
            tags: ['api']
        }
    };


    lab.test('notes', (done) => {

        let testRoutes = Hoek.clone(routes);
        testRoutes.config.notes = ['single item'];
        Helper.createServer({}, testRoutes, (err, server) => {

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/test'].get.description).to.equal('single item');
                done();
            });
        });
    });


    lab.test('notes as an array', (done) => {

        let testRoutes = Hoek.clone(routes);
        testRoutes.config.notes = ['note one', 'note two'];
        Helper.createServer({}, testRoutes, (err, server) => {

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/test'].get.description).to.equal('note one<br/><br/>note two');
                done();
            });
        });
    });

});
