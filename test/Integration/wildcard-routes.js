const Code = require('code');
const Lab = require('lab');
const Helper = require('../helper.js');
const Validate = require('../../lib/validate.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();



lab.experiment('wildcard routes', () => {

    lab.test('method *', async() => {

        const routes = {
            method: '*',
            path: '/test',
            handler: Helper.defaultHandler,
            config: {
                tags: ['api'],
                notes: 'test'
            }
        };

        const server = await Helper.createServer({}, routes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });

        expect(response.statusCode).to.equal(200);
        expect(response.result.paths['/test']).to.have.length(5);
        expect(response.result.paths['/test']).to.include('get');
        expect(response.result.paths['/test']).to.include('post');
        expect(response.result.paths['/test']).to.include('put');
        expect(response.result.paths['/test']).to.include('patch');
        expect(response.result.paths['/test']).to.include('delete');

    });


    lab.test('method array [GET, POST]', async() => {

        const routes = {
            method: ['GET', 'POST'],
            path: '/test',
            handler: Helper.defaultHandler,
            config: {
                tags: ['api'],
                notes: 'test'
            }
        };

        const server = await Helper.createServer({}, routes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });

        expect(response.statusCode).to.equal(200);
        expect(response.result.paths['/test']).to.have.length(2);
        expect(response.result.paths['/test']).to.include('get');
        expect(response.result.paths['/test']).to.include('post');
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });

});
