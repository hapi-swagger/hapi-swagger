'use strict';
const Code = require('code');
const Joi = require('joi');
const Lab = require('lab');
const Helper = require('../test/helper.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();



lab.experiment('alternatives', () => {

    const routes = [{
        method: 'POST',
        path: '/store/',
        config: {
            handler: Helper.defaultHandler,
            tags: ['api'],
            validate: {
                payload: Joi.alternatives().try(Joi.number(), Joi.string()).label('Alt')
            }
        }
    }];


    lab.test('flatten with no references', (done) => {

        Helper.createServer({ derefJSONSchema: true }, routes, (err, server) => {

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/store/'].post.parameters).to.deep.equal([
                    {
                        'in': 'body',
                        'name': 'body',
                        'schema': {
                            'type': 'string'
                        }
                    }
                ]);
                done();
            });
        });
    });


});
