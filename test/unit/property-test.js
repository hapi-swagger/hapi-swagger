'use strict';
const Code = require('code');
const Joi = require('joi');
const Lab = require('lab');
const Hoek = require('hoek');
const Helper = require('../helper.js');
const Defaults = require('../../lib/defaults.js');
const Properties = require('../../lib/properties.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();

let definitionCollection;
let altDefinitionCollection;
let propertiesAlt;
let propertiesNoAlt;


let clearDown = function () {

    definitionCollection = {};
    altDefinitionCollection = {};

    let definitionCache = [
        new WeakMap(),
        new WeakMap()
    ];

    propertiesAlt = new Properties(Defaults, definitionCollection, altDefinitionCollection, definitionCache);
    propertiesNoAlt = new Properties(Hoek.clone(Defaults).xProperties = false, definitionCollection, altDefinitionCollection);
};

// parseProperty takes:   name, joiObj, parameterType, useDefinitions, isAlt
// i.e. propertiesNoAlt.parseProperty('x', Joi.object(), null, true, false);
// i.e. propertiesAlt.parseProperty('x', Joi.object(), null, true, true);


lab.experiment('property - ', () => {

    lab.test('parse types', () => {

        clearDown();
        expect(propertiesNoAlt.parseProperty('x', null, null, true, false)).to.equal(undefined);

    });

    // parseProperty(name, joiObj, parent, parameterType, useDefinitions, isAlt)

    lab.test('parse types', () => {

        clearDown();
        //console.log(JSON.stringify(propertiesNoAlt.parseProperty('x', Joi.any(), null, null, true, false)));
        expect(propertiesNoAlt.parseProperty('x', Joi.object(), null, 'body', true, false)).to.equal({ '$ref': '#/definitions/x' });
        expect(propertiesNoAlt.parseProperty('x', Joi.string(), null, 'body', true, false)).to.equal({ 'type': 'string' });
        expect(propertiesNoAlt.parseProperty('x', Joi.number(), null, 'body', true, false)).to.equal({ 'type': 'number' });
        expect(propertiesNoAlt.parseProperty('x', Joi.boolean(), null, 'body', true, false)).to.equal({ 'type': 'boolean' });
        expect(propertiesNoAlt.parseProperty('x', Joi.date(), null, 'body', true, false)).to.equal({ 'type': 'string', 'format': 'date' });
        expect(propertiesNoAlt.parseProperty('x', Joi.binary(), null, 'body', true, false)).to.equal({ 'type': 'string', 'format': 'binary' });
        expect(propertiesNoAlt.parseProperty('x', Joi.array(), null, 'body', true, false)).to.equal({ '$ref': '#/definitions/Model 1' });
        expect(propertiesNoAlt.parseProperty('x', Joi.any(), null, 'body', true, false)).to.equal({ 'type': 'string' });
        //expect(propertiesNoAlt.parseProperty('x', Joi.func(), null, 'body', true, false)).to.equal({ 'type': 'string' });

    });



    lab.test('parse types with useDefinitions=false', () => {

        clearDown();
        expect(propertiesNoAlt.parseProperty('x', Joi.object(), null, 'body', false, false)).to.equal({ 'type': 'object' });
        expect(propertiesNoAlt.parseProperty('x', Joi.string(), null, 'body', false, false)).to.equal({ 'type': 'string' });
        expect(propertiesNoAlt.parseProperty('x', Joi.number(), null, 'body', false, false)).to.equal({ 'type': 'number' });
        expect(propertiesNoAlt.parseProperty('x', Joi.boolean(), null, 'body', false, false)).to.equal({ 'type': 'boolean' });
        expect(propertiesNoAlt.parseProperty('x', Joi.date(), null, 'body', false, false)).to.equal({ 'type': 'string', 'format': 'date' });
        expect(propertiesNoAlt.parseProperty('x', Joi.binary(), null, 'body', false, false)).to.equal({ 'type': 'string', 'format': 'binary' });
        expect(propertiesNoAlt.parseProperty('x', Joi.array(), null, 'body', false, false)).to.equal({ 'type': 'array', 'name': 'x', 'items': { 'type': 'string' } });

    });


    lab.test('parse simple meta', () => {

        clearDown();
        expect(propertiesNoAlt.parseProperty('x', Joi.string().description('this is bob'), null, 'body', true, false)).to.equal({ 'type': 'string', 'description': 'this is bob' });
        expect(propertiesAlt.parseProperty('x', Joi.string().example('bob'), null, 'body', true, false)).to.equal({ 'type': 'string', 'example': 'bob' });

    });


    lab.test('parse meta', () => {

        clearDown();
        // TODO add all meta data properties
        expect(propertiesAlt.parseProperty('x', Joi.string().meta({ 'x': 'y' }), null, 'body', true, false)).to.equal({ 'type': 'string', 'x-meta': { 'x': 'y' } });
        expect(propertiesNoAlt.parseProperty('x', Joi.string().forbidden(), null, 'body', true, false)).to.equal(undefined);
        expect(propertiesNoAlt.parseProperty('x', Joi.string().required(), null, 'body', true, false)).to.equal({ 'type': 'string' }); // required in parent
        expect(propertiesNoAlt.parseProperty('x', Joi.any().required(), null, 'body', true, false)).to.equal({ 'type': 'string' }); // required in parent
        expect(propertiesNoAlt.parseProperty('x', Joi.any().forbidden(), null, 'body', true, false)).to.equal(undefined);
        expect(propertiesNoAlt.parseProperty('x', Joi.string().valid(['a', 'b']), null, 'body', true, false)).to.equal({ type: 'string', enum: ['a', 'b'] });
        expect(propertiesNoAlt.parseProperty('x', Joi.string().valid(['a', 'b', '']), null, 'body', true, false)).to.equal({ type: 'string', enum: ['a', 'b'] });
        expect(propertiesNoAlt.parseProperty('x', Joi.string().valid(['a', 'b', null]), null, 'body', true, false)).to.equal({ type: 'string', enum: ['a', 'b'] });
        expect(propertiesNoAlt.parseProperty('x', Joi.date().timestamp().default(() => Date.now(), 'Current Timestamp')).default).to.exist();
        //console.log(JSON.stringify(propertiesAlt.parseProperty('x',Joi.date().timestamp().default(() => Date.now(), 'Current Timestamp'))));

        const nonNegativeWithDropdown = propertiesAlt.parseProperty('x', Joi.number().integer().positive().allow(0), null, 'body', true, false);
        const nonNegativeWithoutDropdown = propertiesAlt.parseProperty('x', Joi.number().integer().positive().allow(0).meta({disableDropdown: true}), null, 'body', true, false);

        expect(nonNegativeWithDropdown).to.include({ enum: [0] });
        expect(nonNegativeWithoutDropdown).to.not.include({ enum: [0] });

    });



    lab.test('parse type string', () => {

        clearDown();
        expect(propertiesNoAlt.parseProperty('x', Joi.string(), null, 'body', true, false)).to.equal({ 'type': 'string' });
        expect(propertiesNoAlt.parseProperty('x', Joi.string().min(5), null, 'body', true, false)).to.equal({ 'type': 'string', 'minLength': 5 });
        expect(propertiesNoAlt.parseProperty('x', Joi.string().max(10), null, 'body', true, false)).to.equal({ 'type': 'string', 'maxLength': 10 });
        expect(propertiesNoAlt.parseProperty('x', Joi.string().regex(/^[a-zA-Z0-9]{3,30}/), null, 'body', true, false)).to.equal({
            'type': 'string',
            'pattern': '^[a-zA-Z0-9]{3,30}'
        });

        expect(propertiesAlt.parseProperty('x', Joi.string().length(0, 'utf8'), null, 'body', true, false)).to.equal({ 'type': 'string', 'x-constraint': { 'length': 0 } });
        expect(propertiesAlt.parseProperty('x', Joi.string().length(20, 'utf8'), null, 'body', true, false)).to.equal({ 'type': 'string', 'x-constraint': { 'length': 20 } });
        //expect(propertiesNoAlt.parseProperty('x', Joi.string().insensitive())).to.equal({ 'type': 'string', 'x-constraint': { 'insensitive': true } });

        expect(propertiesAlt.parseProperty('x', Joi.string().creditCard(), null, 'body', true, false)).to.equal({ 'type': 'string', 'x-format': { 'creditCard': true } });
        expect(propertiesAlt.parseProperty('x', Joi.string().alphanum(), null, 'body', true, false)).to.equal({ 'type': 'string', 'x-format': { 'alphanum': true } });
        expect(propertiesAlt.parseProperty('x', Joi.string().token(), null, 'body', true, false)).to.equal({ 'type': 'string', 'x-format': { 'token': true } });

        expect(propertiesAlt.parseProperty('x', Joi.string().email({
            errorLevel: 256,
            tldWhitelist: ['example.com'],
            minDomainAtoms: 2
        }), null, true, true)).to.equal({
            'type': 'string', 'x-format': {
                'email': {
                    'errorLevel': 256,
                    'tldWhitelist': [
                        'example.com'
                    ],
                    'minDomainAtoms': 2
                }
            }
        });

        expect(propertiesAlt.parseProperty('x', Joi.string().ip({
            version: [
                'ipv4',
                'ipv6'
            ],
            cidr: 'required'
        }), null, true, true)).to.equal({
            'type': 'string', 'x-format': {
                'ip': {
                    'version': [
                        'ipv4',
                        'ipv6'
                    ],
                    'cidr': 'required'
                }
            }
        });

        /* TODO fix this so that regexp work or document the fact it does not work
       expect(propertiesNoAlt.parseProperty('x', Joi.string().uri({
           scheme: [
               'git',
               /git\+https?/
           ]
       }))).to.equal({ 'type': 'string', 'x-format': {
           'uri': {
               'scheme': [
                   'git',
                   {}
               ]
           }
       } });
       */

        expect(propertiesAlt.parseProperty('x', Joi.string().guid(), null, 'body', true, true)).to.equal({ 'type': 'string', 'x-format': { 'guid': true } });
        expect(propertiesAlt.parseProperty('x', Joi.string().hex(), null, 'body', true, true)).to.equal({ 'type': 'string', 'pattern': '^[a-f0-9]+$', 'x-format': { 'hex': true } });
        expect(propertiesAlt.parseProperty('x', Joi.string().guid(), null, 'body', true, true)).to.equal({ 'type': 'string', 'x-format': { 'guid': true } });
        expect(propertiesAlt.parseProperty('x', Joi.string().hostname(), null, 'body', true, true)).to.equal({ 'type': 'string', 'x-format': { 'hostname': true } });
        expect(propertiesAlt.parseProperty('x', Joi.string().isoDate(), null, 'body', true, true)).to.equal({ 'type': 'string', 'x-format': { 'isoDate': true } });

        expect(propertiesAlt.parseProperty('x', Joi.string().lowercase(), null, 'body', true, true)).to.equal({ 'type': 'string', 'x-convert': { 'lowercase': true } });
        expect(propertiesAlt.parseProperty('x', Joi.string().uppercase(), null, 'body', true, true)).to.equal({ 'type': 'string', 'x-convert': { 'uppercase': true } });
        expect(propertiesAlt.parseProperty('x', Joi.string().trim(), null, 'body', true, true)).to.equal({ 'type': 'string', 'x-convert': { 'trim': true } });


        // test options.xProperties = false
        expect(propertiesNoAlt.parseProperty('x', Joi.string().lowercase(), null, 'body', true, false)).to.equal({ 'type': 'string' });

    });


    lab.test('parse type date', () => {

        clearDown();
        expect(propertiesNoAlt.parseProperty('x', Joi.date(), null, 'body', true, false)).to.equal({ 'type': 'string', 'format': 'date' });

        /*  not yet 'x',
        date.min(date)
        date.max(date)
        date.format(format)
        date.iso()
        */

    });


    lab.test('parse type date timestamp', () => {

        clearDown();
        expect(propertiesNoAlt.parseProperty('x', Joi.date().timestamp(), null, 'body', true, false)).to.equal({ 'type': 'number' });

    });


    lab.test('parse type number', () => {

        clearDown();
        // mapped direct to openapi
        expect(propertiesNoAlt.parseProperty('x', Joi.number().integer(), null, 'body', true, false)).to.equal({ 'type': 'integer' });
        expect(propertiesNoAlt.parseProperty('x', Joi.number().min(5), null, 'body', true, false)).to.equal({ 'type': 'number', 'minimum': 5 });
        expect(propertiesNoAlt.parseProperty('x', Joi.number().max(10), null, 'body', true, false)).to.equal({ 'type': 'number', 'maximum': 10 });

        // x-* mappings
        expect(propertiesAlt.parseProperty('x', Joi.number().greater(10), null, 'body', true, true)).to.equal({ 'type': 'number', 'x-constraint': { 'greater': 10 } });
        expect(propertiesAlt.parseProperty('x', Joi.number().less(10), null, 'body', true, true)).to.equal({ 'type': 'number', 'x-constraint': { 'less': 10 } });
        expect(propertiesAlt.parseProperty('x', Joi.number().precision(2), null, 'body', true, true)).to.equal({ 'type': 'number', 'x-constraint': { 'precision': 2 } });
        expect(propertiesAlt.parseProperty('x', Joi.number().multiple(2), null, 'body', true, true)).to.equal({ 'type': 'number', 'x-constraint': { 'multiple': 2 } });
        expect(propertiesAlt.parseProperty('x', Joi.number().positive(), null, 'body', true, true)).to.equal({ 'type': 'number', 'x-constraint': { 'positive': true } });
        expect(propertiesAlt.parseProperty('x', Joi.number().negative(), null, 'body', true, true)).to.equal({ 'type': 'number', 'x-constraint': { 'negative': true } });

        // test options.xProperties = false
        expect(propertiesNoAlt.parseProperty('x', Joi.number().greater(10), null, 'body', true, false)).to.equal({ 'type': 'number' });

    });


    lab.test('parse type array', () => {


        clearDown();

        //console.log(JSON.stringify(propertiesNoAlt.parseProperty('x', Joi.array(), null, false, false)));

        // basic child types
        expect(propertiesNoAlt.parseProperty('x', Joi.array(), null, 'body', false, false)).to.equal({ 'type': 'array', 'name': 'x', 'items': { 'type': 'string' } });
        expect(propertiesNoAlt.parseProperty('x', Joi.array().items(), null, 'body', false, false)).to.equal({ 'type': 'array', 'name': 'x', 'items': { 'type': 'string' } });
        expect(propertiesNoAlt.parseProperty('x', Joi.array().items(Joi.object()), null, 'body', false, false)).to.equal({ 'type': 'array', 'name': 'x', 'items': { 'type': 'object' } });
        expect(propertiesNoAlt.parseProperty('x', Joi.array().items(Joi.string()), null, 'body', false, false)).to.equal({ 'type': 'array', 'name': 'x', 'items': { 'type': 'string' } });
        expect(propertiesNoAlt.parseProperty('x', Joi.array().items(Joi.number()), null, 'body', false, false)).to.equal({ 'type': 'array', 'name': 'x', 'items': { 'type': 'number' } });
        expect(propertiesNoAlt.parseProperty('x', Joi.array().items(Joi.boolean()), null, 'body', false, false)).to.equal({ 'type': 'array', 'name': 'x', 'items': { 'type': 'boolean' } });
        expect(propertiesNoAlt.parseProperty('x', Joi.array().items(Joi.date()), null, 'body', false, false)).to.equal({ 'type': 'array', 'name': 'x', 'items': { 'type': 'string', 'format': 'date' } });
        expect(propertiesNoAlt.parseProperty('x', Joi.array().items(Joi.binary()), null, 'body', false, false)).to.equal({ 'type': 'array', 'name': 'x', 'items': { 'type': 'string', 'format': 'binary' } });

        // complex child types - arrays and objects


        clearDown();
        //console.log(JSON.stringify(propertiesNoAlt.parseProperty('x', Joi.array().items({ 'text': Joi.string() }), null, 'formData', true, false)));
        expect(propertiesNoAlt.parseProperty('x', Joi.array().items(Joi.string()), null, 'formData', true, false)).to.equal({
            '$ref': '#/definitions/x'
        });
        //console.log(JSON.stringify(definitionCollection));
        expect(definitionCollection).to.equal({
            'x': {
                'type': 'array',
                'items': {
                    'type': 'string'
                },
                'collectionFormat': 'multi'
            }
        });


        // TODO
        // Joi.array().items(Joi.array().items(Joi.string())

        // make sure type features such as string().min(1)in array items are past into JSON
        expect(propertiesNoAlt.parseProperty('x', Joi.array().items(Joi.string().min(1)), null, 'body', false, false)).to.equal({ 'type': 'array', 'items': { 'type': 'string', 'minLength': 1 }, 'name': 'x' });

        // mapped direct to openapi
        expect(propertiesNoAlt.parseProperty('x', Joi.array().min(5), null, 'body', false, false)).to.equal({ 'type': 'array', 'name': 'x', 'items': { 'type': 'string' }, 'minItems': 5 });
        expect(propertiesNoAlt.parseProperty('x', Joi.array().max(10), null, 'body', false, false)).to.equal({ 'type': 'array', 'name': 'x', 'items': { 'type': 'string' }, 'maxItems': 10 });

        // x-* mappings
        expect(propertiesAlt.parseProperty('x', Joi.array().sparse(), null, 'body', false, false)).to.equal({ 'type': 'array', 'name': 'x', 'items': { 'type': 'string' }, 'x-constraint': { 'sparse': true } });
        expect(propertiesAlt.parseProperty('x', Joi.array().single(), null, 'body', false, false)).to.equal({ 'type': 'array', 'name': 'x', 'items': { 'type': 'string' }, 'x-constraint': { 'single': true } });
        expect(propertiesAlt.parseProperty('x', Joi.array().length(0), null, 'body', false, false)).to.equal({ 'type': 'array', 'name': 'x', 'items': { 'type': 'string' }, 'x-constraint': { 'length': 0 } });
        expect(propertiesAlt.parseProperty('x', Joi.array().length(2), null, 'body', false, false)).to.equal({ 'type': 'array', 'name': 'x', 'items': { 'type': 'string' }, 'x-constraint': { 'length': 2 } });
        expect(propertiesAlt.parseProperty('x', Joi.array().unique(), null, 'body', false, false)).to.equal({ 'type': 'array', 'name': 'x', 'items': { 'type': 'string' }, 'x-constraint': { 'unique': true } });

        // test options.xProperties = false
        expect(propertiesNoAlt.parseProperty('x', Joi.array().sparse(), null, 'body', false, false)).to.equal({ 'type': 'array', 'name': 'x', 'items': { 'type': 'string' } });

    });
});


lab.test('parse type object', () => {

    clearDown();
    //console.log(JSON.stringify( propertiesNoAlt.parseProperty('x', Joi.object(), {}, {}, 'formData')  ));
    expect(propertiesNoAlt.parseProperty('x', Joi.object(), null, 'body', false, false)).to.equal({ 'type': 'object' });
    expect(propertiesNoAlt.parseProperty('x', Joi.object().keys(), null, 'body', false, false)).to.equal({ 'type': 'object' });
    expect(propertiesNoAlt.parseProperty('x', Joi.object().keys({ a: Joi.string() }), null, 'body', false, false)).to.equal({
        'name': 'x',
        'type': 'object',
        'properties': {
            'a': {
                'type': 'string'
            }
        }
    });
    expect(propertiesNoAlt.parseProperty('x', Joi.object({ a: Joi.string() }), null, 'body', false, false)).to.equal({
        'name': 'x',
        'type': 'object',
        'properties': {
            'a': {
                'type': 'string'
            }
        }
    });

});


lab.experiment('property deep - ', () => {

    clearDown();
    const deepStructure = Joi.object({
        outer1: Joi.object({
            inner1: Joi.string()
                .description('child description')
                .notes(['child notes'])
                .tags(['child', 'api'])
                .required()
                .label('inner1')
        }),
        outer2: Joi.object({
            inner2: Joi.number()
                .description('child description')
                .notes(['child notes'])
                .tags(['child', 'api'])
                .min(5)
                .max(10)
                .required()
                .label('inner2')
        })
    });


    //console.log(JSON.stringify( propertiesNoAlt.parseProperty( deepStructure, {}, {}, null, false ) ));

    lab.test('parse structure with child labels', () => {

        //console.log(JSON.stringify( propertiesNoAlt.parseProperty(null, deepStructure, null, false, false)  ));

        expect(propertiesNoAlt.parseProperty(null, deepStructure, null, 'body', false, false)).to.equal({
            'type': 'object',
            'properties': {
                'outer1': {
                    'name': 'outer1',
                    'type': 'object',
                    'properties': {
                        'inner1': {
                            'type': 'string',
                            'description': 'child description',
                            'notes': [
                                'child notes'
                            ],
                            'tags': [
                                'child',
                                'api'
                            ]
                        }
                    },
                    'required': ['inner1']
                },
                'outer2': {
                    'name': 'outer2',
                    'type': 'object',
                    'properties': {
                        'inner2': {
                            'type': 'number',
                            'description': 'child description',
                            'notes': [
                                'child notes'
                            ],
                            'tags': [
                                'child',
                                'api'
                            ],
                            'minimum': 5,
                            'maximum': 10
                        }
                    },
                    'required': ['inner2']
                }
            }
        });

    });



    lab.test('parse structure with child description, notes, name etc', async() => {

        clearDown();
        const routes = [{
            method: 'POST',
            path: '/path/two',
            config: {
                tags: ['api'],
                handler: Helper.defaultHandler,
                response: {
                    schema: deepStructure
                }
            }
        }];

        const server = await Helper.createServer({}, routes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });

        //console.log(JSON.stringify(response.result.definitions));
        expect(response.result.definitions.outer1).to.equal({
            'properties': {
                'inner1': {
                    'description': 'child description',
                    'type': 'string',
                    'notes': [
                        'child notes'
                    ],
                    'tags': [
                        'child',
                        'api'
                    ]
                }
            },
            'required': [
                'inner1'
            ],
            'type': 'object'
        });

    });
});


lab.experiment('joi extension - ', () => {
    lab.test('custom joi extension', () => {

        clearDown();
        const extension = Joi.extend({
            base: Joi.string(),
            name: 'custom'
        });
        expect(propertiesNoAlt.parseProperty('x', extension.custom(), null, 'body', true, false)).to.equal({ 'type': 'string' });
    });
});
