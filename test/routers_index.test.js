const request = require('supertest');
const app = require('../app');
//var fs = require('fs');

//const testImage = `${__dirname}/../../../assets/test_image.jpg`


// const { ExpectationFailed } = require('http-errors');
// const routers_index = require('../routes/index');

// test('Test1', ()=>{

//     expectat(routers_index.)
// });


describe('Upload endpoint', () => {

    let filePath = `${__dirname}/data/image01.png`;

    test('Successfully uploads jpg image', async () => {

        console.log(filePath);
        //const imgStream = fs.createReadStream(testImage);

        return await request(app)
            .post('/file/upload/single')
            .attach('file', filePath)
            .then((res) => {
                const { success, message, filePath } = res.body;
                console.log(res.body);
                //expect(success).toBeTruthy();
                
                // expect(message).toBe('Rename successfully');
                // expect(typeof filePath ).toBeTruthy();
                //console.log(aaa);

            })
            .catch(err => console.log(err));



    })
})



// describe('Post Endpoints', () => {
//     it('should create a new post', async () => {
//       const res = await request(app)
//         .post('/file/upload/single')
//         .send({
//           userId: 1,
//           title: 'test is cool',
//         })
//       expect(res.statusCode).toEqual(201)
//       expect(res.body).toHaveProperty('post')
//     })
//   });

describe('Sample Test', () => {
    it('should test that true === true', () => {
        expect(true).toBe(true)
    })
});

