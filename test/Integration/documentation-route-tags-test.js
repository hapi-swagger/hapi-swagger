const Code = require('code');
const Lab = require('lab');
const Helper = require('../helper.js');
const Validate = require('../../lib/validate.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();


lab.experiment('documentation-route-tags', () => {

    const routes = [{
        method: 'GET',
        path: '/test',
        handler: Helper.defaultHandler,
        config: {
            tags: ['api']
        }
    }];

    const testServer = async (swaggerOptions, tagName) => {
        const server = await Helper.createServer(swaggerOptions, routes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });

        const table = server.table();
        table.forEach(route => {
            switch (route.path) {
                case '/test':
                    break;
                case '/swagger.json':
                case '/swaggerui/extend.js':
                case '/swaggerui/{path*}':
                    expect(route.settings.tags).to.equal(tagName);
                    break;
                default:
                    break;
            }
        });

        expect(response.statusCode).to.equal(200);
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();
    };

    lab.test('no documentationRouteTags property passed', async() => {
        await testServer({}, []);
    });

    lab.test('documentationRouteTags property passed', async() => {
        const swaggerOptions = {
            documentationRouteTags: ['no-logging']
        };
        await testServer(swaggerOptions, swaggerOptions.documentationRouteTags);
    });

    lab.test('multiple documentationRouteTags passed', async() => {
        const swaggerOptions = {
            documentationRouteTags: ['hello', 'world']
        };
        await testServer(swaggerOptions, swaggerOptions.documentationRouteTags);
    });
});
