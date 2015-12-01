var Lab             = require('lab'),
    Code            = require('code'),
    Joi             = require('joi'),
    Helper          = require('../test/helper.js'),
    Properties      = require('../lib/properties.js');

var lab     = exports.lab = Lab.script(),
    expect  = Code.expect;
    
    
 // console.log(JSON.stringify(   Properties.parseProperty('x',Joi.array().items({'count': Joi.number()}) )    ));
  
  
  // TODO
  // joiToSwaggerDefiniation
  // joiToSwaggerParameters
  // parseProperties
  
  
  
  
    lab.experiment('property - ', function () {  
    
        lab.test('parse types', function (done) {
            expect( Properties.parseProperty('x',Joi.string())).to.deep.equal( {'type':'string'} );
            expect( Properties.parseProperty('x',Joi.number())).to.deep.equal( {'type':'number'} );
            expect( Properties.parseProperty('x',Joi.array())).to.deep.equal( {'type':'array'} );
        
            done();
        });
        
        
        lab.test('parse type number', function (done) {
            expect( Properties.parseProperty('x',Joi.number().integer())).to.deep.equal( {'type':'integer'} );
            expect( Properties.parseProperty('x',Joi.number().min(5))).to.deep.equal( {'type':'number', 'minimum': 5} );
            expect( Properties.parseProperty('x',Joi.number().max(10))).to.deep.equal( {'type':'number', 'maximum': 10} );
            
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
        
        
        lab.test('parse type array', function (done) {
            
            expect( Properties.parseProperty('x',Joi.array().items({'count': Joi.number()}) ) ).to.deep.equal( {'type':'array','items':{'$ref':'#/definitions/x'}} );
            expect( Properties.parseProperty('x',Joi.array().min(5))).to.deep.equal( {'type':'array', 'minItems': 5} );
            expect( Properties.parseProperty('x',Joi.array().max(10))).to.deep.equal( {'type':'array', 'maxItems': 10} );
            
            
            /*  not yet 'x',
            array.sparse(enabled)
            array.single(enabled)
            array.items(type)
            array.ordered(type)
            array.length(limit)
            array.unique()
            */
            
            done();
            
        });
        
    
            
        lab.test('parse deep structure with children', function (done) {
            var deepStructure = Joi.object({
                outer1: Joi.object({
                    inner1: Joi.string()
                }),
                outer2: Joi.object({
                    inner2: Joi.string()
                })
                }).description('body description').notes(['body notes']);
            
            var deepStructureJSON = {
                    'type': 'object',
                    'description': 'body description',
                    'notes': [
                        'body notes'
                    ],
                    'name': 'x',
                    'properties': {
                        'outer1': {
                            'type': 'object',
                            'name': 'outer1',
                            'properties': {
                                'inner1': {
                                    'type': 'string'
                                }
                            }
                        },
                        'outer2': {
                            'type': 'object',
                            'name': 'outer2',
                            'properties': {
                                'inner2': {
                                    'type': 'string'
                                }
                            }
                        }
                    }
                };
    
            expect( Properties.parseProperty( 'x', deepStructure)).to.deep.equal( deepStructureJSON );
            done();
        });
    
    
    
        lab.test('parse deep structure with child description, notes, name etc', function (done) {
            var deepStructure = Joi.object({
                outer1: Joi.object({
                    inner1: Joi.string()
                        .description('child description')
                        .notes(['child notes'])
                        .tags(['child','api'])
                        .required()
                }),
                outer2: Joi.object({
                    inner2: Joi.number()
                        .description('child description')
                        .notes(['child notes'])
                        .tags(['child','api'])
                        .min(5)
                        .max(10)
                        .required()
                })
            });
                
            
            var deepStructureJSON = {
                    'type': 'object',
                    'name': 'x',
                    'properties': {
                        'outer1': {
                            'type': 'object',
                            'name': 'outer1',
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
                            'type': 'object',
                            'name': 'outer2',
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
                };
    
            expect( Properties.parseProperty( 'x', deepStructure)).to.deep.equal( deepStructureJSON );
            done();
        });
        
        
    
    
    
        lab.test('parse description', function (done) {
            expect( Properties.parseProperty('x',Joi.string().description('text description')) ).to.deep.equal( {'type':'string', 'description': 'text description' } );
            done();
        });
        
        
        lab.test('parse notes', function (done) {
            expect( Properties.parseProperty('x',Joi.string().notes('text notes')) ).to.deep.equal( {'type':'string', 'notes': ['text notes'] } );
            expect( Properties.parseProperty('x',Joi.string().notes(['text notes','text notes'])) ).to.deep.equal( {'type':'string', 'notes': ['text notes','text notes'] } );
            done();
        });
        
        
        lab.test('parse tags', function (done) {
            expect( Properties.parseProperty('x',Joi.string().tags(['api','v2'])) ).to.deep.equal( {'type':'string', 'tags': ['api','v2'] } );
            done();
        });
        
        
        lab.test('parse valid', function (done) {
            expect( Properties.parseProperty('x',Joi.string().valid('decimal', 'binary') ) ).to.deep.equal( {'type':'string','enum':['decimal','binary']} );
            done();
        });
        
        
        lab.test('parse required', function (done) {
            expect( Properties.parseProperty('x', Joi.string().required() ) ).to.deep.equal( {'type':'string','required':true} );
            done();
        });
        
        
        lab.test('parse optional', function (done) {
            expect( Properties.parseProperty('x',Joi.string().optional() ) ).to.deep.equal( {'type':'string'} );
            done();
        });
        
        
        lab.test('parse example', function (done) {
            expect( Properties.parseProperty('x',Joi.string().example('example value') ) ).to.deep.equal( {'type':'string','example': 'example value'} );
            done();
        });
        
        
        lab.test('parse default', function (done) {
            expect( Properties.parseProperty('x',Joi.string().valid('decimal', 'binary').default('decimal') ) ).to.deep.equal( {'type':'string','enum':['decimal','binary'],'default':'decimal'} );
            done();
        });
    
  
  
  
        lab.test('joiToSwaggerDefiniation', function (done) {
            
           var joiStructure = Joi.object({
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
            
            //console.log(JSON.stringify(   Properties.joiToSwaggerDefiniation(joiStructure, {})    ));
            
            var structureJSON = {
                'a': {
                    'type': 'number',
                    'description': 'the first number',
                    'required': true
                },
                'b': {
                    'type': 'number',
                    'description': 'the second number',
                    'required': true
                },
                'operator': {
                    'type': 'string',
                    'description': 'the opertator i.e. + - / or *',
                    'required': true,
                    'default': '+'
                },
                'equals': {
                    'type': 'number',
                    'description': 'the result of the sum',
                    'required': true
                }
            }
            
            expect( Properties.joiToSwaggerDefiniation(joiStructure,'query') ).to.deep.equal( structureJSON );
            done();
   
        });
        
        
        lab.test('joiToSwaggerParameters', function (done) {
            
            var joiStructure = Joi.object({
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
            
            //console.log(JSON.stringify(   Properties.joiToSwaggerParameters(joiStructure , 'query')    ));
            
            var structureJSON = [
                {
                    "type": "number",
                    "description": "the first number",
                    "required": true,
                    "name": "a",
                    "in": "query"
                },
                {
                    "type": "number",
                    "description": "the second number",
                    "required": true,
                    "name": "b",
                    "in": "query"
                },
                {
                    "type": "string",
                    "description": "the opertator i.e. + - / or *",
                    "required": true,
                    'default': '+',
                    "name": "operator",
                    "in": "query"
                },
                {
                    "type": "number",
                    "description": "the result of the sum",
                    "required": true,
                    "name": "equals",
                    "in": "query"
                }
            ]
            
            expect( Properties.joiToSwaggerParameters(joiStructure,'query') ).to.deep.equal( structureJSON );
            done();
        });
        
        

  
  
    
    });


