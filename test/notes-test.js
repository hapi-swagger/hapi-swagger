/*
Mocha test
Tests that note array is broken up correctly
*/

var chai = require('chai'),
   assert = chai.assert,
   swagger = require('../lib/index.js');

var internals = swagger._internals;

var testNotes1 = [
        'This is a note about this API endpoint',
        'This is more stuff about this API endpoint',
        'Error Status Codes',
        '400, Bad Request',
        '404, Sum not found'
    ],
    testNotes2 = [
        'This is a note about this API endpoint'
    ],
    testNotes3 = 'This is a note about this API endpoint',
    testNotes4 = [
        'This is a note about this API endpoint',
        'This is more stuff about this API endpoint',
        'Error status codes:',
        '400, Bad Request',
        '404, Sum not found'
    ]



describe('notes complex array test', function() {

    var obj =   internals.getResponseMessages( testNotes1 ),
                responseMessages = obj.responseMessages,
                notes = obj.notes;


    it('notes has <br/><br/> injected', function() {
        assert.equal( notes, 'This is a note about this API endpoint<br/><br/>This is more stuff about this API endpoint' );
    });

    it('responseMessages has 2 objects', function() {
        assert.equal( responseMessages.length, 2 );
    });

    it('responseMessages has code', function() {
        assert.equal( responseMessages[0].code, 400 );
    });

    it('responseMessages has message', function() {
        assert.equal( responseMessages[0].message, 'Bad Request' );
    });

    it('responseMessages has code', function() {
        assert.equal( responseMessages[1].code, 404 );
    });

    it('responseMessages has message', function() {
        assert.equal( responseMessages[1].message, 'Sum not found' );
    });

});



describe('notes simple array test', function() {

    var obj =   internals.getResponseMessages( testNotes2 ),
                responseMessages = obj.responseMessages,
                notes = obj.notes;

    it('notes has no <br/>', function() {
        assert.equal( notes, 'This is a note about this API endpoint' );
    });

    it('responseMessages is an empty array', function() {
        assert.equal( responseMessages.length, 0 );
    });

});



describe('notes string test', function() {

    var obj =   internals.getResponseMessages( testNotes3 ),
                responseMessages = obj.responseMessages,
                notes = obj.notes;

    it('notes contains string', function() {
        assert.equal( notes, 'This is a note about this API endpoint' );
    });

    it('responseMessages is an empty array', function() {
        assert.equal( responseMessages.length, 0 );
    });

});

describe('notes mixed case detection test', function() {

    var obj =   internals.getResponseMessages( testNotes4 ),
                responseMessages = obj.responseMessages,
                notes = obj.notes;

    it('responseMessages has 2 objects', function() {
        assert.equal( responseMessages.length, 2 );
    });

});




