var Lab             = require('lab'),
    Code            = require('code'),
    Utilities          = require('../lib/utilities.js');

var lab     = exports.lab = Lab.script(),
    expect  = Code.expect;



lab.experiment('utilities', function () {

    lab.test('hasProperties', function (done) {
        expect(Utilities.hasProperties({})).to.equal(false);
        expect(Utilities.hasProperties({'name': 'test'})).to.equal(true);
        
        // create an object with properties that do count as obj.hasOwnProperty(key)
        var triangle = {a:1, b:2, c:3};
        function ATriangle() {}
        ATriangle.prototype = triangle;
        var obj = new ATriangle();
        expect(Utilities.hasProperties(obj)).to.equal(false);
        
        
        done();
    });
    
});