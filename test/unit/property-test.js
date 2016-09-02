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

    lab.test('parse types', (done) => {

        clearDown();
        expect(propertiesNoAlt.parseProperty('x', null, null, true, false)).to.equal(undefined);

        done();
    });

    // parseProperty(name, joiObj, parameterType, useDefinitions, isAlt)

    lab.test('parse types', (done) => {

        clearDown();
        expect(propertiesNoAlt.parseProperty('x', Joi.object(), null, true, false)).to.equal({ '$ref': '#/definitions/x', 'type': 'object' });
        expect(propertiesNoAlt.parseProperty('x', Joi.string(), null, true, false)).to.equal({ 'type': 'string' });
        expect(propertiesNoAlt.parseProperty('x', Joi.number(), null, true, false)).to.equal({ 'type': 'number' });
        expect(propertiesNoAlt.parseProperty('x', Joi.boolean(), null, true, false)).to.equal({ 'type': 'boolean' });
        expect(propertiesNoAlt.parseProperty('x', Joi.date(), null, true, false)).to.equal({ 'type': 'string', 'format': 'date' });
        expect(propertiesNoAlt.parseProperty('x', Joi.binary(), null, true, false)).to.equal({ 'type': 'string', 'format': 'binary' });
        expect(propertiesNoAlt.parseProperty('x', Joi.array(), null, true, false)).to.equal({ '$ref': '#/definitions/Model 1', 'type': 'array' });
        expect(propertiesNoAlt.parseProperty('x', Joi.any(), null, true, false)).to.equal({ 'type': 'string' });
        //expect(propertiesNoAlt.parseProperty('x', Joi.func(), null, true, false)).to.equal({ 'type': 'string' });

        done();
    });



    lab.test('parse types with useDefinitions=false', (done) => {

        clearDown();
        expect(propertiesNoAlt.parseProperty('x', Joi.object(), null, false, false)).to.equal({ 'type': 'object' });
        expect(propertiesNoAlt.parseProperty('x', Joi.string(), null, false, false)).to.equal({ 'type': 'string' });
        expect(propertiesNoAlt.parseProperty('x', Joi.number(), null, false, false)).to.equal({ 'type': 'number' });
        expect(propertiesNoAlt.parseProperty('x', Joi.boolean(), null, false, false)).to.equal({ 'type': 'boolean' });
        expect(propertiesNoAlt.parseProperty('x', Joi.date(), null, false, false)).to.equal({ 'type': 'string', 'format': 'date' });
        expect(propertiesNoAlt.parseProperty('x', Joi.binary(), null, false, false)).to.equal({ 'type': 'string', 'format': 'binary' });
        expect(propertiesNoAlt.parseProperty('x', Joi.array(), null, false, false)).to.equal({ 'type': 'array', 'name': 'x', 'items': { 'type': 'string' } });

        done();
    });


    lab.test('parse simple meta', (done) => {

        clearDown();
        expect(propertiesNoAlt.parseProperty('x', Joi.string().description('this is bob'), null, true, false)).to.equal({ 'type': 'string', 'description': 'this is bob' });
        expect(propertiesAlt.parseProperty('x', Joi.string().example('bob'), null, true, true)).to.equal({ 'type': 'string', 'example': 'bob' });

        done();
    });


    lab.test('parse meta', (done) => {

        clearDown();
        // TODO add all meta data properties
        expect(propertiesAlt.parseProperty('x', Joi.string().meta({ 'x': 'y' }), null, true, true)).to.equal({ 'type': 'string', 'x-meta': { 'x': 'y' } });
        expect(propertiesNoAlt.parseProperty('x', Joi.string().forbidden(), null, true, false)).to.equal(undefined);
        expect(propertiesNoAlt.parseProperty('x', Joi.string().required(), null, true, false)).to.equal({ 'type': 'string', 'required': true });
        expect(propertiesNoAlt.parseProperty('x', Joi.any().required(), null, true, false)).to.equal({ 'type': 'string', 'required': true });
        expect(propertiesNoAlt.parseProperty('x', Joi.any().forbidden(), null, true, false)).to.equal(undefined);
        expect(propertiesNoAlt.parseProperty('x', Joi.string().valid(['a', 'b']), null, true, false)).to.equal({ type: 'string', enum: ['a', 'b'] });
        expect(propertiesNoAlt.parseProperty('x', Joi.string().valid(['a', 'b', '']), null, true, false)).to.equal({ type: 'string', enum: ['a', 'b'] });
        expect(propertiesNoAlt.parseProperty('x', Joi.string().valid(['a', 'b', null]), null, true, false)).to.equal({ type: 'string', enum: ['a', 'b'] });
        expect(propertiesNoAlt.parseProperty('x', Joi.date().timestamp().default(() => Date.now(), 'Current Timestamp')).default).to.exist();
        //console.log(JSON.stringify(propertiesAlt.parseProperty('x',Joi.date().timestamp().default(() => Date.now(), 'Current Timestamp'))));

        done();
    });



    lab.test('parse type string', (done) => {

        clearDown();
        expect(propertiesNoAlt.parseProperty('x', Joi.string(), null, true, false)).to.equal({ 'type': 'string' });
        expect(propertiesNoAlt.parseProperty('x', Joi.string().min(5), null, true, false)).to.equal({ 'type': 'string', 'minLength': 5 });
        expect(propertiesNoAlt.parseProperty('x', Joi.string().max(10), null, true, false)).to.equal({ 'type': 'string', 'maxLength': 10 });
        expect(propertiesNoAlt.parseProperty('x', Joi.string().regex(/^[a-zA-Z0-9]{3,30}/), null, true, false)).to.equal({
            'type': 'string',
            'pattern': '/^[a-zA-Z0-9]{3,30}/'
        });

        expect(propertiesAlt.parseProperty('x', Joi.string().length(20, 'utf8'), null, true, true)).to.equal({ 'type': 'string', 'x-constraint': { 'length': 20 } });
        //expect(propertiesNoAlt.parseProperty('x', Joi.string().insensitive())).to.equal({ 'type': 'string', 'x-constraint': { 'insensitive': true } });

        expect(propertiesAlt.parseProperty('x', Joi.string().creditCard(), null, true, true)).to.equal({ 'type': 'string', 'x-format': { 'creditCard': true } });
        expect(propertiesAlt.parseProperty('x', Joi.string().alphanum(), null, true, true)).to.equal({ 'type': 'string', 'x-format': { 'alphanum': true } });
        expect(propertiesAlt.parseProperty('x', Joi.string().token(), null, true, true)).to.equal({ 'type': 'string', 'x-format': { 'token': true } });

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

        expect(propertiesAlt.parseProperty('x', Joi.string().guid(), null, true, true)).to.equal({ 'type': 'string', 'x-format': { 'guid': true } });
        expect(propertiesAlt.parseProperty('x', Joi.string().hex(), null, true, true)).to.equal({ 'type': 'string', 'pattern': '/^[a-f0-9]+$/i', 'x-format': { 'hex': true } });
        expect(propertiesAlt.parseProperty('x', Joi.string().guid(), null, true, true)).to.equal({ 'type': 'string', 'x-format': { 'guid': true } });
        expect(propertiesAlt.parseProperty('x', Joi.string().hostname(), null, true, true)).to.equal({ 'type': 'string', 'x-format': { 'hostname': true } });
        expect(propertiesAlt.parseProperty('x', Joi.string().isoDate(), null, true, true)).to.equal({ 'type': 'string', 'x-format': { 'isoDate': true } });

        expect(propertiesAlt.parseProperty('x', Joi.string().lowercase(), null, true, true)).to.equal({ 'type': 'string', 'x-convert': { 'lowercase': true } });
        expect(propertiesAlt.parseProperty('x', Joi.string().uppercase(), null, true, true)).to.equal({ 'type': 'string', 'x-convert': { 'uppercase': true } });
        expect(propertiesAlt.parseProperty('x', Joi.string().trim(), null, true, true)).to.equal({ 'type': 'string', 'x-convert': { 'trim': true } });


        // test options.xProperties = false
        expect(propertiesNoAlt.parseProperty('x', Joi.string().lowercase(), null, true, false)).to.equal({ 'type': 'string' });

        done();
    });


    lab.test('parse type date', (done) => {

        clearDown();
        expect(propertiesNoAlt.parseProperty('x', Joi.date(), null, true, false)).to.equal({ 'type': 'string', 'format': 'date' });

        /*  not yet 'x',
        date.min(date)
        date.max(date)
        date.format(format)
        date.iso()
        */
        done();
    });


    lab.test('parse type number', (done) => {

        clearDown();
        // mapped direct to openapi
        expect(propertiesNoAlt.parseProperty('x', Joi.number().integer(), null, true, false)).to.equal({ 'type': 'integer' });
        expect(propertiesNoAlt.parseProperty('x', Joi.number().min(5), null, true, false)).to.equal({ 'type': 'number', 'minimum': 5 });
        expect(propertiesNoAlt.parseProperty('x', Joi.number().max(10), null, true, false)).to.equal({ 'type': 'number', 'maximum': 10 });

        // x-* mappings
        expect(propertiesAlt.parseProperty('x', Joi.number().greater(10), null, true, true)).to.equal({ 'type': 'number', 'x-constraint': { 'greater': 10 } });
        expect(propertiesAlt.parseProperty('x', Joi.number().less(10), null, true, true)).to.equal({ 'type': 'number', 'x-constraint': { 'less': 10 } });
        expect(propertiesAlt.parseProperty('x', Joi.number().precision(2), null, true, true)).to.equal({ 'type': 'number', 'x-constraint': { 'precision': 2 } });
        expect(propertiesAlt.parseProperty('x', Joi.number().multiple(2), null, true, true)).to.equal({ 'type': 'number', 'x-constraint': { 'multiple': 2 } });
        expect(propertiesAlt.parseProperty('x', Joi.number().positive(), null, true, true)).to.equal({ 'type': 'number', 'x-constraint': { 'positive': true } });
        expect(propertiesAlt.parseProperty('x', Joi.number().negative(), null, true, true)).to.equal({ 'type': 'number', 'x-constraint': { 'negative': true } });

        // test options.xProperties = false
        expect(propertiesNoAlt.parseProperty('x', Joi.number().greater(10), null, true, false)).to.equal({ 'type': 'number' });

        done();
    });


    lab.test('parse type array', (done) => {


        clearDown();

        //console.log(JSON.stringify(propertiesNoAlt.parseProperty('x', Joi.array(), null, false, false)));

        // basic child types
        expect(propertiesNoAlt.parseProperty('x', Joi.array(), null, false, false)).to.equal({ 'type': 'array', 'name': 'x', 'items': { 'type': 'string' } });
        expect(propertiesNoAlt.parseProperty('x', Joi.array().items(), null, false, false)).to.equal({ 'type': 'array', 'name': 'x', 'items': { 'type': 'string' } });
        expect(propertiesNoAlt.parseProperty('x', Joi.array().items(Joi.object()), null, false, false)).to.equal({ 'type': 'array', 'name': 'x', 'items': { 'type': 'object' } });
        expect(propertiesNoAlt.parseProperty('x', Joi.array().items(Joi.string()), null, false, false)).to.equal({ 'type': 'array', 'name': 'x', 'items': { 'type': 'string' } });
        expect(propertiesNoAlt.parseProperty('x', Joi.array().items(Joi.number()), null, false, false)).to.equal({ 'type': 'array', 'name': 'x', 'items': { 'type': 'number' } });
        expect(propertiesNoAlt.parseProperty('x', Joi.array().items(Joi.boolean()), null, false, false)).to.equal({ 'type': 'array', 'name': 'x', 'items': { 'type': 'boolean' } });
        expect(propertiesNoAlt.parseProperty('x', Joi.array().items(Joi.date()), null, false, false)).to.equal({ 'type': 'array', 'name': 'x', 'items': { 'type': 'string', 'format': 'date' } });
        expect(propertiesNoAlt.parseProperty('x', Joi.array().items(Joi.binary()), null, false, false)).to.equal({ 'type': 'array', 'name': 'x', 'items': { 'type': 'string', 'format': 'binary' } });

        // complex child types - arrays and objects


        clearDown();
        // console.log(JSON.stringify(propertiesNoAlt.parseProperty('x', Joi.array().items({ 'text': Joi.string() }), 'formData', true, false)));
        expect(propertiesNoAlt.parseProperty('x', Joi.array().items(Joi.string()), 'formData', true, false)).to.equal({
            '$ref': '#/definitions/x',
            'type': 'array'
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






        // mapped direct to openapi
        expect(propertiesNoAlt.parseProperty('x', Joi.array().min(5), null, false, false)).to.equal({ 'type': 'array', 'name': 'x', 'items': { 'type': 'string' }, 'minItems': 5 });
        expect(propertiesNoAlt.parseProperty('x', Joi.array().max(10), null, false, false)).to.equal({ 'type': 'array', 'name': 'x', 'items': { 'type': 'string' }, 'maxItems': 10 });

        // x-* mappings
        expect(propertiesAlt.parseProperty('x', Joi.array().sparse(), null, false, true)).to.equal({ 'type': 'array', 'name': 'x', 'items': { 'type': 'string' }, 'x-constraint': { 'sparse': true } });
        expect(propertiesAlt.parseProperty('x', Joi.array().single(), null, false, true)).to.equal({ 'type': 'array', 'name': 'x', 'items': { 'type': 'string' }, 'x-constraint': { 'single': true } });
        expect(propertiesAlt.parseProperty('x', Joi.array().length(2), null, false, true)).to.equal({ 'type': 'array', 'name': 'x', 'items': { 'type': 'string' }, 'x-constraint': { 'length': 2 } });
        expect(propertiesAlt.parseProperty('x', Joi.array().unique(), null, false, true)).to.equal({ 'type': 'array', 'name': 'x', 'items': { 'type': 'string' }, 'x-constraint': { 'unique': true } });

        // test options.xProperties = false
        expect(propertiesNoAlt.parseProperty('x', Joi.array().sparse(), null, false, false)).to.equal({ 'type': 'array', 'name': 'x', 'items': { 'type': 'string' } });

        done();

    });
});


lab.test('parse type object', (done) => {

    clearDown();
    //console.log(JSON.stringify( propertiesNoAlt.parseProperty('x', Joi.object(), {}, {}, 'formData')  ));
    expect(propertiesNoAlt.parseProperty('x', Joi.object(), null, false, false)).to.equal({ 'type': 'object' });
    expect(propertiesNoAlt.parseProperty('x', Joi.object().keys(), null, false, false)).to.equal({ 'type': 'object' });
    expect(propertiesNoAlt.parseProperty('x', Joi.object().keys({ a: Joi.string() }), null, false, false)).to.equal({
        'name': 'x',
        'type': 'object',
        'properties': {
            'a': {
                'type': 'string'
            }
        }
    });
    expect(propertiesNoAlt.parseProperty('x', Joi.object({ a: Joi.string() }), null, false, false)).to.equal({
        'name': 'x',
        'type': 'object',
        'properties': {
            'a': {
                'type': 'string'
            }
        }
    });
    done();

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

    lab.test('parse structure with child labels', (done) => {

        //console.log(JSON.stringify( propertiesNoAlt.parseProperty(null, deepStructure, null, false, false)  ));

        expect(propertiesNoAlt.parseProperty(null, deepStructure, null, false, false)).to.equal({
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
                            ],
                            'required': true
                        }
                    }
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
                            'required': true,
                            'minimum': 5,
                            'maximum': 10
                        }
                    }
                }
            }
        });
        done();
    });



    lab.test('parse structure with child description, notes, name etc', (done) => {

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

        Helper.createServer({}, routes, (err, server) => {

            server.inject({ url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
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
                done();
            });
        });


    });
});
