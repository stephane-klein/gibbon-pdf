const fs = require('fs');
const path = require('path');

const request = require('supertest');
const binaryParser = require('superagent-binary-parser');

const config = require('../src/config');
const createApp = require('../src/app');

config.set('port', 5001);
config.set('template_path', path.join(__dirname, 'fixtures'));

const app = createApp();

let server;

beforeAll(() => {
    server = app.listen(config.get('port'));
});
afterAll(() => {
    server.close();
});

describe('Route /v1/', () => {
    it('return 200', async () => {
        const response = await request(server).get('/v1/');
        expect(response.status).toEqual(200);
    });
});

describe('Route /v1/templates/', () => {
    it('return template list', async () => {
        return request(server)
            .get('/v1/templates/')
            .expect(200)
            .expect('Content-Type', /json/)
            .then(response => {
                expect(response.body).toStrictEqual([
                    'invalid-json',
                    'invoice',
                    'json-missing'
                ]);
            });
    });
});

describe('Route /v1/templates/:name', () => {
    it('return error when schema.json file is invalid', async () => {
        return request(server)
            .get('/v1/templates/invalid-json')
            .expect(500);
    });
    it('return error when schema.json file missing', async () => {
        return request(server)
            .get('/v1/templates/json-missing')
            .expect(404);
    });
    it('return schema.json', async () => {
        return request(server)
            .get('/v1/templates/invoice')
            .expect(200)
            .expect('Content-Type', /json/)
            .then(response => {
                expect(response.body.json_schema.type).toBe('object');
            });
    });
});

describe('Route /v1/templates/:name/html', () => {
    it('return error if template file missing', async () => {
        return request(server)
            .post('/v1/templates/invalid-json/html')
            .send({
                invoice_id: '123'
            })
            .expect(404);
    });
    it('return html content', async () => {
        return request(server)
            .post('/v1/templates/invoice/html')
            .send({
                invoice_id: '123'
            })
            .expect('Content-Type', /html/)
            .expect(200)
            .then(response => {
                expect(response.text).toContain(
                    'Invoice #: 123'
                );
            });
    });
    it('return english html content with lang body params', async () => {
        return request(server)
            .post('/v1/templates/invoice/html')
            .send({
                invoice_id: '123',
                lang: 'EN'
            })
            .expect('Content-Type', /html/)
            .expect(200)
            .then(response => {
                expect(response.text).toContain(
                    'Invoice #: 123'
                );
            });
    });
    it('return french html content lang body params', async () => {
        return request(server)
            .post('/v1/templates/invoice/html')
            .send({
                invoice_id: '123',
                lang: 'FR'
            })
            .expect('Content-Type', /html/)
            .expect(200)
            .then(response => {
                expect(response.text).toContain(
                    'Méthode de paiement'
                );
            });
    });
    it('return english html content with lang query params', async () => {
        return request(server)
            .post('/v1/templates/invoice/html?lang=EN')
            .send({
                invoice_id: '123'
            })
            .expect('Content-Type', /html/)
            .expect(200)
            .then(response => {
                expect(response.text).toContain(
                    'Invoice #: 123'
                );
            });
    });
    it('return french html content lang query params', async () => {
        return request(server)
            .post('/v1/templates/invoice/html?lang=FR')
            .send({
                invoice_id: '123'
            })
            .expect('Content-Type', /html/)
            .expect(200)
            .then(response => {
                expect(response.text).toContain(
                    'Méthode de paiement'
                );
            });
    });
});

describe('Route /v1/templates/:name/pdf', () => {
    it('Return pdf binary', async () => {
        return request(server)
            .post('/v1/templates/invoice/pdf')
            .send({
                invoice_id: '123'
            })
            .parse(binaryParser)
            .buffer()
            .expect(200)
            .expect('Content-Type', 'application/pdf')
            .then(response => {
                fs.writeFileSync(
                    path.join(__dirname, 'output', 'invoice.pdf'),
                    response.body
                );
                expect(
                    fs.readFileSync(
                        path.join(__dirname, 'output', 'invoice.pdf')
                    ).toString()
                        .replace(/^\/CreationDate.*$/gm, '/CreationDate (D:20190808090336+00\'00\')')
                        .replace(/^\/ModDate.*$/gm, '/ModDate (D:20190808090336+00\'00\')>>')
                ).toMatchSnapshot();
            });
    });
    it('Return french pdf binary', async () => {
        return request(server)
            .post('/v1/templates/invoice/pdf')
            .send({
                invoice_id: '123',
                lang: 'FR'
            })
            .parse(binaryParser)
            .buffer()
            .expect(200)
            .expect('Content-Type', 'application/pdf')
            .then(response => {
                fs.writeFileSync(
                    path.join(__dirname, 'output', 'invoice.pdf'),
                    response.body
                );
                expect(
                    fs.readFileSync(
                        path.join(__dirname, 'output', 'invoice.pdf')
                    ).toString()
                        .replace(/^\/CreationDate.*$/gm, '/CreationDate (D:20190808090336+00\'00\')')
                        .replace(/^\/ModDate.*$/gm, '/ModDate (D:20190808090336+00\'00\')>>')
                ).toMatchSnapshot();
            });
    });
});
