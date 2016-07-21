'use strict';
const Code = require('code');
const Lab = require('lab');
const Helper = require('../test/helper.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();


lab.experiment('validation', () => {

    let routes = {
        method: 'POST',
        path: '/test',
        handler: Helper.defaultHandler,
        config: {
            description: 'Add sum',
            notes: ['Adds a sum to the data store'],
            tags: ['api'],
            validate: {
                payload: function (value, options, next) {

                    console.log('testing');
                    next(null, value);
                },
                params: function (value, options, next) {

                    console.log('testing');
                    next(null, value);
                },
                query: function (value, options, next) {

                    console.log('testing');
                    next(null, value);
                },
                headers: function (value, options, next) {

                    console.log('testing');
                    next(null, value);
                }
            }
        }
    };


    lab.test('function not joi', (done) => {

        Helper.createServer({}, routes, (err, server) => {

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/test'].post.parameters).to.equal([
                    {
                        'schema': {
                            '$ref': '#/definitions/Hidden Model'
                        },
                        'name': 'body',
                        'in': 'body'
                    }
                ]);
                expect(response.result.definitions).to.equal({
                    'Hidden Model': {
                        'type': 'object'
                    }
                });
                done();
            });
        });
    });

});
