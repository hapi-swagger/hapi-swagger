'use strict';
var Code = require('code'),
    Joi = require('joi'),
    Lab = require('lab');

var Helper = require('../test/helper.js'),
    Utilities = require('../lib/utilities.js');

var expect = Code.expect,
    lab = exports.lab = Lab.script();



lab.experiment('utilities', function () {


    lab.test('isObject', function (done) {

        expect(Utilities.isObject({})).to.equal(true);
        expect(Utilities.isObject(Joi.object())).to.equal(true);
        expect(Utilities.isObject(null)).to.equal(false);
        expect(Utilities.isObject(undefined)).to.equal(false);
        expect(Utilities.isObject([])).to.equal(false);
        expect(Utilities.isObject('string')).to.equal(false);
        expect(Utilities.isObject(5)).to.equal(false);
        done();
    });

    lab.test('hasProperties', function (done) {

        expect(Utilities.hasProperties({})).to.equal(false);
        expect(Utilities.hasProperties({ 'name': 'test' })).to.equal(true);
        expect(Utilities.hasProperties( Helper.objWithNoOwnProperty() )).to.equal(false);
        done();
    });


    lab.test('deleteEmptyProperties', function (done) {

        //console.log( JSON.stringify(Utilities.deleteEmptyProperties(objWithNoOwnProperty())) );
        expect(Utilities.deleteEmptyProperties({})).to.deep.equal({});
        expect(Utilities.deleteEmptyProperties({ 'name': 'test' })).to.deep.equal({ 'name': 'test' });
        expect(Utilities.deleteEmptyProperties({ 'name': null })).to.deep.equal({});
        expect(Utilities.deleteEmptyProperties({ 'name': undefined })).to.deep.equal({});
        expect(Utilities.deleteEmptyProperties({ 'name': [] })).to.deep.equal({});
        // this needs JSON.stringify to compare outputs
        expect( JSON.stringify(Utilities.deleteEmptyProperties( Helper.objWithNoOwnProperty() ))).to.equal('{}');
        done();
    });


    lab.test('first', function (done) {

        expect(Utilities.first({})).to.equal(undefined);
        expect(Utilities.first('test')).to.equal(undefined);
        expect(Utilities.first([])).to.equal(undefined);
        expect(Utilities.first(['test'])).to.equal('test');
        expect(Utilities.first(['one','two'])).to.equal('one');
        done();
    });


    lab.test('isJoi', function (done) {

        expect(Utilities.isJoi({})).to.equal(false);
        expect(Utilities.isJoi(Joi.object())).to.equal(true);
        expect(Utilities.isJoi(Joi.object({
            id: Joi.string()
        }))).to.equal(true);
        done();
    });


    lab.test('hasJoiChildren', function (done) {

        expect(Utilities.hasJoiChildren({})).to.equal(false);
        expect(Utilities.hasJoiChildren(Joi.object())).to.equal(false);
        expect(Utilities.hasJoiChildren(Joi.object({
            id: Joi.string()
        }))).to.equal(true);
        done();
    });


    lab.test('hasJoiMeta', function (done) {

        expect(Utilities.hasJoiMeta({})).to.equal(false);
        expect(Utilities.hasJoiMeta(Joi.object())).to.equal(true);
        expect(Utilities.hasJoiMeta(Joi.object().meta({ 'test': 'test' }))).to.equal(true);
        done();
    });


    lab.test('getJoiMetaProperty', function (done) {

        expect(Utilities.getJoiMetaProperty({}, 'test')).to.equal(undefined);
        expect(Utilities.getJoiMetaProperty(Joi.object(), 'test')).to.equal(undefined);
        expect(Utilities.getJoiMetaProperty(Joi.object().meta({ 'test': 'test' }), 'test')).to.equal('test');
        expect(Utilities.getJoiMetaProperty(Joi.object().meta({ 'test': 'test' }), 'nomatch')).to.equal(undefined);
        done();
    });



});
