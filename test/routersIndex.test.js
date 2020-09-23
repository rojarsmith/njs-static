const request = require('supertest');
const path = require("path");
const app = require('../app');
const { ExpectationFailed } = require('http-errors');

describe('Upload endpoint', () => {
    let filePath = path.join(__dirname, '/data/image01.png');

    test('Uploads single file.', async () => {
        console.log(filePath);
        return await request(app)
            .post('/file/upload/single')
            .attach('file', filePath)
            .then((res) => {
                const { name, size, url } = res.body;
                expect(name).to
                expect(size).toBeGreaterThan(0);
                expect(res.statusCode).toBe(200);
            })
            .catch(err => console.log(err));
    })
})
