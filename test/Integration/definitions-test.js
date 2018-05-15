const Code = require('code');
const Joi = require('joi');
const Lab = require('lab');
const Helper = require('../helper.js');
const Validate = require('../../lib/validate.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();



lab.experiment('definitions', () => {

    const routes = [{
        method: 'POST',
        path: '/test/',
        options: {
            handler: Helper.defaultHandler,
            tags: ['api'],
            validate: {
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
                        .description('the opertator i.e. + - / or *'),

                    equals: Joi.number()
                        .required()
                        .description('the result of the sum')
                }
            }
        }
    },{
        method: 'POST',
        path: '/test/2',
        options: {
            handler: Helper.defaultHandler,
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    a: Joi.string(),
                    b: Joi.object({
                        c: Joi.string()
                    })
                }).label('Model')
            }
        }
    },{
        method: 'POST',
        path: '/test/3',
        options: {
            handler: Helper.defaultHandler,
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    a: Joi.string(),
                    b: Joi.object({
                        c: Joi.string()
                    })
                }).label('Model 1')
            }
        }
    }];


    lab.test('payload with inline definition', async() => {

        const server = await Helper.createServer({}, routes);

        const defination = {
            'properties': {
                'a': {
                    'description': 'the first number',
                    'type': 'number'
                },
                'b': {
                    'description': 'the second number',
                    'type': 'number'
                },
                'operator': {
                    'description': 'the opertator i.e. + - / or *',
                    'default': '+',
                    'type': 'string'
                },
                'equals': {
                    'description': 'the result of the sum',
                    'type': 'number'
                }
            },
            'required': [
                'a',
                'b',
                'operator',
                'equals'
            ],
            'type': 'object'
        };

        const response = await server.inject({ method: 'GET', url: '/swagger.json' });

        expect(response.statusCode).to.equal(200);
        expect(response.result.paths['/test/'].post.parameters[0].schema).to.equal({
            '$ref': '#/definitions/Model 1'
        });
        expect(response.result.definitions['Model 1']).to.equal(defination);
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });


    lab.test('override definition named Model', async() => {

        const server = await Helper.createServer({}, routes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });

        //console.log(JSON.stringify(response.result.definitions));
        expect(response.result.definitions.b).to.exists();
        expect(response.result.definitions.Model).to.exists();
        expect(response.result.definitions['Model 1']).to.exists();

        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });

    lab.test('reuseDefinitions = false', async() => {

        // forces two models even though the model hash is the same

        const tempRoutes = [{
            method: 'POST',
            path: '/store1/',
            options: {
                handler: Helper.defaultHandler,
                tags: ['api'],
                validate: {
                    payload: Joi.object({
                        a: Joi.number(),
                        b: Joi.number(),
                        operator: Joi.string(),
                        equals: Joi.number()
                    }).label('A')
                }
            }
        }, {
            method: 'POST',
            path: '/store2/',
            options: {
                handler: Helper.defaultHandler,
                tags: ['api'],
                validate: {
                    payload: Joi.object({
                        a: Joi.number(),
                        b: Joi.number(),
                        operator: Joi.string(),
                        equals: Joi.number()
                    }).label('B')
                }
            }
        }];

        const server = await Helper.createServer({ reuseDefinitions: false }, tempRoutes);

        const response = await server.inject({ method: 'GET', url: '/swagger.json' });

        //console.log(JSON.stringify(response.result));
        expect(response.statusCode).to.equal(200);
        expect(response.result.definitions.A).to.exist();
        expect(response.result.definitions.B).to.exist();
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });

    lab.test('definitionPrefix = useLabel', async() => {

        // use the label as a prefix for dynamic model names

        const tempRoutes = [{
            method: 'POST',
            path: '/store1/',
            options: {
                handler: Helper.defaultHandler,
                tags: ['api'],
                validate: {
                    payload: Joi.object({
                        a: Joi.number(),
                        b: Joi.number(),
                        operator: Joi.string(),
                        equals: Joi.number()
                    }).label('A')
                }
            }
        }, {
            method: 'POST',
            path: '/store2/',
            options: {
                handler: Helper.defaultHandler,
                tags: ['api'],
                validate: {
                    payload: Joi.object({
                        c: Joi.number(),
                        v: Joi.number(),
                        operator: Joi.string(),
                        equals: Joi.number()
                    }).label('A A')
                }
            }
        }, {
            method: 'POST',
            path: '/store3/',
            options: {
                handler: Helper.defaultHandler,
                tags: ['api'],
                validate: {
                    payload: Joi.object({
                        c: Joi.number(),
                        f: Joi.number(),
                        operator: Joi.string(),
                        equals: Joi.number()
                    }).label('A')
                }
            }
        }];

        const server = await Helper.createServer({ definitionPrefix: 'useLabel' }, tempRoutes);

        const response = await server.inject({ method: 'GET', url: '/swagger.json' });

        expect(response.statusCode).to.equal(200);
        expect(response.result.definitions.A).to.exist();
        expect(response.result.definitions['A A']).to.exist();
        expect(response.result.definitions['A 1']).to.exist();
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();
    });

    lab.test('test that optional array is not in swagger output', async() => {

        let testRoutes = [{
            method: 'POST',
            path: '/server/1/',
            options: {
                handler: Helper.defaultHandler,
                tags: ['api'],
                validate: {
                    payload: Joi.object({
                        a: Joi.number().required(),
                        b: Joi.string().optional()
                    }).label('test')
                }
            }
        }];

        const server = await Helper.createServer({}, testRoutes);

        const response = await server.inject({ method: 'GET', url: '/swagger.json' });

        expect(response.statusCode).to.equal(200);
        expect(response.result.definitions.test).to.equal({
            'type': 'object',
            'properties': {
                'a': {
                    'type': 'number'
                },
                'b': {
                    'type': 'string'
                }
            },
            'required': [
                'a'
            ]
        });

    });


    lab.test('test that name changing for required', async() => {


        const FormDependencyDefinition = Joi.object({
            id: Joi.number().required()
        }).label('FormDependencyDefinition');

        const ActionDefinition = Joi.object({
            id: Joi.number().required().allow(null),
            reminder: FormDependencyDefinition.required()
        }).label('ActionDefinition');


        let testRoutes = [{
            method: 'POST',
            path: '/server/',
            options: {
                handler: Helper.defaultHandler,
                tags: ['api'],
                validate: {
                    payload: ActionDefinition
                }
            }
        }];

        const server = await Helper.createServer({}, testRoutes);

        const response = await server.inject({ method: 'GET', url: '/swagger.json' });

        expect(response.statusCode).to.equal(200);
        expect(response.result.definitions.ActionDefinition).to.equal({
            'type': 'object',
            'properties': {
                'id': {
                    'type': 'number'
                },
                'reminder': {
                    '$ref': '#/definitions/FormDependencyDefinition'
                }
            },
            'required': [
                'id',
                'reminder'
            ]
        });

    });



});
