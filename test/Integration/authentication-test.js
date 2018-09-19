const Code = require('code');
const Joi = require('joi');
const Lab = require('lab');
const Helper = require('../helper.js');
const Validate = require('../../lib/validate.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();

lab.experiment('default `auth` settings', () => {
    const routes = [
        {
            method: 'GET',
            path: '/',
            options: {
                auth: false,
                handler: () => {
                    return { text: 'Token not required' };
                }
            }
        }, {
            method: 'GET',
            path: '/restricted',
            options: {
                auth: 'jwt',
                tags: ['api'],
                plugins: {
                    'hapi-swagger': {
                        security: [{ 'jwt': [] }]
                    }
                },
                handler: function (request, h) {
                    h.response({ text: `You used a Token! ${request.auth.credentials.name}`})
                        .header('Authorization', request.headers.authorization);
                }
            }
        }
    ];


    lab.test('get documentation page should not be restricted', async() => {

        const requestOptions = {
            method: 'GET',
            url: '/documentation'
        };

        const server = await Helper.createJWTAuthServer({}, routes);
        const response = await server.inject(requestOptions);
        expect(response.statusCode).to.equal(200);
    });


    lab.test('get documentation page should be restricted 401', async() => {

        const requestOptions = {
            method: 'GET',
            url: '/documentation'
        };

        const server = await Helper.createJWTAuthServer({ auth: undefined }, routes);
        const response = await server.inject(requestOptions);
        expect(response.statusCode).to.equal(401);
    });


});



lab.experiment('authentication', () => {

    // route using bearer token auth
    const routes = {
        method: 'POST',
        path: '/bookmarks/',
        options: {
            handler: Helper.defaultAuthHandler,
            plugins: {
                'hapi-swagger': {
                    payloadType: 'form'
                }
            },
            tags: ['api'],
            auth: 'bearer',
            validate: {
                headers: Joi.object({
                    authorization: Joi.string()
                        .default('Bearer 12345')
                        .description('bearer token')
                }).unknown(),

                payload: {
                    url: Joi.string()
                        .required()
                        .description('the url to bookmark')
                }
            }
        }
    };


    lab.test('get plug-in interface with bearer token', async() => {

        const requestOptions = {
            method: 'GET',
            url: '/swagger.json',
            headers: {
                authorization: 'Bearer 12345'
            }
        };

        const server = await Helper.createAuthServer({}, routes);
        const response = await server.inject(requestOptions);

        expect(response.statusCode).to.equal(200);
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });


    lab.test('get plug-in interface without bearer token', async() => {

        const requestOptions = {
            method: 'GET',
            url: '/swagger.json'
        };

        // plugin routes should be not be affected by auth on API
        const server = await Helper.createAuthServer({}, routes);
        const response = await server.inject(requestOptions);
        expect(response.statusCode).to.equal(200);
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });


    lab.test('get API interface with bearer token', async() => {

        const requestOptions = {
            method: 'POST',
            url: '/bookmarks/',
            headers: {
                authorization: 'Bearer 12345'
            },
            payload: {
                url: 'http://glennjones.net'
            }
        };

        const server = await Helper.createAuthServer({}, routes);
        const response = await server.inject(requestOptions);
        expect(response.statusCode).to.equal(200);

    });


    lab.test('get API interface with incorrect bearer token', async() => {

        const requestOptions = {
            method: 'POST',
            url: '/bookmarks/',
            headers: {
                authorization: 'Bearer XXXXXX'
            },
            payload: {
                url: 'http://glennjones.net'
            }
        };

        const server = await Helper.createAuthServer({}, routes);
        const response = await server.inject(requestOptions);
        expect(response.statusCode).to.equal(401);

    });


});
