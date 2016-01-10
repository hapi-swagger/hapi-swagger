'use strict';
const Code = require('code');
const Joi = require('joi');
const Lab = require('lab');
const Helper = require('../test/helper.js');
const Properties = require('../lib/properties.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();




lab.experiment('property - ', () => {

    lab.test('parse types', (done) => {

        expect(Properties.parseProperty('x', Joi.string())).to.deep.equal({ 'type': 'string' });
        expect(Properties.parseProperty('x', Joi.number())).to.deep.equal({ 'type': 'number' });
        expect(Properties.parseProperty('x', Joi.boolean())).to.deep.equal({ 'type': 'boolean' });
        expect(Properties.parseProperty('x', Joi.date())).to.deep.equal({ 'type':'string','format':'date' });
        expect(Properties.parseProperty('x', Joi.binary())).to.deep.equal({ 'type':'string','format':'binary' });
        expect(Properties.parseProperty('x', Joi.array())).to.deep.equal({
            'type': 'array',
            'items': {
                'type': 'string'
            }
        });

        done();
    });



    lab.test('parse type string', (done) => {

        expect(Properties.parseProperty('x', Joi.string())).to.deep.equal({ 'type': 'string' });

        /*  not yet 'x',
        string.insensitive()
        string.min(limit, [encoding])
        string.max(limit, [encoding])
        string.creditCard()
        string.length(limit, [encoding])
        string.regex(pattern, [name])
        string.replace(pattern, replacement)
        string.alphanum()
        string.token()
        string.email([options])
        string.ip([options])
        string.uri([options])
        string.guid()
        string.hex()
        string.hostname()
        string.lowercase()
        string.uppercase()
        string.trim()
        string.isoDate()
        */
        done();
    });


    lab.test('parse type date', (done) => {

        expect(Properties.parseProperty('x', Joi.date())).to.deep.equal({ 'type': 'string', 'format': 'date' });

        /*  not yet 'x',
        date.min(date)
        date.max(date)
        date.format(format)
        date.iso()
        */
        done();
    });


    lab.test('parse type number', (done) => {

        expect(Properties.parseProperty('x', Joi.number().integer())).to.deep.equal({ 'type': 'integer' });
        expect(Properties.parseProperty('x', Joi.number().min(5))).to.deep.equal({ 'type': 'number', 'minimum': 5 });
        expect(Properties.parseProperty('x', Joi.number().max(10))).to.deep.equal({ 'type': 'number', 'maximum': 10 });

        /*  not yet 'x',
        expect( Properties.parseProperty('x',Joi.number().greater(10))).to.deep.equal( {'type':'number'} );
        expect( Properties.parseProperty('x',Joi.number().less(10))).to.deep.equal( {'type':'number'} );
        expect( Properties.parseProperty('x',Joi.number().integer())).to.deep.equal( {'type':'integer'} );
        expect( Properties.parseProperty('x',Joi.number().precision(2))).to.deep.equal( {'type':'number'} );
        expect( Properties.parseProperty('x',Joi.number().multiple(2))).to.deep.equal( {'type':'number'} );
        expect( Properties.parseProperty('x',Joi.number().positive())).to.deep.equal( {'type':'number'} );
        expect( Properties.parseProperty('x',Joi.number().negative())).to.deep.equal( {'type':'number'} );
        */
        done();
    });


    lab.test('parse type array', (done) => {


        // basic child types
        expect(Properties.parseProperty('x', Joi.array())).to.deep.equal({ 'type': 'array', 'items': { 'type': 'string' } });
        expect(Properties.parseProperty('x', Joi.array().items())).to.deep.equal({ 'type': 'array', 'items': { 'type': 'string' } });
        expect(Properties.parseProperty('x', Joi.array().items(Joi.string()))).to.deep.equal({ 'type': 'array', 'items': { 'type': 'string' } });
        expect(Properties.parseProperty('x', Joi.array().items(Joi.number()))).to.deep.equal({ 'type': 'array', 'items': { 'type': 'number' } });
        expect(Properties.parseProperty('x', Joi.array().items(Joi.boolean()))).to.deep.equal({ 'type': 'array', 'items': { 'type': 'boolean' } });
        expect(Properties.parseProperty('x', Joi.array().items(Joi.date()))).to.deep.equal({ 'type': 'array', 'items': { 'type': 'string', 'format': 'date' } });
        expect(Properties.parseProperty('x', Joi.array().items(Joi.binary()))).to.deep.equal({ 'type': 'array', 'items': { 'type': 'string', 'format': 'binary' } });

        // complex child types
        expect(Properties.parseProperty('x', Joi.array().items({ 'text': Joi.string() }), {}, 'formData')).to.deep.equal({
            'type': 'array',
            'items': {
                '$ref': '#/definitions/x'
            },
            'collectionFormat': 'multi'
        });
        expect(Properties.parseProperty('x', Joi.array().items(Joi.object({ 'text': Joi.string() })), {}, 'formData')).to.deep.equal({
            'type': 'array',
            'items': {
                '$ref': '#/definitions/x'
            },
            'collectionFormat': 'multi'
        });
        expect(Properties.parseProperty('x', Joi.array().items(Joi.object({ 'text': Joi.string() })), {}, 'query')).to.deep.equal({
            'type': 'array',
            'items': {
                '$ref': '#/definitions/x'
            },
            'collectionFormat': 'multi'
        });


        // expect(Properties.parseProperty('x', Joi.array().items({ 'count': Joi.number() }))).to.deep.equal({ 'type': 'array', 'items': { '$ref': '#/definitions/x' } });
        expect(Properties.parseProperty('x', Joi.array().min(5))).to.deep.equal({ 'type': 'array', 'items': { 'type': 'string' }, 'minItems': 5 });
        expect(Properties.parseProperty('x', Joi.array().max(10))).to.deep.equal({ 'type': 'array', 'items': { 'type': 'string' }, 'maxItems': 10 });

        /*  not yet 'x-',
        array.sparse(enabled)
        array.single(enabled)
        array.ordered(type)
        array.length(limit)
        array.unique()
        */

        done();
    });


    lab.test('parse type object', (done) => {

        //console.log(JSON.stringify(Properties.parseProperty('x', Joi.object({ 'text': Joi.string() }), {}, [], 'formData' )));

        /* Change from inline to definiation objects
        expect(Properties.parseProperty('x', Joi.object({ 'text': Joi.string() }))).to.deep.equal({ 'type': 'object', 'name': 'x', 'properties': { 'text': { 'type': 'string' } } });
        expect(Properties.parseProperty('x', Joi.object().keys({ 'text': Joi.string() }))).to.deep.equal({ 'type': 'object', 'name': 'x', 'properties': { 'text': { 'type': 'string' } } });
        */
        expect(Properties.parseProperty('x', Joi.object({ 'text': Joi.string() }), {}, [], 'formData')).to.deep.equal({ 'type': 'object', 'name': 'x', 'schema': { '$ref': '#/definitions/x' } });
        expect(Properties.parseProperty('x', Joi.object().keys({ 'text': Joi.string() }), {}, [], 'formData')).to.deep.equal({ 'type': 'object', 'name': 'x', 'schema': { '$ref': '#/definitions/x' } });




        /*  not yet 'x-',
        {}
        object.min(limit)
        object.max(limit)
        object.length(limit)
        object.pattern(regex, schema)
        object.and(peers)
        object.nand(peers)
        object.or(peers)
        object.xor(peers)
        object.with(key, peers)
        object.without(key, peers)
        object.rename(from, to, [options])
        object.assert(ref, schema, [message])
        object.unknown([allow])
        object.type(constructor, [name])
        object.requiredKeys(children)
        object.optionalKeys(children)
        */

        done();
    });


    lab.test('parse description', (done) => {

        expect(Properties.parseProperty('x', Joi.string().description('text description'))).to.deep.equal({ 'type': 'string', 'description': 'text description' });
        done();
    });


    lab.test('parse notes', (done) => {

        expect(Properties.parseProperty('x', Joi.string().notes('text notes'))).to.deep.equal({ 'type': 'string', 'notes': ['text notes'] });
        expect(Properties.parseProperty('x', Joi.string().notes(['text notes', 'text notes']))).to.deep.equal({ 'type': 'string', 'notes': ['text notes', 'text notes'] });
        done();
    });


    lab.test('parse tags', (done) => {

        expect(Properties.parseProperty('x', Joi.string().tags(['api', 'v2']))).to.deep.equal({ 'type': 'string', 'tags': ['api', 'v2'] });
        done();
    });


    lab.test('parse allow', (done) => {

        expect(Properties.parseProperty('x', Joi.string().allow('decimal', 'binary'))).to.deep.equal({ 'type': 'string', 'enum': ['decimal', 'binary'] });
        expect(Properties.parseProperty('x', Joi.number().allow(1,2,3,4,5))).to.deep.equal({ 'type': 'number', 'enum': [1,2,3,4,5] });
        expect(Properties.parseProperty('x', Joi.string().allow('decimal', 'binary', ''))).to.deep.equal({ 'type': 'string', 'enum': ['decimal', 'binary'] });
        expect(Properties.parseProperty('x', Joi.string().allow(''))).to.deep.equal({ 'type': 'string' });

        //console.log(JSON.stringify(Properties.parseProperty('x', Joi.array().allow('a','b','c'), {}, 'query')))
        expect(Properties.parseProperty('x', Joi.array().allow('a', 'b', 'c'), {}, 'query')).to.deep.equal({
            'type': 'array',
            'enum': ['a', 'b', 'c'],
            'items': {
                'type': 'string'
            },
            'collectionFormat': 'multi'
        });
        done();
    });


    lab.test('parse valid', (done) => {

        expect(Properties.parseProperty('x', Joi.string().valid('decimal', 'binary'))).to.deep.equal({ 'type': 'string', 'enum': ['decimal', 'binary'] });
        expect(Properties.parseProperty('x', Joi.number().valid(1,2,3,4,5))).to.deep.equal({ 'type': 'number', 'enum': [1,2,3,4,5] });
        expect(Properties.parseProperty('x', Joi.string().valid('decimal', 'binary', ''))).to.deep.equal({ 'type': 'string', 'enum': ['decimal', 'binary'] });
        expect(Properties.parseProperty('x', Joi.string().valid(''))).to.deep.equal({ 'type': 'string' });
        done();
    });


    lab.test('parse required', (done) => {

        expect(Properties.parseProperty('x', Joi.string().required())).to.deep.equal({ 'type': 'string', 'required': true });
        done();
    });


    lab.test('parse optional', (done) => {

        expect(Properties.parseProperty('x', Joi.string().optional())).to.deep.equal({ 'type': 'string' });
        done();
    });


    lab.test('parse example', (done) => {

        expect(Properties.parseProperty('x', Joi.string().example('example value'))).to.deep.equal({ 'type': 'string', 'example': 'example value' });
        done();
    });


    lab.test('parse default', (done) => {

        // TODO x- the description ie any.default([value, [description]])
        expect(Properties.parseProperty('x', Joi.string().valid('decimal', 'binary').default('decimal'))).to.deep.equal({ 'type': 'string', 'enum': ['decimal', 'binary'], 'default': 'decimal' });
        done();
    });


    lab.test('parse forbidden', (done) => {

        expect(Properties.parseProperty('x', Joi.string().forbidden())).to.deep.equal(undefined);
        done();
    });


    lab.test('parse label', (done) => {

        // this example has both child object labels and array labels

        let definatition = {};
        const parsed = Properties.parseProperties(
            Joi.object().keys( {
                ans_list: Joi.array().items(
                    Joi.object().keys( {
                        v1: Joi.number(),
                        v2: Joi.number()
                    } ).label('ans-o')
                ).label('ans-l')
            } ).label('ans-parent'), definatition, 'query');

        const parsedExpected = {
            'ans-l': {
                type: 'array',
                items: {
                    '$ref': '#/definitions/ans-o'
                },
                collectionFormat: 'multi'
            }
        };
        const definatitionExpected = {
            'ans-o': {
                'type': 'object',
                'properties': {
                    'v1': {
                        'type': 'number'
                    },
                    'v2': {
                        'type': 'number'
                    }
                }
            }
        };

        expect(parsed).to.deep.equal(parsedExpected);
        expect(definatition).to.deep.equal(definatitionExpected);

        done();
    });


    /*  not yet 'x',
    any.invalid(value)
    any.strip()
    any.meta(meta)
    any.unit(name)
    any.options(options)
    any.strict(isStrict)
    any.concat(schema)
    any.when(ref, options)
    any.label(name)
    any.raw(isRaw)
    any.empty(schema)
    */


    lab.test('toParameters', (done) => {

        const joiStructure = Joi.object({
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
        });

        //console.log(JSON.stringify(   Properties.toParameters(joiStructure , 'query')    ));

        const structureJSON = [
            {
                'type': 'number',
                'description': 'the first number',
                'required': true,
                'name': 'a',
                'in': 'query'
            },
            {
                'type': 'number',
                'description': 'the second number',
                'required': true,
                'name': 'b',
                'in': 'query'
            },
            {
                'type': 'string',
                'description': 'the opertator i.e. + - / or *',
                'required': true,
                'default': '+',
                'name': 'operator',
                'in': 'query'
            },
            {
                'type': 'number',
                'description': 'the result of the sum',
                'required': true,
                'name': 'equals',
                'in': 'query'
            }
        ];

        expect(Properties.toParameters(joiStructure, {}, 'query')).to.deep.equal(structureJSON);
        done();
    });




});



lab.experiment('property deep - ', () => {

    const deepStructure = Joi.object({
        outer1: Joi.object({
            inner1: Joi.string()
                .description('child description')
                .notes(['child notes'])
                .tags(['child', 'api'])
                .required()
        }),
        outer2: Joi.object({
            inner2: Joi.number()
                .description('child description')
                .notes(['child notes'])
                .tags(['child', 'api'])
                .min(5)
                .max(10)
                .required()
        })
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
                expect(response.result.definitions.outer1).to.deep.equal({
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
