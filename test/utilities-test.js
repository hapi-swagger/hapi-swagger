'use strict';
const Code = require('code');
const Joi = require('joi');
const Lab = require('lab');
const Helper = require('../test/helper.js');
const Utilities = require('../lib/utilities.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();



lab.experiment('utilities', () => {


    lab.test('isObject', (done) => {

        expect(Utilities.isObject(function () { })).to.equal(false);
        expect(Utilities.isObject({})).to.equal(true);
        expect(Utilities.isObject(Joi.object())).to.equal(true);
        expect(Utilities.isObject(null)).to.equal(false);
        expect(Utilities.isObject(undefined)).to.equal(false);
        expect(Utilities.isObject([])).to.equal(false);
        expect(Utilities.isObject('string')).to.equal(false);
        expect(Utilities.isObject(5)).to.equal(false);
        done();
    });


    lab.test('isFunction', (done) => {

        expect(Utilities.isFunction(function () { })).to.equal(true);
        expect(Utilities.isFunction({})).to.equal(false);
        expect(Utilities.isFunction(Joi.object())).to.equal(false);
        expect(Utilities.isFunction(null)).to.equal(false);
        expect(Utilities.isFunction(undefined)).to.equal(false);
        expect(Utilities.isFunction([])).to.equal(false);
        expect(Utilities.isFunction('string')).to.equal(false);
        expect(Utilities.isFunction(5)).to.equal(false);
        done();
    });


    lab.test('hasProperties', (done) => {

        expect(Utilities.hasProperties({})).to.equal(false);
        expect(Utilities.hasProperties({ 'name': 'test' })).to.equal(true);
        expect(Utilities.hasProperties( Helper.objWithNoOwnProperty() )).to.equal(false);
        done();
    });


    lab.test('deleteEmptyProperties', (done) => {

        //console.log( JSON.stringify(Utilities.deleteEmptyProperties(objWithNoOwnProperty())) );
        expect(Utilities.deleteEmptyProperties({})).to.equal({});
        expect(Utilities.deleteEmptyProperties({ 'name': 'test' })).to.equal({ 'name': 'test' });
        expect(Utilities.deleteEmptyProperties({ 'name': null })).to.equal({});
        expect(Utilities.deleteEmptyProperties({ 'name': undefined })).to.equal({});
        expect(Utilities.deleteEmptyProperties({ 'name': [] })).to.equal({});
        // this needs JSON.stringify to compare outputs
        expect( JSON.stringify(Utilities.deleteEmptyProperties( Helper.objWithNoOwnProperty() ))).to.equal('{}');
        done();
    });


    lab.test('first', (done) => {

        expect(Utilities.first({})).to.equal(undefined);
        expect(Utilities.first('test')).to.equal(undefined);
        expect(Utilities.first([])).to.equal(undefined);
        expect(Utilities.first(['test'])).to.equal('test');
        expect(Utilities.first(['one','two'])).to.equal('one');
        done();
    });


    lab.test('isJoi', (done) => {

        expect(Utilities.isJoi({})).to.equal(false);
        expect(Utilities.isJoi(Joi.object())).to.equal(true);
        expect(Utilities.isJoi(Joi.object({
            id: Joi.string()
        }))).to.equal(true);
        done();
    });


    lab.test('hasJoiChildren', (done) => {

        expect(Utilities.hasJoiChildren({})).to.equal(false);
        expect(Utilities.hasJoiChildren(Joi.object())).to.equal(false);
        expect(Utilities.hasJoiChildren(Joi.object({
            id: Joi.string()
        }))).to.equal(true);
        done();
    });


    lab.test('hasJoiMeta', (done) => {

        expect(Utilities.hasJoiMeta({})).to.equal(false);
        expect(Utilities.hasJoiMeta(Joi.object())).to.equal(true);
        expect(Utilities.hasJoiMeta(Joi.object().meta({ 'test': 'test' }))).to.equal(true);
        done();
    });


    lab.test('getJoiMetaProperty', (done) => {

        expect(Utilities.getJoiMetaProperty({}, 'test')).to.equal(undefined);
        expect(Utilities.getJoiMetaProperty(Joi.object(), 'test')).to.equal(undefined);
        expect(Utilities.getJoiMetaProperty(Joi.object().meta({ 'test': 'test' }), 'test')).to.equal('test');
        expect(Utilities.getJoiMetaProperty(Joi.object().meta({ 'test': 'test' }), 'nomatch')).to.equal(undefined);
        done();
    });


    lab.test('toTitleCase', (done) => {

        expect(Utilities.toTitleCase('test')).to.equal('Test');
        expect(Utilities.toTitleCase('tesT')).to.equal('Test');
        done();
    });


    lab.test('createId', (done) => {

        expect(Utilities.createId('PUT', 'v1/sum/add/{a}/{b}')).to.equal('putV1SumAddAB');
        expect(Utilities.createId('PUT', 'sum')).to.equal('putSum');
        done();
    });


    lab.test('replaceInPath', (done) => {

        const pathReplacements = [{
            replaceIn: 'all',
            pattern: /v([0-9]+)\//,
            replacement: ''
        },{
            replaceIn: 'groups',
            pattern: /[.].*$/,
            replacement: ''
        }];

        expect(Utilities.replaceInPath('api/v1/users', ['endpoints'], pathReplacements)).to.equal('api/users');
        expect(Utilities.replaceInPath('api/v2/users', ['groups'], pathReplacements)).to.equal('api/users');
        expect(Utilities.replaceInPath('api/users.get', ['groups'], pathReplacements)).to.equal('api/users');
        expect(Utilities.replaceInPath('api/users.search', ['groups'], pathReplacements)).to.equal('api/users');
        done();
    });




});
