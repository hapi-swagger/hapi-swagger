'use strict';
const Code = require('code');
const Joi = require('joi');
const Lab = require('lab');
const Hoek = require('hoek');
const Helper = require('../test/helper.js');
const Defaults = require('../lib/defaults.js');
const Properties = require('../lib/properties.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();
const propertiesAlt = new Properties( Defaults );
const propertiesNoAlt = new Properties( Hoek.clone(Defaults).xProperties = false );


lab.experiment('property - ', () => {

    lab.test('parse types', (done) => {

        expect(propertiesNoAlt.parseProperty('x', Joi.object())).to.equal({ 'type': 'object' });
        expect(propertiesNoAlt.parseProperty('x', Joi.string())).to.equal({ 'type': 'string' });
        expect(propertiesNoAlt.parseProperty('x', Joi.number())).to.equal({ 'type': 'number' });
        expect(propertiesNoAlt.parseProperty('x', Joi.boolean())).to.equal({ 'type': 'boolean' });
        expect(propertiesNoAlt.parseProperty('x', Joi.date())).to.equal({ 'type':'string','format':'date' });
        expect(propertiesNoAlt.parseProperty('x', Joi.binary())).to.equal({ 'type':'string','format':'binary' });
        expect(propertiesNoAlt.parseProperty('x', Joi.array())).to.equal({
            'type': 'array',
            'items': {
                'type': 'string'
            }
        });

        done();
    });


    lab.test('parse simple meta', (done) => {

        expect(propertiesNoAlt.parseProperty('x', Joi.string().description('this is bob') )).to.equal({ 'type': 'string', 'description': 'this is bob' });
        expect(propertiesAlt.parseProperty('x', Joi.string().example('bob') )).to.equal({ 'type': 'string', 'x-example': 'bob' });

        done();
    });


    lab.test('parse meta', (done) => {

        // TODO add all meta data properties
        expect(propertiesAlt.parseProperty('x', Joi.string().meta({ 'x': 'y' }))).to.equal({ 'type': 'string', 'x-meta': { 'x': 'y' } });
        expect(propertiesNoAlt.parseProperty('x', Joi.string().forbidden())).to.equal(undefined);
        expect(propertiesNoAlt.parseProperty('x', Joi.string().valid(['a', 'b']))).to.equal({ type: 'string', enum: ['a', 'b'] });
        expect(propertiesNoAlt.parseProperty('x', Joi.string().valid(['a', 'b', '']))).to.equal({ type: 'string', enum: ['a', 'b'] });
        expect(propertiesNoAlt.parseProperty('x', Joi.string().valid(['a', 'b', null]))).to.equal({ type: 'string', enum: ['a', 'b'] });
        expect(propertiesNoAlt.parseProperty('x', Joi.date().timestamp().default(() => Date.now(), 'Current Timestamp')).default).to.exist();
        //console.log(JSON.stringify(propertiesAlt.parseProperty('x',Joi.date().timestamp().default(() => Date.now(), 'Current Timestamp'))));

        done();
    });



    lab.test('parse type string', (done) => {

        expect(propertiesNoAlt.parseProperty('x', Joi.string())).to.equal({ 'type': 'string' });
        expect(propertiesNoAlt.parseProperty('x', Joi.string().min(5))).to.equal({ 'type': 'string', 'minimum': 5 });
        expect(propertiesNoAlt.parseProperty('x', Joi.string().max(10))).to.equal({ 'type': 'string', 'maximum': 10 });

        expect(propertiesAlt.parseProperty('x', Joi.string().length(20,'utf8'))).to.equal({ 'type': 'string', 'x-constraint': { 'length': 20 } });
        //expect(propertiesNoAlt.parseProperty('x', Joi.string().insensitive())).to.equal({ 'type': 'string', 'x-constraint': { 'insensitive': true } });

        expect(propertiesAlt.parseProperty('x', Joi.string().creditCard())).to.equal({ 'type': 'string', 'x-format': { 'creditCard': true } });
        expect(propertiesAlt.parseProperty('x', Joi.string().alphanum())).to.equal({ 'type': 'string', 'x-format': { 'alphanum': true } });
        expect(propertiesAlt.parseProperty('x', Joi.string().token())).to.equal({ 'type': 'string', 'x-format': { 'token': true } });

        expect(propertiesAlt.parseProperty('x', Joi.string().email({
            errorLevel: 256,
            tldWhitelist:['example.com'],
            minDomainAtoms:2
        }))).to.equal({ 'type': 'string', 'x-format': {
            'email': {
                'errorLevel': 256,
                'tldWhitelist': [
                    'example.com'
                ],
                'minDomainAtoms': 2
            }
        } });

        expect(propertiesAlt.parseProperty('x', Joi.string().ip({
            version: [
                'ipv4',
                'ipv6'
            ],
            cidr: 'required'
        }))).to.equal({ 'type': 'string', 'x-format': {
            'ip': {
                'version': [
                    'ipv4',
                    'ipv6'
                ],
                'cidr': 'required'
            }
        } });

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

        expect(propertiesAlt.parseProperty('x', Joi.string().guid())).to.equal({ 'type': 'string', 'x-format': { 'guid': true } });
        expect(propertiesAlt.parseProperty('x', Joi.string().hex())).to.equal({ 'type': 'string', 'x-format': { 'hex': true } });
        expect(propertiesAlt.parseProperty('x', Joi.string().guid())).to.equal({ 'type': 'string', 'x-format': { 'guid': true } });
        expect(propertiesAlt.parseProperty('x', Joi.string().hostname())).to.equal({ 'type': 'string', 'x-format': { 'hostname': true } });
        expect(propertiesAlt.parseProperty('x', Joi.string().isoDate())).to.equal({ 'type': 'string', 'x-format': { 'isoDate': true } });

        expect(propertiesAlt.parseProperty('x', Joi.string().lowercase())).to.equal({ 'type': 'string', 'x-convert': { 'lowercase': true } });
        expect(propertiesAlt.parseProperty('x', Joi.string().uppercase())).to.equal({ 'type': 'string', 'x-convert': { 'uppercase': true } });
        expect(propertiesAlt.parseProperty('x', Joi.string().trim())).to.equal({ 'type': 'string', 'x-convert': { 'trim': true } });


        // test options.xProperties = false
        expect(propertiesNoAlt.parseProperty('x', Joi.string().lowercase())).to.equal({ 'type': 'string' });

        done();
    });


    lab.test('parse type date', (done) => {

        expect(propertiesNoAlt.parseProperty('x', Joi.date())).to.equal({ 'type': 'string', 'format': 'date' });

        /*  not yet 'x',
        date.min(date)
        date.max(date)
        date.format(format)
        date.iso()
        */
        done();
    });


    lab.test('parse type number', (done) => {

        // mapped direct to openapi
        expect(propertiesNoAlt.parseProperty('x', Joi.number().integer())).to.equal({ 'type': 'integer' });
        expect(propertiesNoAlt.parseProperty('x', Joi.number().min(5))).to.equal({ 'type': 'number', 'minimum': 5 });
        expect(propertiesNoAlt.parseProperty('x', Joi.number().max(10))).to.equal({ 'type': 'number', 'maximum': 10 });

        // x-* mappings
        expect(propertiesAlt.parseProperty('x', Joi.number().greater(10))).to.equal({ 'type': 'number', 'x-constraint': { 'greater': 10 } });
        expect(propertiesAlt.parseProperty('x', Joi.number().less(10))).to.equal({ 'type': 'number', 'x-constraint': { 'less': 10 } });
        expect(propertiesAlt.parseProperty('x', Joi.number().precision(2))).to.equal({ 'type': 'number', 'x-constraint': { 'precision': 2 } });
        expect(propertiesAlt.parseProperty('x', Joi.number().multiple(2))).to.equal({ 'type': 'number', 'x-constraint': { 'multiple': 2 } });
        expect(propertiesAlt.parseProperty('x', Joi.number().positive())).to.equal({ 'type': 'number', 'x-constraint': { 'positive': true } });
        expect(propertiesAlt.parseProperty('x', Joi.number().negative())).to.equal({ 'type': 'number', 'x-constraint': { 'negative': true } });

        // test options.xProperties = false
        expect(propertiesNoAlt.parseProperty('x', Joi.number().greater(10))).to.equal({ 'type': 'number' });

        done();
    });


    lab.test('parse type array', (done) => {


        // basic child types
        expect(propertiesNoAlt.parseProperty('x', Joi.array())).to.equal({ 'type': 'array', 'items': { 'type': 'string' } });
        expect(propertiesNoAlt.parseProperty('x', Joi.array().items())).to.equal({ 'type': 'array', 'items': { 'type': 'string' } });
        expect(propertiesNoAlt.parseProperty('x', Joi.array().items(Joi.object()))).to.equal({ 'type': 'array', 'items': { 'type': 'string' } });
        expect(propertiesNoAlt.parseProperty('x', Joi.array().items(Joi.string()))).to.equal({ 'type': 'array', 'items': { 'type': 'string' } });
        expect(propertiesNoAlt.parseProperty('x', Joi.array().items(Joi.number()))).to.equal({ 'type': 'array', 'items': { 'type': 'number' } });
        expect(propertiesNoAlt.parseProperty('x', Joi.array().items(Joi.boolean()))).to.equal({ 'type': 'array', 'items': { 'type': 'boolean' } });
        expect(propertiesNoAlt.parseProperty('x', Joi.array().items(Joi.date()))).to.equal({ 'type': 'array', 'items': { 'type': 'string', 'format': 'date' } });
        expect(propertiesNoAlt.parseProperty('x', Joi.array().items(Joi.binary()))).to.equal({ 'type': 'array', 'items': { 'type': 'string', 'format': 'binary' } });

        expect(propertiesNoAlt.parseProperty('x', Joi.array().items({ 'text': Joi.string() }), {}, {}, 'formData')).to.equal({
            'type': 'array',
            'items': {
                '$ref': '#/definitions/x'
            },
            'collectionFormat': 'multi'
        });
        expect(propertiesNoAlt.parseProperty('x', Joi.array().items(Joi.object({ 'text': Joi.string() })), {}, {}, 'formData')).to.equal({
            'type': 'array',
            'items': {
                '$ref': '#/definitions/x'
            },
            'collectionFormat': 'multi'
        });
        expect(propertiesNoAlt.parseProperty('x', Joi.array().items(Joi.object({ 'text': Joi.string() })), {}, {}, 'query')).to.equal({
            'type': 'array',
            'items': {
                '$ref': '#/definitions/x'
            },
            'collectionFormat': 'multi'
        });


        // mapped direct to openapi
        expect(propertiesNoAlt.parseProperty('x', Joi.array().min(5))).to.equal({ 'type': 'array', 'items': { 'type': 'string' }, 'minItems': 5 });
        expect(propertiesNoAlt.parseProperty('x', Joi.array().max(10))).to.equal({ 'type': 'array', 'items': { 'type': 'string' }, 'maxItems': 10 });

        // x-* mappings
        expect(propertiesAlt.parseProperty('x', Joi.array().sparse())).to.equal({ 'type': 'array', 'items': { 'type': 'string' }, 'x-constraint': { 'sparse': true } });
        expect(propertiesAlt.parseProperty('x', Joi.array().single())).to.equal({ 'type': 'array', 'items': { 'type': 'string' }, 'x-constraint': { 'single': true } });
        expect(propertiesAlt.parseProperty('x', Joi.array().length(2))).to.equal({ 'type': 'array', 'items': { 'type': 'string' }, 'x-constraint': { 'length': 2 } });
        expect(propertiesAlt.parseProperty('x', Joi.array().unique())).to.equal({ 'type': 'array', 'items': { 'type': 'string' }, 'x-constraint': { 'unique': true } });

        // test options.xProperties = false
        expect(propertiesNoAlt.parseProperty('x', Joi.array().sparse())).to.equal({ 'type': 'array', 'items': { 'type': 'string' } });

        done();

    });
});


lab.test('parse type object', (done) => {


    expect(propertiesNoAlt.parseProperty('x', Joi.object() )).to.equal({ 'type': 'object' });


    let definitions = {};
    // test both path and definition structure from two type of object creation
    expect(propertiesNoAlt.parseProperty('x', Joi.object().keys({ a: Joi.string() }), definitions, {}, 'formData')).to.equal({
        'name': 'x',
        'schema': {
            '$ref': '#/definitions/x'
        },
        'type': 'object'
    });
    expect(definitions).to.equal({
        'x': {
            'properties': {
                'a': {
                    'type': 'string'
                }
            },
            'type': 'object'
        }
    });

    expect(propertiesNoAlt.parseProperty('x', Joi.object({ a: Joi.string() }), definitions, {}, 'formData')).to.equal({
        'name': 'x',
        'schema': {
            '$ref': '#/definitions/x'
        },
        'type': 'object'
    });
    expect(definitions).to.equal({
        'x': {
            'properties': {
                'a': {
                    'type': 'string'
                }
            },
            'type': 'object'
        }
    });



    done();

});


lab.experiment('property deep - ', () => {

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


    //console.log(JSON.stringify( propertiesNoAlt.parseProperties( deepStructure, {}, {}, null, false ) ));

    lab.test('parse structure with child labels', (done) => {

        expect(propertiesNoAlt.parseProperties( deepStructure, {}, {}, null, false ) ).to.equal({
            'outer1': {
                'type': 'object',
                'name': 'outer1',
                'schema': {
                    '$ref': '#/definitions/outer1'
                }
            },
            'outer2': {
                'type': 'object',
                'name': 'outer2',
                'schema': {
                    '$ref': '#/definitions/outer2'
                }
            }
        });
        done();
    });



    lab.test('parse structure with child description, notes, name etc', (done) => {


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
