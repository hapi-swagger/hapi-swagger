'use strict';
var BearerToken = require('hapi-auth-bearer-token'),
    H2o2 = require('h2o2'),
    Hapi = require('hapi'),
    Inert = require('inert'),
    Vision = require('vision'),
    Wreck = require('wreck');

var HapiSwagger = require('../lib/index.js');

var helper = module.exports = {};


/**
* creates a Hapi server
*
* @param  {Object} swaggerOptions
* @param  {Object} routes
* @param  {Function} callback
*/
helper.createServer = function (swaggerOptions, routes, callback) {

    var err = null,
        server = new Hapi.Server();

    server.connection();

    server.register([
        Inert,
        Vision,
        H2o2,
        {
            register: HapiSwagger,
            options: swaggerOptions
        }
    ], function (err) {

        server.route(routes);
        server.start(function (err) {

            if (err) {
                callback(err, null);
            }
        });
    });

    callback(err, server);
};


/**
* creates a Hapi server using bearer token auth
*
* @param  {Object} swaggerOptions
* @param  {Object} routes
* @param  {Function} callback
*/
helper.createAuthServer = function (swaggerOptions, routes, callback) {

    var err = null,
        server = new Hapi.Server();

    server.connection();

    server.register([
        Inert,
        Vision,
        H2o2,
        BearerToken,
        {
            register: HapiSwagger,
            options: swaggerOptions
        }
    ], function (err) {

        server.auth.strategy('bearer', 'bearer-access-token', {
            'accessTokenName': 'access_token',
            'validateFunc': helper.validateBearer
        });
        server.route(routes);
        server.start(function (err) {

            if (err) {
                callback(err, null);
            }
        });
    });

    callback(err, server);
};


/**
* a handler function used to mock a response
*
* @param  {Object} request
* @param  {Object} reply
*/
helper.defaultHandler = function (request, reply) {

    reply('ok');
};


/**
* a handler function used to mock a response to a authorized request
*
* @param  {Object} request
* @param  {Object} reply
*/
helper.defaultAuthHandler = function (request, reply) {

    if (request.auth && request.auth.credentials && request.auth.credentials.user) {
        reply(request.auth.credentials.user);
    } else {
        reply(Boom.unauthorized(['unauthorized access'], [request.auth.strategy]));
    }
};


/**
* a validation function for bearer strategy
*
* @param  {String} token
* @param  {Function} callback
*/
helper.validateBearer = function (token, callback) {

    if (token === '12345') {
        callback(null, true, {
            'token': token,
            'user': {
                'username': 'glennjones',
                'name': 'Glenn Jones',
                'groups': ['admin', 'user']
            }
        });
    } else {
        // for bad token keep err as null just return false
        callback(null, false, {});
    }
};


/**
* fires a HAPI reply with json payload - see h2o2 onResponse function signature
*
* @param  {Object} err
* @param  {Object} res
* @param  {Object} request
* @param  {Object} reply
* @param  {Object} settings
* @param  {Int} ttl
*/
helper.replyWithJSON  = function (err, res, request, reply, settings, ttl) {

    Wreck.read(res, { json: true }, function (err, payload) {

        reply(payload);
    });
};



/**
* creates an object with properties which are not its own
*
 * @return {Object}
*/
helper.objWithNoOwnProperty = function () {

    var sides = { a: 1, b: 2, c: 3 };
    var Triangle = function () {

    };
    Triangle.prototype = sides;
    return new Triangle();
};
