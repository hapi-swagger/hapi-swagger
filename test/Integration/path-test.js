const Code = require('code');
const Joi = require('joi');
const Hoek = require('hoek');
const Lab = require('lab');
const Helper = require('../helper.js');
const Validate = require('../../lib/validate.js');

const expect = Code.expect;
const lab = (exports.lab = Lab.script());

lab.experiment('path', () => {
    let routes = {
        method: 'POST',
        path: '/test',
        handler: Helper.defaultHandler,
        options: {
            description: 'Add sum',
            notes: ['Adds a sum to the data store'],
            tags: ['api'],
            validate: {
                payload: {
                    a: Joi.number()
                        .required()
                        .description('the first number')
                        .default(10),

                    b: Joi.number().required().description('the second number'),

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
    };

    lab.test('summary and description', async() => {
        const server = await Helper.createServer({}, routes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
        expect(response.result.paths['/test'].post.summary).to.equal(
            'Add sum'
        );
        expect(
            response.result.paths['/test'].post.description
        ).to.equal('Adds a sum to the data store');
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();
    });

    lab.test('description as an array', async() => {
        let testRoutes = Hoek.clone(routes);
        testRoutes.options.notes = ['note one', 'note two'];
        const server = await Helper.createServer({}, testRoutes);
        const response =  await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
        expect(
            response.result.paths['/test'].post.description
        ).to.equal('note one<br/><br/>note two');
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });

    lab.test('route settting of consumes produces', async() => {
        let testRoutes = Hoek.clone(routes);
        testRoutes.options.plugins = {
            'hapi-swagger': {
                consumes: ['application/x-www-form-urlencoded'],
                produces: ['application/json', 'application/xml']
            }
        };

        const server = await Helper.createServer({}, testRoutes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
        expect(response.result.paths['/test'].post.consumes).to.equal([
            'application/x-www-form-urlencoded'
        ]);
        expect(response.result.paths['/test'].post.produces).to.equal([
            'application/json',
            'application/xml'
        ]);
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();
    });

    lab.test('override plug-in settting of consumes produces', async() => {
        let swaggerOptions = {
            consumes: ['application/json'],
            produces: ['application/json']
        };

        let testRoutes = Hoek.clone(routes);
        testRoutes.options.plugins = {
            'hapi-swagger': {
                consumes: ['application/x-www-form-urlencoded'],
                produces: ['application/json', 'application/xml']
            }
        };

        const server = await Helper.createServer(swaggerOptions, testRoutes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
        expect(response.result.paths['/test'].post.consumes).to.equal([
            'application/x-www-form-urlencoded'
        ]);
        expect(response.result.paths['/test'].post.produces).to.equal([
            'application/json',
            'application/xml'
        ]);
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });

    lab.test('auto "x-www-form-urlencoded" consumes with payloadType', async() => {
        let testRoutes = Hoek.clone(routes);
        testRoutes.options.plugins = {
            'hapi-swagger': {
                payloadType: 'form'
            }
        };

        const server = await Helper.createServer({}, testRoutes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
        expect(response.result.paths['/test'].post.consumes).to.equal([
            'application/x-www-form-urlencoded'
        ]);
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();
    });

    lab.test('rename a parameter', async() => {
        let testRoutes = Hoek.clone(routes);
        testRoutes.options.plugins = {
            'hapi-swagger': {
                payloadType: 'form'
            }
        };
        testRoutes.options.validate.payload = Joi.object({
            a: Joi.string().label('foo')
        });

        const server = await Helper.createServer({}, testRoutes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
        expect(
            response.result.paths['/test'].post.parameters
        ).to.equal([
            {
                type: 'string',
                name: 'a',
                in: 'formData'
            }
        ]);
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });

    lab.test(
        'auto "multipart/form-data" consumes with { swaggerType: "file" }',
        async() => {
            let testRoutes = Hoek.clone(routes);
            testRoutes.options.validate = {
                payload: {
                    file: Joi.any()
                        .meta({ swaggerType: 'file' })
                        .description('json file')
                }
            };
            const server = await Helper.createServer({}, testRoutes);
            const response = await server.inject({ method: 'GET', url: '/swagger.json' });
            expect(response.statusCode).to.equal(200);
            expect(
                response.result.paths['/test'].post.consumes
            ).to.equal(['multipart/form-data']);
        }
    );

    lab.test('auto "multipart/form-data" do not add two', async() => {
        let testRoutes = Hoek.clone(routes);
        testRoutes.options.validate = {
            payload: {
                file: Joi.any()
                    .meta({ swaggerType: 'file' })
                    .description('json file')
            }
        };

        testRoutes.options.plugins = {
            'hapi-swagger': {
                consumes: ['multipart/form-data']
            }
        };

        const server = await Helper.createServer({}, testRoutes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
        expect(response.result.paths['/test'].post.consumes).to.equal([
            'multipart/form-data'
        ]);
    });

    lab.test('auto "application/x-www-form-urlencoded" do not add two', async() => {
        let testRoutes = Hoek.clone(routes);

        testRoutes.options.validate = {
            payload: {
                file: Joi.string().description('json file')
            }
        },

        testRoutes.options.plugins = {
            'hapi-swagger': {
                consumes: ['application/x-www-form-urlencoded']
            }
        };

        const server = await Helper.createServer({}, testRoutes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
        expect(
            response.result.paths['/test'].post.consumes
        ).to.equal(['application/x-www-form-urlencoded']);
    });

    lab.test('a user set content-type header removes consumes', async() => {
        let consumes = [
            'application/json',
            'application/json;charset=UTF-8',
            'application/json; charset=UTF-8'
        ];
        let testRoutes = Hoek.clone(routes);
        testRoutes.options.validate.headers = Joi.object({
            'content-type': Joi.string().valid(consumes)
        }).unknown();

        const server = await Helper.createServer({}, testRoutes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
        expect(
            response.result.paths['/test'].post.consumes
        ).to.not.exist();
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });

    lab.test('payloadType form', async() => {
        let testRoutes = Hoek.clone(routes);
        testRoutes.options.plugins = {
            'hapi-swagger': {
                payloadType: 'form'
            }
        };

        const server = await Helper.createServer({}, testRoutes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
        expect(response.result.paths['/test'].post.consumes).to.equal([
            'application/x-www-form-urlencoded'
        ]);
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();
    });

    lab.test('accept header', async() => {
        let testRoutes = Hoek.clone(routes);
        testRoutes.options.validate.headers = Joi.object({
            accept: Joi.string()
                .required()
                .valid(['application/json', 'application/vnd.api+json'])
        }).unknown();

        const server = await Helper.createServer({}, testRoutes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
        expect(response.result.paths['/test'].post.produces).to.equal([
            'application/json',
            'application/vnd.api+json'
        ]);
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });

    lab.test('accept header - no emum', async() => {
        let testRoutes = Hoek.clone(routes);
        testRoutes.options.validate.headers = Joi.object({
            accept: Joi.string().required().default('application/vnd.api+json')
        }).unknown();

        const server = await Helper.createServer({}, testRoutes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });

        expect(response.statusCode).to.equal(200);
        expect(
            response.result.paths['/test'].post.parameters[0]
        ).to.equal({
            required: true,
            default: 'application/vnd.api+json',
            in: 'header',
            name: 'accept',
            type: 'string'
        });
        expect(
            response.result.paths['/test'].post.produces
        ).to.not.exist();
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });

    lab.test('accept header - default first', async() => {
        let testRoutes = Hoek.clone(routes);
        testRoutes.options.validate.headers = Joi.object({
            accept: Joi.string()
                .required()
                .valid(['application/json', 'application/vnd.api+json'])
                .default('application/vnd.api+json')
        }).unknown();

        const server = await Helper.createServer({}, testRoutes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
        expect(response.result.paths['/test'].post.produces).to.equal([
            'application/vnd.api+json',
            'application/json'
        ]);
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();
    });

    lab.test('accept header acceptToProduce set to false', async() => {
        let testRoutes = Hoek.clone(routes);
        testRoutes.options.validate.headers = Joi.object({
            accept: Joi.string()
                .required()
                .valid(['application/json', 'application/vnd.api+json'])
                .default('application/vnd.api+json')
        }).unknown();

        const server = await Helper.createServer({ acceptToProduce: false },testRoutes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
        expect(response.result.paths['/test'].post.parameters[0]).to.equal({
            enum: ['application/json', 'application/vnd.api+json'],
            required: true,
            default: 'application/vnd.api+json',
            in: 'header',
            name: 'accept',
            type: 'string'
        });
        expect(response.result.paths['/test'].post.produces).to.not.exist();
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });

    lab.test('path parameters {id}/{note?}', async() => {
        let testRoutes = Hoek.clone(routes);
        testRoutes.path = '/servers/{id}/{note?}';
        testRoutes.options.validate = {
            params: {
                id: Joi.number()
                    .integer()
                    .required()
                    .description('ID of server to delete'),
                note: Joi.string().description('Note..')
            }
        };

        const server = await Helper.createServer({}, testRoutes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
        expect(
            response.result.paths['/servers/{id}/{note}']
        ).to.exist();

    });

    lab.test('path parameters {a}/{b?} required overriden by JOI', async() => {
        let testRoutes = [
            {
                method: 'POST',
                path: '/server/1/{a}/{b?}',
                config: {
                    handler: Helper.defaultHandler,
                    tags: ['api'],
                    validate: {
                        params: {
                            a: Joi.number().required(),
                            b: Joi.string().required()
                        }
                    }
                }
            },
            {
                method: 'POST',
                path: '/server/2/{c}/{d?}',
                config: {
                    handler: Helper.defaultHandler,
                    tags: ['api'],
                    validate: {
                        params: {
                            c: Joi.number().optional(),
                            d: Joi.string().optional()
                        }
                    }
                }
            },
            {
                method: 'POST',
                path: '/server/3/{e}/{f?}',
                config: {
                    handler: Helper.defaultHandler,
                    tags: ['api'],
                    validate: {
                        params: {
                            e: Joi.number(),
                            f: Joi.string()
                        }
                    }
                }
            }
        ];

        const server = await Helper.createServer({}, testRoutes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });

        expect(response.statusCode).to.equal(200);
        expect(
            response.result.paths['/server/1/{a}/{b}'].post.parameters
        ).to.equal([
            {
                type: 'number',
                name: 'a',
                in: 'path',
                required: true
            },
            {
                type: 'string',
                name: 'b',
                in: 'path',
                required: true
            }
        ]);
        expect(
            response.result.paths['/server/2/{c}/{d}'].post.parameters
        ).to.equal([
            {
                type: 'number',
                in: 'path',
                name: 'c'
            },
            {
                type: 'string',
                in: 'path',
                name: 'd'
            }
        ]);
        expect(
            response.result.paths['/server/3/{e}/{f}'].post.parameters
        ).to.equal([
            {
                required: true,
                type: 'number',
                in: 'path',
                name: 'e'
            },
            {
                type: 'string',
                in: 'path',
                name: 'f'
            }
        ]);
    });

    lab.test('path and basePath', async() => {
        const testRoutes = Hoek.clone(routes);
        testRoutes.path = '/v3/servers/{id}';
        testRoutes.options.validate = {
            params: {
                id: Joi.number()
                    .integer()
                    .required()
                    .description('ID of server to delete')
            }
        };

        const server = await Helper.createServer({ basePath: '/v3' }, testRoutes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
        expect(response.result.paths['/servers/{id}']).to.exist();
    });

    lab.test('basePath trim tailing slash', async() => {
        let testRoutes = Hoek.clone(routes);
        testRoutes.path = '/v3/servers/{id}';
        testRoutes.options.validate = {
            params: {
                id: Joi.number()
                    .integer()
                    .required()
                    .description('ID of server to delete')
            }
        };

        const server = await Helper.createServer({ basePath: '/v3/' }, testRoutes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
        expect(response.result.paths['/servers/{id}']).to.exist();

    });

    lab.test('path, basePath suppressing version fragment', async() => {
        let testRoutes = Hoek.clone(routes);
        testRoutes.path = '/api/v3/servers/{id}';
        testRoutes.options.validate = {
            params: {
                id: Joi.number()
                    .integer()
                    .required()
                    .description('ID of server to delete')
            }
        };

        const options = {
            basePath: '/api',
            pathReplacements: [
                {
                    replaceIn: 'all',
                    pattern: /v([0-9]+)\//,
                    replacement: ''
                }
            ]
        };

        const server = await Helper.createServer(options, testRoutes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
        expect(response.result.paths['/servers/{id}']).to.exist();

    });

    lab.test('route deprecated', async() => {
        let testRoutes = Hoek.clone(routes);
        testRoutes.options.plugins = {
            'hapi-swagger': {
                deprecated: true
            }
        };

        const server = await Helper.createServer({}, testRoutes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
        expect(response.result.paths['/test'].post.deprecated).to.equal(true);
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();
    });

    lab.test('custom operationId for code-gen apps', async() => {
        let testRoutes = Hoek.clone(routes);
        testRoutes.options.plugins = {
            'hapi-swagger': {
                id: 'add'
            }
        };

        const server = await Helper.createServer({}, testRoutes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
        expect(
            response.result.paths['/test'].post.operationId
        ).to.equal('add');
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();
    });

    lab.test('stop boolean creating parameter', async() => {
        let testRoutes = {
            method: 'GET',
            path: '/{name}',
            config: {
                handler: () => {},
                tags: ['api'],
                validate: {
                    headers: true,
                    params: {
                        name: Joi.string().min(2)
                    },
                    query: false
                }
            }
        };

        const server = await Helper.createServer({}, testRoutes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
        expect(
            response.result.paths['/{name}'].get.parameters
        ).to.equal([
            {
                type: 'string',
                minLength: 2,
                name: 'name',
                in: 'path',
                required: true
            }
        ]);
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });

    lab.test('stop emtpy objects creating parameter', async() => {
        let testRoutes = {
            method: 'POST',
            path: '/{name}',
            config: {
                handler: () => {},
                tags: ['api'],
                validate: {
                    payload: Joi.object()
                }
            }
        };

        const server = await Helper.createServer({}, testRoutes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
        expect(
            response.result.paths['/{name}'].post.parameters
        ).to.equal([
            {
                in: 'body',
                name: 'body',
                schema: {
                    $ref: '#/definitions/Model 1'
                }
            }
        ]);

        // Before this test returned string: "'Validation failed. /paths/{name}/post is missing path parameter(s) for {name}"
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.false();

    });

    lab.test('stop emtpy formData object creating parameter', async() => {
        let testRoutes = {
            method: 'POST',
            path: '/',
            config: {
                handler: () => {},
                tags: ['api'],
                validate: {
                    payload: Joi.object()
                },
                plugins: {
                    'hapi-swagger': {
                        payloadType: 'form'
                    }
                }
            }
        };

        const server = await Helper.createServer({}, testRoutes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
        expect(
            response.result.paths['/'].post.parameters
        ).to.not.exists();

        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();
    });

});
