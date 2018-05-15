const Code = require('code');
const Lab = require('lab');
const Helper = require('../helper.js');
const Validate = require('../../lib/validate.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();



lab.experiment('info', () => {

    const routes = [{
        method: 'GET',
        path: '/test',
        handler: Helper.defaultHandler,
        config: {
            tags: ['api']
        }
    }];


    lab.test('no info object passed', async() => {

        const server = await Helper.createServer({}, routes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
        expect(response.result.info).to.equal({ 'title': 'API documentation', 'version': '0.0.1' });
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });


    lab.test('no info title property passed', async() => {

        const swaggerOptions = {
            info: {}
        };

        const server = await Helper.createServer(swaggerOptions, routes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
        expect(response.result.info).to.equal({ 'title': 'API documentation', 'version': '0.0.1' });
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });



    lab.test('min valid info object', async() => {

        const swaggerOptions = {
            info: {
                'title': 'test title for lab',
                'version': '0.0.1'
            }
        };

        const server = await Helper.createServer(swaggerOptions, routes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
        expect(response.result.info).to.equal(swaggerOptions.info);
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });


    lab.test('full info object', async() => {

        const swaggerOptions = {
            info: {
                'title': 'Swagger Petstore',
                'description': 'This is a sample server Petstore server.',
                'version': '1.0.0',
                'termsOfService': 'http://swagger.io/terms/',
                'contact': {
                    'email': 'apiteam@swagger.io'
                },
                'license': {
                    'name': 'Apache 2.0',
                    'url': 'http://www.apache.org/licenses/LICENSE-2.0.html'
                }
            }
        };

        const server = await Helper.createServer(swaggerOptions, routes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
        expect(response.result.info).to.equal(swaggerOptions.info);
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });

    lab.test('info object with custom properties', async() => {

        const swaggerOptions = {
            info: {
                'title': 'test title for lab',
                'version': '0.0.1',
                'x-custom': 'custom'
            }
        };

        const server = await Helper.createServer(swaggerOptions, routes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
        expect(response.result.info).to.equal(swaggerOptions.info);

    });


});
