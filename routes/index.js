var express = require('express');
var path = require('path');
var router = express.Router();
var multer = require('multer');
var fs = require('fs');

var mongo = require('mongodb')
var MongoClient = require('mongodb').MongoClient;

var url = "mongodb://localhost:27017/testdb";

MongoClient.connect(process.env.APP_MONGODB_LINK,
  function (err, db) {
    if (err) throw err;
    console.log("Database connected!");
    var dbo = db.db("testdb");
    dbo.collection("students").insertOne({ "name": "Abhishek", "marks": 100 }, function (err, res) {
      if (err) throw err;
      console.log("1 document inserted");
      db.close();
    });
    dbo.collection("students").insertMany([{ "name": "Abhishek2", "marks": 200 }, { "name": "Abhishek3", "marks": 300 }], function (err, res) {
      if (err) throw err;
      console.log("1 document inserted");
      db.close();
    });
  });

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
    var basename = path.basename(file.originalname, path.extname(file.originalname));
    cb(null, basename + '-' + Date.now() + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1]) //Appending .jpg
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

router.post('/fields-file', uploadFiles.fields([{ name: 'file', maxCount: 16 }]), async (req, res) => {
  var files = req.files;
  console.log(files);
  if (files) {
    files.file.forEach(function (file) {
      logFile('File', file);
    })
  };

  res.send();
});

router.post('/single-image', uploadImages.single('file'), async (req, res) => {
  var file = req.file;
  logFile('Image', file);
  res.send();
});

router.post('/fields-image', uploadImages.fields([{ name: 'file', maxCount: 16 }]), async (req, res) => {
  var files = req.files;
  console.log(files);
  if (files) {
    files.file.forEach(function (file) {
      logFile('Image', file);
    })
  };

  res.send();
});

router.get('/uploads/files/*', async (req, res) => {
  var path = req.params[0] ? req.params[0] : '/';
  res.sendFile(path, { root: process.env.APP_FILES_STORAGE }, function (err) {
    if (err) {
      console.log(err);
      res.status(err.status).end();
    } else {
      console.log('Load file: ' + req.params[0] + ' correct.');
    }
  });
});

router.get('/uploads/images/*', async (req, res) => {
  var path = req.params[0] ? req.params[0] : '/';
  res.sendFile(path, { root: process.env.APP_IMAGES_STORAGE }, function (err) {
    if (err) {
      console.log(err);
      res.status(err.status).end();
    } else {
      console.log('Load image: ' + req.params[0] + ' correct.');
    }
  });
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
