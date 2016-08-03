'use strict';

// `upload-file.js` - how create documenation for a file upload
// the file `example/assets/test-upload.json` has data in the correct format for this example

const Hapi = require('hapi');
const Blipp = require('blipp');
const Inert = require('inert');
const Vision = require('vision');
const Boom = require('boom');
const Joi = require('joi');

const HapiSwagger = require('../');


let server = new Hapi.Server();
server.connection({
    host: 'localhost',
    port: 3000
});



const storeFile = function (request, reply) {

    const payload = request.payload;
    let data = '';

    // check that required file is present
    // the filepath property incorrectlty uses a string 'undefined'
    if (payload.file) {

        const file = payload.file;
        const headers = file.hapi.headers;

        // check the content-type is json
        if (headers['content-type'] === 'application/json') {

            // read the stream into memory
            file.on('data', (chunk) => {
                data += chunk;
            });

            // once we have all the data
            file.on('end', () => {

                // use Joi to validate file data format
                const addSumSchema = Joi.object().keys({
                    a: Joi.number().required(),
                    b: Joi.number().required(),
                    operator: Joi.string().required(),
                    equals: Joi.number().required()
                });

                Joi.validate(data, addSumSchema, (err) => {

                    if (err) {
                        reply(Boom.badRequest('JSON file has incorrect format or properties. ' + err));
                    } else {
                        // do something with JSON.parse(data)
                        console.log('File uploaded correctly');
                        reply(data);
                    }
                });
            });

        } else {
            reply(Boom.unsupportedMediaType());
        }

    } else {
        reply(Boom.badRequest('File is required'));
    }
};




const swaggerOptions = {};

const routes = [{
    method: 'POST',
    path: '/store/file/',
    config: {
        handler: storeFile,
        plugins: {
            'hapi-swagger': {
                payloadType: 'form'
            }
        },
        tags: ['api'],
        validate: {
            payload: {
                file: Joi.any()
                    .meta({ swaggerType: 'file' })
                    .description('json file')
            }
        },
        payload: {
            maxBytes: 1048576,
            parse: true,
            output: 'stream'
        }
    }
}];


server.register([
    Inert,
    Vision,
    Blipp,
    {
        register: HapiSwagger,
        options: swaggerOptions
    }], (err) => {

    if (err) {
        console.log(err);
    }

    server.route(routes);

    server.start((startErr) => {
        if (startErr) {
            console.log(startErr);
        } else {
            console.log('Server running at:', server.info.uri);
        }
    });
});


// add templates only for testing custom.html
server.views({
    path: 'bin',
    engines: { html: require('handlebars') },
    isCached: false
});
