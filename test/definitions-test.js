var Lab             = require('lab'),
    Code            = require('code'),
    Joi            	= require('joi'),
	Helper          = require('../test/helper.js');

var lab     = exports.lab = Lab.script(),
    expect  = Code.expect;



lab.experiment('definitions', function () {
    
    var routes = [{
		method: 'POST',
		path: '/test/',
		config: {
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
	}];
        
    
    lab.test('payload with inline definition', function (done) {
        
        Helper.createServer( {}, routes, function(err, server){
            expect(err).to.equal(null);
			
			var defination = {
                    "properties": {
                        "a": {
                            "description": "the first number",
                            "type": "number"
                        },
                        "b": {
                            "description": "the second number",
                            "type": "number"
                        },
                        "operator": {
                            "description": "the opertator i.e. + - / or *",
                            "default": "+",
                            "type": "string"
                        },
                        "equals": {
                            "description": "the result of the sum",
                            "type": "number"
                        }
                    },
                    "required": [
                        "a",
                        "b",
                        "operator",
                        "equals"
                    ],
                    "type": "object"
                }
            
            server.inject({method: 'GET', url: '/swagger.json'}, function(response) {
               // console.log(JSON.stringify(response.result.paths['/test/'].post.parameters[0].schem));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/test/'].post.parameters[0].schema).to.deep.equal({
                            "$ref": "#/definitions/test_payload"
                        });
                expect(response.result.definitions.test_payload).to.deep.equal(defination);
                done();
            });
            
        });
    });
    
    

    
    
    

});





function countProperties( obj ){
    return Object.keys(obj).length;
}