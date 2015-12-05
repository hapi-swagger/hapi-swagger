'use strict';
var Code = require('code'),
    Lab = require('lab');

var Utilities = require('../lib/utilities.js');

var expect = Code.expect,
    lab = exports.lab = Lab.script();



lab.experiment('utilities', function () {

    lab.test('hasProperties', function (done) {

        expect(Utilities.hasProperties({})).to.equal(false);
        expect(Utilities.hasProperties({ 'name': 'test' })).to.equal(true);

        // create an object with properties that do count as obj.hasOwnProperty(key)
        var triangle = { a: 1, b: 2, c: 3 };
        var ATriangle = function (){

        };
        ATriangle.prototype = triangle;
        var obj = new ATriangle();
        expect(Utilities.hasProperties(obj)).to.equal(false);
        done();
    });

});
