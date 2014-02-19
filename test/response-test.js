/*
Mocha test
The test was built on Tue Dec 24 2013 13:38:00
*/

var chai = require('chai'),
   assert = chai.assert,
   swagger = require('../lib/index.js');

var internals = swagger._internals;

var test1 = [{name: 'test1', required: true, type: 'string'},
    {name: 'test2', required: false, type: 'string'},
    {name: 'test3', required: true, type: 'number'}]

describe('conversion test)', function() {

it('test default', function(){
    var res = internals.hapi2Swag(test1, []);
      assert.equal( Object.keys(res.properties).length, test1.length );
      assert.property(res.properties, 'test1');
      assert.property(res.properties, 'test2');
      assert.property(res.properties, 'test3');
});

it('test filter', function(){
    var res = internals.hapi2Swag(test1, ['test2']);
      assert.equal( Object.keys(res.properties).length, test1.length - 1 );
      assert.notProperty(res.properties, 'test2');
});

});
