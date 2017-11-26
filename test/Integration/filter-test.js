const Code = require('code');
const Lab = require('lab');
const Helper = require('../helper.js');
const Validate = require('../../lib/validate.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();



lab.experiment('filter', () => {

    const routes = [{
        method: 'GET',
        path: '/actors',
        handler: Helper.defaultHandler,
        config: {
            tags: ['api']
        }
    }, {
        method: 'GET',
        path: '/movies',
        handler: Helper.defaultHandler,
        config: {
            tags: ['api', 'a']
        }
    }, {
        method: 'GET',
        path: '/movies/movie',
        handler: Helper.defaultHandler,
        config: {
            tags: ['api', 'b', 'a']
        }
    }, {
        method: 'GET',
        path: '/movies/movie/director',
        handler: Helper.defaultHandler,
        config: {
            tags: ['api', 'a']
        }
    },{
        method: 'GET',
        path: '/movies/movie/actor',
        handler: Helper.defaultHandler,
        config: {
            tags: ['api', 'c']
        }
    }, {
        method: 'GET',
        path: '/movies/movie/actors',
        handler: Helper.defaultHandler,
        config: {
            tags: ['api', 'd']
        }
    }];


    lab.test('filter by tags=a', async() => {

        const server = await Helper.createServer({}, routes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json?tags=a' });

        expect(response.statusCode).to.equal(200);
        expect(response.result.paths).to.have.length(3);
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });


    lab.test('filter by tags=a,b,c,d', async() => {

        const server = await Helper.createServer({}, routes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json?tags=a,b,c,d' });

        expect(response.statusCode).to.equal(200);
        expect(response.result.paths).to.have.length(5);
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });


    lab.test('filter by tags=a,c', async() => {

        const server = await Helper.createServer({}, routes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json?tags=a,c' });

        //console.log(JSON.stringify(response.result.paths));
        expect(response.statusCode).to.equal(200);
        expect(response.result.paths).to.have.length(4);
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });


    lab.test('filter by tags=a,-b', async() => {

        const server = await Helper.createServer({}, routes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json?tags=a,-b' });

        //console.log(JSON.stringify(response.result.paths));
        expect(response.statusCode).to.equal(200);
        expect(response.result.paths).to.have.length(2);
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });


    lab.test('filter by tags=a,+b', async() => {

        const server = await Helper.createServer({}, routes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json?tags=a,%2Bb' });
        // note %2B is a '+' plus char url encoded
        expect(response.statusCode).to.equal(200);
        expect(response.result.paths).to.have.length(1);
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });


    lab.test('filter by tags=a,+c', async() => {

        const server = await Helper.createServer({}, routes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json?tags=a,%2Bc' });

        // note %2B is a '+' plus char url encoded

        //console.log(JSON.stringify(response.result.paths));
        expect(response.statusCode).to.equal(200);
        expect(response.result.paths).to.have.length(0);
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });


    lab.test('filter by tags=x', async() => {

        const server = await Helper.createServer({}, routes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json?tags=x' });

        expect(response.statusCode).to.equal(200);
        expect(response.result.paths).to.have.length(0);
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });


});
