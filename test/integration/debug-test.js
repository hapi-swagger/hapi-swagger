const Joi = require('joi');
const Code = require('code');
const Lab = require('lab');
const Helper = require('../helper.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();


lab.experiment('debug', () => {

    const routesEmptyObjects = {
        method: 'POST',
        path: '/test/{id}',
        options: {
            handler: async () => { },
            tags: ['api'],
            validate: {
                headers: Joi.object(),
                params: Joi.object(),
                query: Joi.object(),
                payload: Joi.object()
            }
        }
    };


    let logs = [];
    lab.before(async() => {
        const server = await Helper.createServer({ 'debug': true }, routesEmptyObjects);
        server.events.on('log', (event, tags) => {
            if (tags.error) {
                logs.push(event);
            }
        });
        await server.inject({ method: 'GET', url: '/swagger.json' });

    });


    lab.test('log - Joi.object() with child properties', () => {
        expect(logs[0].data).to.equal('The /test/{id} route params parameter was set, but not as a Joi.object() with child properties');
        expect(logs[1].data).to.equal('The /test/{id} route headers parameter was set, but not as a Joi.object() with child properties');
        expect(logs[2].data).to.equal('The /test/{id} route query parameter was set, but not as a Joi.object() with child properties');

    });

});



lab.experiment('debug', () => {

    const routesFuncObjects = {
        method: 'POST',
        path: '/test/{id}',
        options: {
            handler: () => { },
            tags: ['api'],
            validate: {
                payload: async (value) => {
                    return value;
                },
                params: async (value) => {
                    return value;
                },
                query: async (value) => {
                    return value;
                },
                headers: async (value) => {
                    return value;
                }
            }
        }
    };


    let logs = [];
    lab.before(async() => {
        const server = await Helper.createServer({ 'debug': true }, routesFuncObjects);
        server.events.on('log', (event, tags) => {
            if (tags.error || tags.warning) {
                logs.push(event);
            }
        });

        await server.inject({ method: 'GET', url: '/swagger.json' });

    });


    lab.test('log - Joi.function for a query, header or payload ', () => {
        expect(logs[0].data).to.equal('Using a Joi.function for a query, header or payload is not supported.');
        expect(logs[1].data).to.equal('Using a Joi.function for a params is not supported and has been removed.');
        expect(logs[2].data).to.equal('Using a Joi.function for a query, header or payload is not supported.');
        expect(logs[3].data).to.equal('Using a Joi.function for a query, header or payload is not supported.');
    });

});



lab.experiment('debug', () => {

    const routesFuncObjects = {
        method: 'POST',
        path: '/test/{a}/{b?}',
        options: {
            handler: (request, reply) => { reply('ok'); },
            tags: ['api'],
            validate: {
                params: Joi.object({
                    a: Joi.string(),
                    b: Joi.string()
                })

            }
        }
    };


    let logs = [];
    lab.before(async() => {

        const server = await Helper.createServer({ 'debug': true }, routesFuncObjects);
        server.events.on('log', (event, tags) => {
            if (tags.warning) {
                logs.push(event);
            }
        });
        await server.inject({ method: 'GET', url: '/swagger.json' });

    });


    lab.test('log - optional parameters breaking validation of JSON', () => {
        expect(logs[0].data).to.equal('The /test/{a}/{b?} params parameter {b} is set as optional. This will work in the UI, but is invalid in the swagger spec');
    });


});


lab.test('debug page', async() => {

    const routes = {
        method: 'GET',
        path: '/test/',
        options: {
            handler: async () => { },
            tags: ['api']
        }
    };

    const server = await Helper.createServer({ 'debug': true }, routes);
    const response = await server.inject({ method: 'GET', url: '/documentation/debug' });
    expect(response.statusCode).to.equal(200);

});
