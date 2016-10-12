'use strict';

// `jwt.js` - how to used in combination with JSON Web Tokens (JWT) `securityDefinition`

var Hapi = require('hapi');
const Joi = require('joi');
const Basic = require('hapi-auth-basic');
const Blipp = require('blipp');
const Inert = require('inert');
const Vision = require('vision');


const HapiSwagger = require('../');


let swaggerOptions = {
    info: {
        'title': 'Test API Documentation',
        'description': 'This is a sample example of API documentation.'
    },
    auth: 'simple'
};

const users = {
    jane: {
        username: 'jane',
        password: 'password',   // in real world store Bcrypt 'secret' here
        name: 'Jane Jones',
        id: '2133d32a'
    }
};


// bring your own validation function
var validate = function (request, username, password, callback) {

    const user = users[username];
    if (!user) {
        return callback(null, false);
    }
    const isValid = (password === user.password);
    callback(null, isValid, { id: user.id, name: user.name });
};



var server = new Hapi.Server();
server.connection({
    host: 'localhost',
    port: 3000
});


server.register([
    Basic
], function (err) {

    if (err) {
        console.log(err);
    }

    server.auth.strategy('simple', 'basic', { validateFunc: validate });

    server.register([
        Inert,
        Vision,
        Blipp,
        {
            register: HapiSwagger,
            options: swaggerOptions
        }
    ], function (err) {

        if (err) {
            console.log(err);
        }

        server.route({
            method: 'PUT',
            path: '/v1/store/{id?}',
            config: {
                handler: function () { },
                description: 'Update sum',
                notes: ['Update a sum in our data store'],
                plugins: {
                    'hapi-swagger': {
                        payloadType: 'form'
                    }
                },
                tags: ['api'],
                validate: {
                    params: {
                        id: Joi.string()
                            .required()
                            .description('the id of the sum in the store')
                    },
                    payload: {
                        a: Joi.number()
                            .required()
                            .description('the first number'),

                        b: Joi.number()
                            .required()
                            .description('the second number'),

                        operator: Joi.string()
                            .required()
                            .default('+')
                            .valid(['+', '-', '/', '*'])
                            .description('the opertator i.e. + - / or *'),

                        equals: Joi.number()
                            .required()
                            .description('the result of the sum')
                    }
                }
            }
        });
    });

});





server.start(function () {

    console.log('Server running at:', server.info.uri);
});
