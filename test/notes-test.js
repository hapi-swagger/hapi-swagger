/*
Mocha test
The test was built on Tue Dec 24 2013 13:38:00
*/

var chai = require('chai'),
   assert = chai.assert,
   swagger = require('../lib/index.js');

var internals = swagger._internals;

var testNotes = [
    'test blah blah blah',
    'ResponseClass: stuff',
    'Error Status Codes:',
    '400, Bad Request',
    '404, Element not found'];

var testNotesStr = 'test string';

describe('isNotes test', function() {

it('processErrorcodes', function() {
    var res = internals.processErrorStatusCodes( testNotes.slice(3, 5) );
    assert.equal( res.length, 2);
    assert.property( res[0], 'code' );
    assert.equal( res[0].code, 400 );
    assert.property( res[0], 'message' );
    assert.equal( res[0].message, 'Bad Request' );
    assert.property( res[1], 'code' );
    assert.equal( res[1].code, 404 );
    assert.property( res[1], 'message' );
    assert.equal( res[1].message, 'Element not found' );

});

it('processNotesSingle', function(){
    var res = internals.getResponseMessages( testNotesStr );
    assert.equal(res.notes.length, 1);
    assert.equal(res.notes[0], testNotesStr);
});

it('processNotes', function(){
    var res = internals.getResponseMessages( testNotes );
    console.log(res);
    assert.property(res, 'notes' );
    assert.equal(res.notes[0], testNotes[0]);
    assert.property(res, 'notesExtra' );
    assert.property(res.notesExtra, 'responseMessages' );
    assert.property(res.notesExtra, 'responseClass' );
    assert.equal(res.notesExtra.responseClass, 'stuff' );
    var resMsg = res.notesExtra.responseMessages;
    assert.property( resMsg[0], 'code' );
    assert.equal( resMsg[0].code, 400 );
    assert.property( resMsg[0], 'message' );
    assert.equal( resMsg[0].message, 'Bad Request' );
    assert.property( resMsg[1], 'code' );
    assert.equal( resMsg[1].code, 404 );
    assert.property( resMsg[1], 'message' );
    assert.equal( resMsg[1].message, 'Element not found' );

});

});
