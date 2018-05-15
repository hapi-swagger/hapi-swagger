// `upload-file.js` - how create documenation for a file upload
// the file `example/assets/test-upload.json` has data in the correct format for this example

const Hapi = require('hapi');
const Blipp = require('blipp');
const Inert = require('inert');
const Vision = require('vision');
const Boom = require('boom');
const Joi = require('joi');

const HapiSwagger = require('../');


const storeFile = async function(request, h) {

    const payload = request.payload;

    // check that required file is present
    // the filepath property incorrectlty uses a string 'undefined'
    if (payload.file) {
        const file = payload.file;
        const headers = file.hapi.headers;

        // check the content-type is json
        if (headers['content-type'] === 'application/json') {

            try {
                let data = await streamToPromise(file);

                // use Joi to validate file data format
                const addSumSchema = Joi.object().keys({
                    a: Joi.number().required(),
                    b: Joi.number().required(),
                    operator: Joi.string().required(),
                    equals: Joi.number().required()
                });

                await Joi.validate(data, addSumSchema);
                return h.response(data);

            }
            catch(err){
                return Boom.badRequest(err.message);
            }

        } else {
            return Boom.unsupportedMediaType();
        }
    } else {
        return Boom.badRequest('File is required');
    }

};



function streamToPromise(stream) {

    return new Promise(function (resolve, reject) {
        let data = '';
        stream.on('data', chunk => {
            data += chunk;
        });
        stream.on('end', () => {
            resolve(data);
        });
        stream.on('error', (err) => {
            reject(err);
        });
    });
}


const swaggerOptions = {};

const routes = [
    {
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
    }
];


const ser = async () => {

    try {

        const server = Hapi.Server({
            host: 'localhost',
            port: 3000
        });

        // Blipp and Good - Needs updating for Hapi v17.x
        await server.register([
            Inert,
            Vision,
            Blipp,
            {
                plugin: HapiSwagger,
                options: swaggerOptions
            }
        ]);

        server.route(routes);

        // add templates only for testing custom.html
        server.views({
            path: 'bin',
            engines: { html: require('handlebars') },
            isCached: false
        });


        await server.start();
        return server;

    } catch (err) {
        throw err;
    }

};


ser()
    .then((server) => {

        console.log(`Server listening on ${server.info.uri}`);
    })
    .catch((err) => {

        console.error(err);
        process.exit(1);
    });

