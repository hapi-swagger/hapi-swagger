const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Helper = require('../helper.js');
const Validate = require('../../lib/v2/validate.js');
const Http2 = require('http2');
const Fs = require('fs').promises;
const Path = require('path');

const expect = Code.expect;
const lab = (exports.lab = Lab.script());

lab.experiment('http2', () => {
  const requestOptions = {
    method: 'GET',
    url: '/swagger.json',
    headers: {
      referrer: 'https://localhost:12345'
    }
  };

  const routes = {
    method: 'GET',
    path: '/test',
    handler: Helper.defaultHandler,
    options: {
      tags: ['api']
    }
  };

  lab.test('gets correct host', async () => {
    const [key, cert] = await Promise.all([
      await Fs.readFile(Path.join(__dirname, '../certs/server.key')),
      await Fs.readFile(Path.join(__dirname, '../certs/server.crt'))
    ]);
    const tls = {
      key,
      cert
    };
    const url = new URL(requestOptions.headers.referrer);
    const options = {
      tls,
      listener: Http2.createSecureServer({ ...tls }),
      port: url.port
    };
    const server = await Helper.createServer({}, routes, options);
    const response = await server.inject({ ...requestOptions });
    expect(response.result.host).to.equal(new URL(requestOptions.headers.referrer).host);
    const isValid = await Validate.test(response.result);
    expect(isValid).to.be.true();
  });
});
