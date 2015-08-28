/*
Mocha test
Tests the different way basePath and protocol can be set
*/

var Chai          = require('chai'),
    Hapi          = require('hapi'),
    Joi           = require('joi'),
    Inert         = require('inert'),
    Vision        = require('vision'),
    HapiSwagger   = require('../lib/index.js'),
    assert        = Chai.assert;


var defaultHandler = function (request, response) {
  reply('ok');
};


describe('basePath', function () {

  var pluginConfig = {
    register: HapiSwagger,
    options: {
      basePath: 'http://testhost'
    }
  };

  var requestOptions = {
    method: 'GET',
    url: '/docs?path=test',
    headers: {
      host: 'localhost'
    }
  };

  var server;

  var initServer = function (hapiSwaggerConfig, done) {
    server = new Hapi.Server();
    server.connection();
    server.route({
      method: 'GET',
      path: '/test',
      handler: defaultHandler,
      config: {
        tags: ['api']
      }
    });
    server.register([Inert, Vision, hapiSwaggerConfig], function (err) {
      server.start(function (err) {
        assert.ifError(err);
        done();
      });
    });
  };

  afterEach(function (done) {
    server.stop(function () {
      server = null;
      done();
    });
  });

  describe('basePath option', function () {
    before(function (done) {
      pluginConfig.options = {
        basePath: 'http://testhost'
      };
      initServer(pluginConfig, done);
    });

    it('should use the basePath option if specified', function (done) {
      server.inject(requestOptions, function (response) {
        assert.equal(response.result.basePath, pluginConfig.options.basePath);
        done();
      });
    });
  });

  describe('protocol option', function () {
    before(function (done) {
      pluginConfig.options = {
        basePath: 'http://testhost',
        protocol: 'https'
      };
      initServer(pluginConfig, done);
    });

    it('should use the protocol option if specified', function (done) {
      var expectedBasePath = [
        pluginConfig.options.protocol,
        '://',
        pluginConfig.options.basePath.replace(/http:\/\//, '')
      ].join('');

      server.inject(requestOptions, function (response) {
        assert.equal(response.result.basePath, expectedBasePath);
        done();
      });
    });
  });

  describe('request host', function () {

    before(function (done) {
      pluginConfig.options = {};
      initServer(pluginConfig, done);
    });

    it('should use the request.headers.host if no basePath specified', function (done) {
      requestOptions.headers = {
        host: 'testtwo'
      };

      server.inject(requestOptions, function (response) {
        var expectedBasePath = [
          'http://',
          requestOptions.headers.host
        ].join('');
        assert.equal(response.result.basePath, expectedBasePath);
        done();
      });
    });
  });

  describe('proxy forwarded host', function () {

    before(function (done) {
      pluginConfig.options = {};
      initServer(pluginConfig, done);
    });

    it('should use the x-forwarded-host if no basePath specified', function (done) {
      requestOptions.headers = {
        host: 'testtwo',
        'x-forwarded-host': 'proxyhost'
      };

      server.inject(requestOptions, function (response) {
        var expectedBasePath = [
          'http://',
          requestOptions.headers['x-forwarded-host']
        ].join('');
        assert.equal(response.result.basePath, expectedBasePath);
        done();
      });
    });
  });

  describe('proxy forwarded proto', function () {

    before(function (done) {
      pluginConfig.options = {};
      initServer(pluginConfig, done);
    });

    it('should use the request.headers.x-forwarded-proto if no protocol specified', function (done) {
      requestOptions.headers = {
        'x-forwarded-host': 'proxyhost',
        'x-forwarded-proto': 'https'
      };

      server.inject(requestOptions, function (response) {
        var expectedBasePath = [
          requestOptions.headers['x-forwarded-proto'],
          '://',
          requestOptions.headers['x-forwarded-host']
        ].join('');

        assert.equal(response.result.basePath, expectedBasePath);
        done();
      });
    });
  });

  describe('endpoint', function () {

    before(function (done) {
      pluginConfig.options = {};
      initServer(pluginConfig, done);
    });

    it('should still set the proper endpoint', function (done) {
      requestOptions.headers = {
        'x-forwarded-host': 'proxyhost',
        'x-forwarded-proto': 'https'
      };
      requestOptions.url = '/docs';

      server.inject(requestOptions, function (response) {
        var expectedBasePath = [
          requestOptions.headers['x-forwarded-proto'],
          '://',
          requestOptions.headers['x-forwarded-host'],
          '/docs?path='
        ].join('');

        assert.equal(response.result.basePath, expectedBasePath);
        done();
      });
    });
  });
});
