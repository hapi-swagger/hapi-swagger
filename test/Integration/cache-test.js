const Code = require('code');
const Joi = require('joi');
const Lab = require('lab');

const Helper = require('../helper.js');
const Validate = require('../../lib/validate.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();



lab.experiment('plugin', () => {

    const routes = [{
        method: 'POST',
        path: '/store/',
        options: {
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



    lab.test('basic cache', async() => {

        let swaggerOptions = {
            'cache': {
                'expiresIn': 24 * 60 * 60 * 1000
            }
        };

        const server = await Helper.createServer(swaggerOptions, routes);
        await server.inject({ method: 'GET', url: '/swagger.json' });

        // double call to test code paths as cache works
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();


    });


    lab.test('cache with generateTimeout', async() => {

        let swaggerOptions = {
            cache: {
                expiresIn: 24 * 60 * 60 * 1000,
                generateTimeout: 30 * 1000
            }
        };

        const server = await Helper.createServer(swaggerOptions, routes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });


        expect(response.statusCode).to.equal(200);
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });


    lab.test('model cache using weakmap', async() => {

        // test if a joi object weakmap cache
        // the Joi object should only be parsed once

        let joiObj = Joi.object({
            a: Joi.number(),
            b: Joi.number(),
            operator: Joi.string(),
            equals: Joi.number()
        });

        const tempRoutes = [{
            method: 'POST',
            path: '/store1/',
            options: {
                handler: Helper.defaultHandler,
                tags: ['api'],
                validate: {
                    payload: joiObj
                }
            }
        },{
            method: 'POST',
            path: '/store2/',
            options: {
                handler: Helper.defaultHandler,
                tags: ['api'],
                validate: {
                    payload: joiObj
                }
            }
        }];

        const server = await Helper.createServer({}, tempRoutes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });

        expect(response.statusCode).to.equal(200);
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });


});
