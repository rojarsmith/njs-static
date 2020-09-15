var express = require('express');
var router = express.Router();
// var fs = require('fs');
var multer = require('multer');

console.log('aaa');
var dddd = process.env.APP_IMAGE_STORAGE;
console.log(dddd);

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    //cb(null, 'uploads/')
    cb(null, process.env.REACT_APP_IMAGE_STORAGE)
    //cb(null, 'E:\\static-service\\uploads')
  },
  // filename: function (req, file, cb) {
  //   cb(null, file.filename + '.' + file.originalname.split('.')[file.originalname.split('.').length -1]) //Appending .jpg
  // }
});

var upload = multer({
  storage: storage
  //dest: 'uploads/'
});

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/notmultiple', upload.single('file'), async (req, res) => {
  var file = req.file;
  console.log('  File uploaded');
  console.log('    Path: %s', file.filename);
  console.log('    Type: %s', file.mimetype);
  console.log('    Name: %s', file.originalname);
  console.log('    Size: %s', file.size);
  console.log('    Path: %s', file.path);
  console.log('    Field: %s', file.fieldname);
  // fs.rename(file.path, file.path + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1], function (err) {
  //   if (err) console.log('ERROR: ' + err);
  // });
  res.send();
});

module.exports = router;
