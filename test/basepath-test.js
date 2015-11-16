/*
Mocha test
Tests the different way basePath and protocol can be set
*/

var Lab             = require('lab'),
    Code            = require('code'),
    Joi            	= require('joi'),
	  Helper          = require('../test/helper.js');

var lab     = exports.lab = Lab.script(),
    expect  = Code.expect;





lab.experiment('basePath', function () {

  var requestOptions = {
    method: 'GET',
    url: '/swagger.json',
    headers: {
      host: 'localhost'
    }
  };
  
  var routes = {
      method: 'GET',
      path: '/test',
      handler: Helper.defaultHandler,
      config: {
        tags: ['api']
      }
    };



  lab.test('basePath option', function (done) {
          
      Helper.createServer( {basePath: '/v2'}, routes, function(err, server){
          server.inject(requestOptions, function(response) {
            expect(err).to.equal(null);
              //console.log(JSON.stringify(response.result));
              expect(response.statusCode).to.equal(200);
              done();
          });
          
      });
  });
    




  /*



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
  
  */
  
});
