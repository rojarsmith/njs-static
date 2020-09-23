const request = require('supertest');
const path = require("path");
const app = require('../app');
const { ExpectationFailed } = require('http-errors');

describe('Upload endpoint', () => {
    let filePath1 = path.join(__dirname, '/data/image01.png');
    let filePath2 = path.join(__dirname, '/data/image02.jpg');

    test('Uploads single file.', async () => {
        console.log(filePath1);
        await request(app)
            .post('/file/upload/single')
            .attach('file', filePath1)
            .then((res) => {
                console.log(res.body);
                const { name, size, url } = res.body;
                expect(size).toBeGreaterThan(0);
                expect(res.statusCode).toBe(200);
            })
            .catch(err => console.log(err));
    })

    test('Uploads single image.', async () => {
        console.log(filePath1);
        await request(app)
            .post('/image/upload/single')
            .attach('file', filePath1)
            .then((res) => {
                console.log(res.body);
                const { name, size, url } = res.body;
                expect(size).toBeGreaterThan(0);
                expect(res.statusCode).toBe(200);
            })
            .catch(err => console.log(err));
    })

    test('Uploads fields file.', async () => {
        await request(app)
            .post('/file/upload/fields')
            .attach('file', filePath1)
            .attach('file', filePath2)
            .then((res) => {
                console.log(res.body);
                const { name, size, url } = res.body[0];
                expect(size).toBeGreaterThan(0);
                expect(res.statusCode).toBe(200);
            })
            .catch(err => console.log(err));
    })

    test('Uploads fields image.', async () => {
        await request(app)
            .post('/image/upload/fields')
            .attach('image', filePath1)
            .attach('image', filePath2)
            .then((res) => {
                console.log(res.body);
                const { name, size, url } = res.body[0];
                expect(size).toBeGreaterThan(0);
                expect(res.statusCode).toBe(200);
            })
            .catch(err => console.log(err));
    })
})
