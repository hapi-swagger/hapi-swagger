const Code = require('code');
const Joi = require('joi');
const Lab = require('lab');
const Helper = require('../helper.js');
const Validate = require('../../lib/validate.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();


lab.experiment('security', () => {


    // example from http://petstore.swagger.io/v2/swagger.json
    const swaggerOptions = {
        'securityDefinitions': {
            'petstore_auth': {
                'type': 'oauth2',
                'authorizationUrl': 'http://petstore.swagger.io/api/oauth/dialog',
                'flow': 'implicit',
                'scopes': {
                    'write:pets': 'modify pets in your account',
                    'read:pets': 'read your pets'
                }
            },
            'api_key': {
                'type': 'apiKey',
                'name': 'api_key',
                'in': 'header',
                'x-keyPrefix': 'Bearer '
            }
        },
        'security': [{ 'api_key': [] }]
    };



    // route with examples of security objects from http://petstore.swagger.io/v2/swagger.json
    const routes = [{
        method: 'POST',
        path: '/bookmarks/1/',
        options: {
            handler: Helper.defaultHandler,
            plugins: {
                'hapi-swagger': {
                    'payloadType': 'form',
                    'security': [{ 'api_key': [] }]
                }
            },
            tags: ['api'],
            validate: {
                payload: {
                    url: Joi.string()
                        .required()
                        .description('the url to bookmark')
                }
            }
        }
    }, {
        method: 'POST',
        path: '/bookmarks/2/',
        options: {
            handler: Helper.defaultHandler,
            plugins: {
                'hapi-swagger': {
                    'payloadType': 'form',
                    'security': [
                        {
                            'petstore_auth': [
                                'write:pets',
                                'read:pets'
                            ]
                        }
                    ]
                }
            },
            tags: ['api'],
            validate: {
                payload: {
                    url: Joi.string()
                        .required()
                        .description('the url to bookmark')
                }
            }
        }
    }];



    lab.test('passes through securityDefinitions', async() => {

        const requestOptions = {
            method: 'GET',
            url: '/swagger.json',
            headers: {
                authorization: 'Bearer 12345'
            }
        };

        const server = await Helper.createServer(swaggerOptions, routes);
        const response  = await server.inject(requestOptions);
        expect(response.result.securityDefinitions).to.equal(swaggerOptions.securityDefinitions);
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });


    lab.test('passes through security objects for whole api', async() => {

        const requestOptions = {
            method: 'GET',
            url: '/swagger.json'
        };

        // plugin routes should be not be affected by auth on API
        const server = await Helper.createServer(swaggerOptions, routes);
        const response = await server.inject(requestOptions);
        expect(response.result.security).to.equal(swaggerOptions.security);
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });


    lab.test('passes through security objects on routes', async() => {

        const requestOptions = {
            method: 'GET',
            url: '/swagger.json'
        };

        // plugin routes should be not be affected by auth on API
        const server = await Helper.createServer(swaggerOptions, routes);
        const response = await server.inject(requestOptions);
        expect(response.result.paths['/bookmarks/1/'].post.security).to.equal([
            {
                'api_key': []
            }
        ]);
        expect(response.result.paths['/bookmarks/2/'].post.security).to.equal([
            {
                'petstore_auth': [
                    'write:pets',
                    'read:pets'
                ]
            }
        ]);
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });


    // lab.test('passes through x-keyPrefix', async() => {

    //     const prefixBearerOptions = {
    //         debug: true,
    //         securityDefinitions: {
    //             'Bearer': {
    //                 'type': 'apiKey',
    //                 'name': 'Authorization',
    //                 'in': 'header',
    //                 'x-keyPrefix': 'Bearer '
    //             }
    //         },
    //         security: [{ 'Bearer': [] }]
    //     };

    //     const requestOptions = {
    //         method: 'GET',
    //         url: '/documentation/debug'
    //     };

    //     // plugin routes should be not be affected by auth on API
    //     const server = await Helper.createServer(prefixBearerOptions, routes);
    //     const response = await server.inject(requestOptions);
    //     expect(JSON.parse(response.result).keyPrefix).to.equal('Bearer ');
    // });


    // lab.test('no keyPrefix', async() => {

    //     const prefixOauth2Options = {
    //         debug: true,
    //         securityDefinitions: {
    //             'Oauth2': {
    //                 'type': 'oauth2',
    //                 'authorizationUrl': 'http://petstore.swagger.io/api/oauth/dialog',
    //                 'flow': 'implicit',
    //                 'scopes': {
    //                     'write:pets': 'modify pets in your account',
    //                     'read:pets': 'read your pets'
    //                 }
    //             }
    //         },
    //         security: [{ 'Oauth2': [] }]
    //     };

    //     const requestOptions = {
    //         method: 'GET',
    //         url: '/documentation/debug'
    //     };

    //     // plugin routes should be not be affected by auth on API
    //     const server = await Helper.createServer(prefixOauth2Options, routes);
    //     const response = await server.inject(requestOptions);
    //     expect(JSON.parse(response.result).keyPrefix).to.equal(undefined);

    // });

});






