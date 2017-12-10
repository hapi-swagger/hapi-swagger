
const Code = require('code');
const Joi = require('joi');
const Lab = require('lab');
const Helper = require('../helper.js');
const Utilities = require('../../lib/utilities.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();



lab.experiment('utilities', () => {


    lab.test('isObject', () => {

        expect(Utilities.isObject(function () { })).to.equal(false);
        expect(Utilities.isObject({})).to.equal(true);
        expect(Utilities.isObject(Joi.object())).to.equal(true);
        expect(Utilities.isObject(null)).to.equal(false);
        expect(Utilities.isObject(undefined)).to.equal(false);
        expect(Utilities.isObject([])).to.equal(false);
        expect(Utilities.isObject('string')).to.equal(false);
        expect(Utilities.isObject(5)).to.equal(false);
    });


    lab.test('isFunction', () => {

        expect(Utilities.isFunction(function () { })).to.equal(true);
        expect(Utilities.isFunction({})).to.equal(false);
        expect(Utilities.isFunction(Joi.object())).to.equal(false);
        expect(Utilities.isFunction(null)).to.equal(false);
        expect(Utilities.isFunction(undefined)).to.equal(false);
        expect(Utilities.isFunction([])).to.equal(false);
        expect(Utilities.isFunction('string')).to.equal(false);
        expect(Utilities.isFunction(5)).to.equal(false);
    });


    lab.test('isRegex', () => {

        expect(Utilities.isRegex(undefined)).to.equal(false);
        expect(Utilities.isRegex(null)).to.equal(false);
        expect(Utilities.isRegex(false)).to.equal(false);
        expect(Utilities.isRegex(true)).to.equal(false);
        expect(Utilities.isRegex(42)).to.equal(false);
        expect(Utilities.isRegex('string')).to.equal(false);
        expect(Utilities.isRegex(function () { })).to.equal(false);
        expect(Utilities.isRegex([])).to.equal(false);
        expect(Utilities.isRegex({})).to.equal(false);

        expect(Utilities.isRegex(/a/g)).to.equal(true);
        expect(Utilities.isRegex(new RegExp('a', 'g'))).to.equal(true);
    });


    lab.test('hasProperties', () => {

        expect(Utilities.hasProperties({})).to.equal(false);
        expect(Utilities.hasProperties({ 'name': 'test' })).to.equal(true);
        expect(Utilities.hasProperties(Helper.objWithNoOwnProperty())).to.equal(false);
    });


    lab.test('deleteEmptyProperties', () => {

        //console.log( JSON.stringify(Utilities.deleteEmptyProperties(objWithNoOwnProperty())) );
        expect(Utilities.deleteEmptyProperties({})).to.equal({});
        expect(Utilities.deleteEmptyProperties({ 'name': 'test' })).to.equal({ 'name': 'test' });
        expect(Utilities.deleteEmptyProperties({ 'name': null })).to.equal({});
        expect(Utilities.deleteEmptyProperties({ 'name': undefined })).to.equal({});
        expect(Utilities.deleteEmptyProperties({ 'name': [] })).to.equal({});
        expect(Utilities.deleteEmptyProperties({ 'name': {} })).to.equal({});

        expect(Utilities.deleteEmptyProperties({ 'example': [], default: [] })).to.equal({ 'example': [], default: [] });
        expect(Utilities.deleteEmptyProperties({ 'example': {}, default: {} })).to.equal({ 'example': {}, default: {} });
        // this needs JSON.stringify to compare outputs
        expect(JSON.stringify(Utilities.deleteEmptyProperties(Helper.objWithNoOwnProperty()))).to.equal('{}');
    });


    lab.test('first', () => {

        expect(Utilities.first({})).to.equal(undefined);
        expect(Utilities.first('test')).to.equal(undefined);
        expect(Utilities.first([])).to.equal(undefined);
        expect(Utilities.first(['test'])).to.equal('test');
        expect(Utilities.first(['one', 'two'])).to.equal('one');
    });


    lab.test('hasKey', () => {

        expect(Utilities.hasKey({}, 'x')).to.equal(false);
        expect(Utilities.hasKey([], 'x')).to.equal(false);
        expect(Utilities.hasKey(null, 'x')).to.equal(false);
        expect(Utilities.hasKey(undefined, 'x')).to.equal(false);

        expect(Utilities.hasKey({ x: 1 }, 'x')).to.equal(true);
        expect(Utilities.hasKey({ a: { x: 1 } }, 'x')).to.equal(true);
        expect(Utilities.hasKey({ a: { b: { x: 1 } } }, 'x')).to.equal(true);
        expect(Utilities.hasKey({ x: 1, z: 2 }, 'x')).to.equal(true);
        expect(Utilities.hasKey({ xx: 1 }, 'x')).to.equal(false);

        expect(Utilities.hasKey([{ x: 1 }], 'x')).to.equal(true);
        expect(Utilities.hasKey({ a: [{ x: 1 }] }, 'x')).to.equal(true);


        expect(Utilities.hasKey(Helper.objWithNoOwnProperty(), 'x')).to.equal(false);
        expect(Utilities.hasKey({ a: {} }, 'x')).to.equal(false);

    });


    lab.test('findAndRenameKey', () => {

        expect(Utilities.findAndRenameKey({}, 'x', 'y')).to.equal({});
        expect(Utilities.findAndRenameKey([], 'x', 'y')).to.equal([]);
        expect(Utilities.findAndRenameKey(null, 'x', 'y')).to.equal(null);
        expect(Utilities.findAndRenameKey(undefined, 'x', 'y')).to.equal(undefined);

        expect(Utilities.findAndRenameKey({ x: 1 }, 'x', 'y')).to.equal({ y: 1 });
        expect(Utilities.findAndRenameKey({ a: { x: 1 } }, 'x', 'y')).to.equal({ a: { y: 1 } });
        expect(Utilities.findAndRenameKey({ a: { b: { x: 1 } } }, 'x', 'y')).to.equal({ a: { b: { y: 1 } } });
        expect(Utilities.findAndRenameKey({ x: 1, z: 2 }, 'x', 'y')).to.equal({ y: 1, z: 2 });
        expect(Utilities.findAndRenameKey({ xx: 1 }, 'x', 'y')).to.equal({ xx: 1 });

        expect(Utilities.findAndRenameKey([{ x: 1 }], 'x', 'y')).to.equal([{ y: 1 }]);
        expect(Utilities.findAndRenameKey({ a: [{ x: 1 }] }, 'x', 'y')).to.equal({ a: [{ y: 1 }] });


        expect(Utilities.findAndRenameKey({ x: 1 }, 'x', null)).to.equal({});
        expect(Utilities.findAndRenameKey({ x: 1, z: 2 }, 'x', null)).to.equal({ z: 2 });


        expect(Utilities.findAndRenameKey(Helper.objWithNoOwnProperty(), 'x', 'y')).to.equal({});

    });


    lab.test('replaceValue', () => {

        expect(Utilities.replaceValue(['a','b'], 'a', 'c')).to.equal(['b','c']);
        expect(Utilities.replaceValue(['a','b'], null, null)).to.equal(['a','b']);
        expect(Utilities.replaceValue(['a','b'], 'a', null)).to.equal(['a','b']);
        expect(Utilities.replaceValue(null, null, null)).to.equal(null);
        expect(Utilities.replaceValue()).to.equal(undefined);

    });


    lab.test('removeProps', () => {

        expect(Utilities.removeProps({ 'a': 1, 'b': 2 }, ['a'])).to.equal({ 'a': 1 });
        expect(Utilities.removeProps({ 'a': 1, 'b': 2 }, ['a', 'b'])).to.equal({ 'a': 1, 'b': 2 });
        expect(Utilities.removeProps({ 'a': 1, 'b': 2 }, ['c'])).to.equal({});
        expect(Utilities.removeProps(Helper.objWithNoOwnProperty(), ['b'])).to.equal({});

    });


    lab.test('isJoi', () => {

        expect(Utilities.isJoi({})).to.equal(false);
        expect(Utilities.isJoi(Joi.object())).to.equal(true);
        expect(Utilities.isJoi(Joi.object({
            id: Joi.string()
        }))).to.equal(true);
    });


    lab.test('hasJoiChildren', () => {

        expect(Utilities.hasJoiChildren({})).to.equal(false);
        expect(Utilities.hasJoiChildren(Joi.object())).to.equal(false);
        expect(Utilities.hasJoiChildren(Joi.object({
            id: Joi.string()
        }))).to.equal(true);
    });


    lab.test('toJoiObject', () => {

        expect(Utilities.toJoiObject({}).isJoi).to.equal(true);
        expect(Utilities.toJoiObject(Joi.object()).isJoi).to.equal(true);
    });


    lab.test('hasJoiMeta', () => {

        expect(Utilities.hasJoiMeta({})).to.equal(false);
        expect(Utilities.hasJoiMeta(Joi.object())).to.equal(true);
        expect(Utilities.hasJoiMeta(Joi.object().meta({ 'test': 'test' }))).to.equal(true);
    });


    lab.test('getJoiMetaProperty', () => {

        expect(Utilities.getJoiMetaProperty({}, 'test')).to.equal(undefined);
        expect(Utilities.getJoiMetaProperty(Joi.object(), 'test')).to.equal(undefined);
        expect(Utilities.getJoiMetaProperty(Joi.object().meta({ 'test': 'test' }), 'test')).to.equal('test');
        expect(Utilities.getJoiMetaProperty(Joi.object().meta({ 'test': 'test' }), 'nomatch')).to.equal(undefined);
    });


    lab.test('toTitleCase', () => {

        expect(Utilities.toTitleCase('test')).to.equal('Test');
        expect(Utilities.toTitleCase('tesT')).to.equal('Test');
    });


    lab.test('createId', () => {

        expect(Utilities.createId('PUT', 'v1/sum/add/{a}/{b}')).to.equal('putV1SumAddAB');
        expect(Utilities.createId('PUT', 'sum')).to.equal('putSum');
    });


    lab.test('replaceInPath', () => {

        const pathReplacements = [{
            replaceIn: 'all',
            pattern: /v([0-9]+)\//,
            replacement: ''
        }, {
            replaceIn: 'groups',
            pattern: /[.].*$/,
            replacement: ''
        }];

        expect(Utilities.replaceInPath('api/v1/users', ['endpoints'], pathReplacements)).to.equal('api/users');
        expect(Utilities.replaceInPath('api/v2/users', ['groups'], pathReplacements)).to.equal('api/users');
        expect(Utilities.replaceInPath('api/users.get', ['groups'], pathReplacements)).to.equal('api/users');
        expect(Utilities.replaceInPath('api/users.search', ['groups'], pathReplacements)).to.equal('api/users');
    });




});

