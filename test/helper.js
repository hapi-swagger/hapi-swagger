const BearerToken = require('hapi-auth-bearer-token');
const H2o2 = require('h2o2');
const Hapi = require('hapi');
const Boom = require('boom');
const Inert = require('inert');
const Vision = require('vision');
const Wreck = require('wreck');
const JWT = require('jsonwebtoken');
const HapiSwagger = require('../lib/index.js');
const Validate = require('../lib/validate.js');

const helper = module.exports = {};

/**
* creates a Hapi server
*
* @param  {Object} swaggerOptions
* @param  {Object} routes
* @param  {Function} callback
*/
helper.createServer = async (swaggerOptions, routes, serverOptions = {}) => {
    const server = new Hapi.Server(serverOptions);

    try {
        await server.register([
            Inert,
            Vision,
            // H2o2,
            {
                plugin: HapiSwagger,
                options: swaggerOptions
            }
        ]);

        if (routes) {
            server.route(routes);
        }

        await server.start();
        return server;
    } catch (e) {
        throw e;
    }

};

/**
* creates a Hapi server using bearer token auth
*
* @param  {Object} swaggerOptions
* @param  {Object} routes
* @param  {Function} callback
*/
helper.createAuthServer = async (serverOptions = {}, swaggerOptions, routes, callback) => {

    const server = new Hapi.Server(serverOptions);

    try {
        await server.register([
            Inert,
            Vision,
            H2o2,
            BearerToken,
            {
                plugin: HapiSwagger,
                options: swaggerOptions
            }
        ]);

        server.auth.strategy('bearer', 'bearer-access-token', {
            'accessTokenName': 'access_token',
            'validateFunc': helper.validateBearer
        });
        server.route(routes);

        await server.start();
    } catch (e) {
        console.error(e);
    }
};


/**
* creates a Hapi server using JWT auth
*
* @param  {Object} swaggerOptions
* @param  {Object} routes
* @param  {Function} callback
*/
helper.createJWTAuthServer = (swaggerOptions, routes, callback) => {

    let people = {
        56732: {
            id: 56732,
            name: 'Jen Jones',
            scope: ['a', 'b']
        }
    };
    const privateKey = 'hapi hapi joi joi';
    const token = JWT.sign({ id: 56732 }, privateKey, { algorithm: 'HS256' });
    const validateJWT = (decoded, request, next) => {

        if (!people[decoded.id]) {
            return next(null, false);
        }
        return next(null, true, people[decoded.id]);
    };


    const server = new Hapi.Server();

    server.connection();

    server.register([
        Inert,
        Vision,
        require('hapi-auth-jwt2'),
        {
            register: HapiSwagger,
            options: swaggerOptions
        }
    ], (err) => {

        if (err) {
            return callback(err, null);
        }

        server.auth.strategy('jwt', 'jwt', {
            key: privateKey,
            validateFunc: validateJWT,
            verifyOptions: { algorithms: ['HS256'] }
        });

        server.auth.default('jwt');

        server.route(routes);
        server.start(err => {

            if (err) {
                callback(err, null);
            } else {
                callback(null, server);
            }

        });
    });


};



/**
* creates a Hapi server using promises
*
* @param  {Object} swaggerOptions
* @param  {Object} routes
* @param  {Function} callback
*/
helper.createServerWithPromises = (swaggerOptions, routes, callback) => {

    const server = new Hapi.Server();

    // start server using promises
    registerPlugins(server, swaggerOptions)
        .then( (msg) => {
            console.log(msg);
            return startServer(server, routes);
        })
        .then( (msg) => {
            console.log(msg);
            console.log('Server running at:', server.info.uri);
            return registerViews(server);
        })
        .then( (msg) => {
            console.log(msg);
            callback(null, server);
        })
        .catch( (err) => {
            console.log(err);
            callback(err, null);
        });
};


/**
* a registers plugins using a promise
*
* @return {Object}
*/
const registerPlugins = (server, swaggerOptions) => new Promise((resolve, reject) =>
    server.register([
        Inert,
        Vision,
        H2o2,
        {
            register: HapiSwagger,
            options: swaggerOptions
        }
    ], (err) => {
        (err)
            ? reject('Failed to configure main plugin group: ${err}')
            : resolve('Main plugin group setup');
    }
    ));

const registerViews = server => new Promise((resolve) => {

    server.views({
        path: 'bin',
        engines: { html: require('handlebars') },
        isCached: false
    });
    resolve('Templates views setup');
});

/**
* starts server using a promise
*
* @return {Object}
*/
const startServer = (server, routes) => new Promise((resolve, reject) => {

    server.route(routes);
    server.start((err) => {
        (err)
            ? reject('Failed to start server: ${err}')
            : resolve('Started server');
    });
});


/**
* a handler function used to mock a response
*
* @param  {Object} request
* @param  {Object} reply
*/
helper.defaultHandler = (request, h) => {
    return 'ok';
};


/**
* a handler function used to mock a response to a authorized request
*
* @param  {Object} request
* @param  {Object} reply
*/
helper.defaultAuthHandler = (request, h) => {

    if (request.auth && request.auth.credentials && request.auth.credentials.user) {
        return request.auth.credentials.user;
    } else {
        return Boom.unauthorized(['unauthorized access'], [request.auth.strategy])
    }
};


/**
* a validation function for bearer strategy
*
* @param  {String} token
* @param  {Function} callback
*/
helper.validateBearer = (token, callback) => {

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
**/
helper.replyWithJSON  = (err, res, request, reply, settings, ttl) => {

    const { payload } = Wreck.read(res, { json: true });
    return payload;
};



/**
* creates an object with properties which are not its own
*
 * @return {Object}
*/
helper.objWithNoOwnProperty = () => {

    const  sides = { a: 1, b: 2, c: 3 };
    let Triangle = function() {

    };
    Triangle.prototype = sides;
    return new Triangle();
};
