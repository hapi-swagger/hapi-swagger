const Code = require('code');
const Lab = require('lab');
const Helper = require('../helper.js');
const Validate = require('../../lib/validate.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();



lab.experiment('tags', () => {

    const routes = [{
        method: 'GET',
        path: '/test',
        handler: Helper.defaultHandler,
        config: {
            tags: ['api']
        }
    }];


    lab.test('no tag objects passed', async() => {

        const server = await Helper.createServer({}, routes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
        expect(response.result.tags).to.equal([]);
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });


    lab.test('name property passed', async() => {

        const swaggerOptions = {
            tags: [{
                'name': 'test'
            }]
        };

        const server = await Helper.createServer(swaggerOptions, routes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
        expect(response.result.tags[0].name).to.equal('test');

        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });


    lab.test('full tag object', async() => {

        const swaggerOptions = {
            tags: [{
                'name': 'test',
                'description': 'Everything about test',
                'externalDocs': {
                    'description': 'Find out more',
                    'url': 'http://swagger.io'
                }
            }]
        };

        const server = await Helper.createServer(swaggerOptions, routes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });

        expect(response.statusCode).to.equal(200);
        expect(response.result.tags).to.equal(swaggerOptions.tags);
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });

});
