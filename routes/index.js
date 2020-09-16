var express = require('express');
var router = express.Router();
var multer = require('multer');

var storageFiles = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, process.env.APP_FILES_STORAGE)
  },
});

var storageImages = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, process.env.APP_IMAGES_STORAGE)
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname + '-' + Date.now() + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1]) //Appending .jpg
  }
});

var uploadFiles = multer({
  storage: storageFiles
});

var uploadImages = multer({
  storage: storageImages
});

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/single-file', uploadFiles.single('file'), async (req, res) => {
  var file = req.file;
  logFile('File', file);
  res.send();
});

router.post('/single-image', uploadImages.single('file'), async (req, res) => {
  var file = req.file;
  logFile('Image', file);
  res.send();
});

function logFile(type, file) {
  console.log('  ' + type + ' uploaded');
  console.log('    Path: %s', file.filename);
  console.log('    Type: %s', file.mimetype);
  console.log('    Name: %s', file.originalname);
  console.log('    Size: %s', file.size);
  console.log('    Path: %s', file.path);
  console.log('    Field: %s', file.fieldname);
}

module.exports = router;
