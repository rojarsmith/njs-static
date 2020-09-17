var express = require('express');
var path = require('path');
var router = express.Router();
var multer = require('multer');
var fs = require('fs');

var mongo = require('mongodb')
var mongoClient = require('mongodb').MongoClient;

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

  mongoClient.connect(process.env.APP_MONGODB_LINK, { useUnifiedTopology: true },
    function (err, db) {
      if (err) throw err;
      var dbo = db.db("testdb");
      dbo.collection("files").insertOne({
        "file": file.filename,
        "size": file.size
      }, function (err, res) {
        if (err) throw err;
        logFile('File', file);
        db.close();
      });
    });

  res.send();
});

router.post('/fields-file', uploadFiles.fields([{ name: 'file', maxCount: 16 }]), async (req, res) => {
  var files = req.files;
  var insertData = [];
  console.log(files);
  if (files) {
    files.file.forEach(function (file) {
      insertData.push({
        "file": file.filename,
        "size": file.size
      });
      logFile('File', file);
    })

    mongoClient.connect(process.env.APP_MONGODB_LINK, { useUnifiedTopology: true },
      function (err, db) {
        if (err) throw err;
        var dbo = db.db("testdb");
        dbo.collection("files").insertMany(insertData
          , function (err, res) {
            if (err) throw err;
            console.log(insertData);
            db.close();
          });
      });
  };

  res.send();
});

router.post('/single-image', uploadImages.single('file'), async (req, res) => {
  var file = req.file;

  mongoClient.connect(process.env.APP_MONGODB_LINK,
    function (err, db) {
      if (err) throw err;
      var dbo = db.db("testdb");
      dbo.collection("images").insertOne({
        "image": file.filename,
        "size": file.size
      }, function (err, res) {
        if (err) throw err;
        logFile('Image', file);
        db.close();
      });
    });

  res.send();
});

router.post('/fields-image', uploadImages.fields([{ name: 'file', maxCount: 16 }]), async (req, res) => {
  var files = req.files;
  var insertData = [];
  console.log(files);
  if (files) {
    files.file.forEach(function (file) {
      insertData.push({
        "file": file.filename,
        "size": file.size
      });
    })

    mongoClient.connect(process.env.APP_MONGODB_LINK, { useUnifiedTopology: true },
      function (err, db) {
        if (err) throw err;
        var dbo = db.db("testdb");
        dbo.collection("images").insertMany(insertData
          , function (err, res) {
            if (err) throw err;
            console.log(insertData);
            db.close();
          });
      });
  };

  res.send();
});

router.get('/public/*', async (req, res) => {
  var path = req.params[0] ? req.params[0] : '/';
  res.sendFile(path, { root: process.env.APP_PUBLIC_STORAGE }, function (err) {
    if (err) {
      console.log(err);
      res.status(err.status).end();
    } else {
      console.log('Load file: ' + req.params[0] + ' correct.');
    }
  });
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

router.get('/action/rebuild-file-index', async (req, res) => {
  fs.readdir(process.env.APP_FILES_STORAGE, function (err, files) {
    if (err) {
      console.log(err);
      res.status(err.status).end();
    }

    if (files) {
      files.forEach(function (file) {
        var file_full_path = path.join(process.env.APP_FILES_STORAGE, file);
        fs.stat(file_full_path, function (err, stats) {
          console.log(file_full_path);
          if (!err && !stats.isDirectory()) {
            mongoClient.connect(process.env.APP_MONGODB_LINK, { useUnifiedTopology: true },
              function (err, db) {
                if (err) throw err;
                var dbo = db.db("testdb");
                dbo.collection("files").find({
                  file: file,
                }).toArray(function (err, res) {
                  if (err) throw err;
                  console.log(res);

                  if (res.length === 0) {
                    dbo.collection("files").insertOne({
                      "file": file,
                      "size": stats.size
                    }, function (err, res) {
                      if (err) throw err;
                      console.log(file + ' inserted.');
                      db.close();
                    });
                  } else {
                    console.log('Record existed.');
                  }
                });
              });
          }
        });
      });
    }

    res.send();
  })
});

router.get('/action/rebuild-image-index', async (req, res) => {
  fs.readdir(process.env.APP_IMAGES_STORAGE, function (err, files) {
    if (err) {
      console.log(err);
      res.status(err.status).end();
    }

    if (files) {
      files.forEach(function (file) {
        var file_full_path = path.join(process.env.APP_IMAGES_STORAGE, file);
        fs.stat(file_full_path, function (err, stats) {
          console.log(file_full_path);
          if (!err && !stats.isDirectory()) {
            mongoClient.connect(process.env.APP_MONGODB_LINK, { useUnifiedTopology: true },
              function (err, db) {
                if (err) throw err;
                var dbo = db.db("testdb");
                dbo.collection("images").find({
                  image: file,
                }).toArray(function (err, res) {
                  if (err) throw err;
                  console.log(res);
                  console.log(res.length);

                  if (res.length === 0) {
                    dbo.collection("images").insertOne({
                      "image": file,
                      "size": stats.size
                    }, function (err, res) {
                      if (err) throw err;
                      console.log(file + ' inserted.');
                      db.close();
                    });
                  } else {
                    console.log('Record existed.');
                  }
                });
              });
          }
        });
      });
    }

    res.send();
  })
});

function logFile(type, file) {
  console.log('  ' + type + ' uploaded');
  console.log('    Name: %s', file.filename);
  console.log('    Type: %s', file.mimetype);
  console.log('    Original Name: %s', file.originalname);
  console.log('    Size: %s', file.size);
  console.log('    Path: %s', file.path);
  console.log('    Field: %s', file.fieldname);
}

module.exports = router;
