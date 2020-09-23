const request = require('supertest');
const path = require("path");
const app = require('../app');
const { ExpectationFailed } = require('http-errors');

var filePath1 = path.join(__dirname, '/data/image01.png');
var filePath2 = path.join(__dirname, '/data/image02.jpg');
var uploaded1;
var uploaded2;

describe('Upload', () => {
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
            .attach('file', filePath1)
            .attach('file', filePath2)
            .then((res) => {
                console.log(res.body);
                const { name, size, url } = res.body[0];
                this.uploaded1 = name;
                this.uploaded2 = res.body[1].name;
                console.log(this.uploaded1);
                console.log(this.uploaded2);
                expect(size).toBeGreaterThan(0);
                expect(res.statusCode).toBe(200);
            })
            .catch(err => console.log(err));
    })
})

describe('Action', () => {
    test('Uploads fields image.', async () => {
        var deleteData = {
            "type": "image",
            "names": [this.uploaded1]
        }
        console.log(deleteData);
        await request(app)
            .post('/action/delete/fields')
            .set('Authorization', 'Bearer ' + process.env.APP_ACCESS_TOKEN)
            .send(deleteData)
            .then((res) => {
                expect(res.statusCode).toBe(200);
            })
            .catch(err => console.log(err));
    })
})