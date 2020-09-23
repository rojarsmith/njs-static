const request = require('supertest');
const path = require("path");
const app = require('../app');
const { ExpectationFailed } = require('http-errors');

describe('Upload endpoint', () => {
    let filePath = path.join(__dirname, '/data/image01.png');

    test('Uploads single file.', async () => {
        console.log(filePath);
        await request(app)
            .post('/file/upload/single')
            .attach('file', filePath)
            .then((res) => {
                console.log(res.body);
                const { name, size, url } = res.body;
                expect(size).toBeGreaterThan(0);
                expect(res.statusCode).toBe(200);
            })
            .catch(err => console.log(err));
    })

    test('Uploads single image.', async () => {
        console.log(filePath);
        await request(app)
            .post('/image/upload/single')
            .attach('file', filePath)
            .then((res) => {
                console.log(res.body);
                const { name, size, url } = res.body;
                expect(size).toBeGreaterThan(0);
                expect(res.statusCode).toBe(200);
            })
            .catch(err => console.log(err));
    })
})
