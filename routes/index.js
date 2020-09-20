var express = require('express');
var path = require('path');
var router = express.Router();
var multer = require('multer');
var fs = require('fs');

var mongo = require('mongodb');
const { resolve } = require('path');
const { rejects } = require('assert');
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

  if (typeof file === 'undefined') {
    res.status(400).send();
    return;
  }

  mongoClient.connect(process.env.APP_MONGODB_LINK, { useNewUrlParser: true, useUnifiedTopology: true },
    function (err, db) {
      if (err) throw err;
      var dbo = db.db(process.env.APP_MONGODB_NAME);
      dbo.collection("files").insertOne({
        "file": file.filename,
        "size": file.size
      }, function (err, res) {
        if (err) throw err;
        logFile('File', file);
        db.close();
      });
    });

  res.send({
    name: file.filename,
    size: file.size,
    Url: process.env.APP_RESOURECES_BASE_URL + '/uploads/files/' + file.filename
  });
});

router.post('/fields-file', uploadFiles.fields([{ name: 'file', maxCount: 16 }]), async (req, res) => {
  var files = req.files;

  if (typeof files === 'undefined') {
    res.status(400).send();
    return;
  }

  var insertData = [];
  var returnData = [];
  console.log(files);
  if (files) {
    files.file.forEach(function (file) {
      insertData.push({
        "file": file.filename,
        "size": file.size
      });
      returnData.push({
        name: file.filename,
        size: file.size,
        Url: process.env.APP_RESOURECES_BASE_URL + '/uploads/files/' + file.filename
      });
      logFile('File', file);
    })

    mongoClient.connect(process.env.APP_MONGODB_LINK, { useUnifiedTopology: true },
      function (err, db) {
        if (err) throw err;
        var dbo = db.db(process.env.APP_MONGODB_NAME);
        dbo.collection("files").insertMany(insertData
          , function (err, res) {
            if (err) throw err;
            console.log(insertData);
            db.close();
          });
      });
  };

  res.send(returnData);
});

router.post('/single-image', uploadImages.single('file'), async (req, res) => {
  var file = req.file;

  if (typeof file === 'undefined') {
    res.status(400).send();
    return;
  }

  mongoClient.connect(process.env.APP_MONGODB_LINK,
    function (err, db) {
      if (err) throw err;
      var dbo = db.db(process.env.APP_MONGODB_NAME);
      dbo.collection("images").insertOne({
        "image": file.filename,
        "size": file.size
      }, function (err, res) {
        if (err) throw err;
        logFile('Image', file);
        db.close();
      });
    });

  res.send({
    name: file.filename,
    size: file.size,
    Url: process.env.APP_RESOURECES_BASE_URL + '/uploads/images/' + file.filename
  });
});

router.post('/fields-image', uploadImages.fields([{ name: 'file', maxCount: 16 }]), async (req, res) => {
  var files = req.files;

  if (typeof files === 'undefined') {
    res.status(400).send();
    return;
  }

  var insertData = [];
  var returnData = [];
  console.log(files);
  if (files) {
    files.file.forEach(function (file) {
      insertData.push({
        "image": file.filename,
        "size": file.size
      });
      returnData.push({
        name: file.filename,
        size: file.size,
        Url: process.env.APP_RESOURECES_BASE_URL + '/uploads/images/' + file.filename
      });
    })

    mongoClient.connect(process.env.APP_MONGODB_LINK, { useUnifiedTopology: true },
      function (err, db) {
        if (err) throw err;
        var dbo = db.db(process.env.APP_MONGODB_NAME);
        dbo.collection("images").insertMany(insertData
          , function (err, res) {
            if (err) throw err;
            console.log(insertData);
            db.close();
          });
      });
  };

  res.send(returnData);
});

router.post('/delete/multi', async (req, res) => {
  try {
    var data = req.body;
    console.log(data);
    if (Object.keys(data).length === 0 && data.constructor === Object) {
      res.status(400).send();
      return;
    }

    var cf = getCollectionAndField(data.type);
    console.log(cf);
    console.log(cf.field);
    var query = {};
    query[cf.field] = { $in: data.names };
    console.log(query);
    mongoClient.connect(process.env.APP_MONGODB_LINK, { useNewUrlParser: true, useUnifiedTopology: true }, async (err, client) => {
      if (err) {
        console.log(err);
        res.status(400).send(err);
      }
      db = await client.db(process.env.APP_MONGODB_NAME);

      var dbPromise = () => {
        return new Promise((resolve, reject) => {
          db.collection(cf.collection).deleteMany(query, function (err, res) {
            err ? reject(err) : resolve(res);
          });
        })
      };

      var qRes = await dbPromise().catch(err => console.log('error:', err.message));

      client.close();

      res.send();
    });
  } catch (error) {
    console.log(error);
    res.status(400).send();
  }
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

    mongoClient.connect(process.env.APP_MONGODB_LINK, { useUnifiedTopology: true },
      function (err, db) {
        if (err) throw err;
        var dbo = db.db(process.env.APP_MONGODB_NAME);
        dbo.collection("files").drop(function (err, res) {
          if (err) throw err;
          db.close();
        });
      });

    if (files) {
      files.forEach(function (file) {
        var file_full_path = path.join(process.env.APP_FILES_STORAGE, file);
        fs.stat(file_full_path, function (err, stats) {
          console.log(file_full_path);
          if (!err && !stats.isDirectory()) {
            mongoClient.connect(process.env.APP_MONGODB_LINK, { useUnifiedTopology: true },
              function (err, db) {
                if (err) throw err;
                var dbo = db.db(process.env.APP_MONGODB_NAME);
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

    res.send("Rebuild completed.");
  })
});

router.get('/action/rebuild-image-index', async (req, res) => {
  fs.readdir(process.env.APP_IMAGES_STORAGE, function (err, files) {
    if (err) {
      console.log(err);
      res.status(err.status).end();
    }

    mongoClient.connect(process.env.APP_MONGODB_LINK, { useUnifiedTopology: true },
      function (err, db) {
        if (err) throw err;
        var dbo = db.db(process.env.APP_MONGODB_NAME);
        dbo.collection("images").drop(function (err, res) {
          if (err) throw err;
          db.close();
        });
      });

    if (files) {
      files.forEach(function (file) {
        var file_full_path = path.join(process.env.APP_IMAGES_STORAGE, file);
        fs.stat(file_full_path, function (err, stats) {
          console.log(file_full_path);
          if (!err && !stats.isDirectory()) {
            mongoClient.connect(process.env.APP_MONGODB_LINK, { useUnifiedTopology: true },
              function (err, db) {
                if (err) throw err;
                var dbo = db.db(process.env.APP_MONGODB_NAME);
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

    res.send("Rebuild completed.");
  })
});

router.post('/action/check-reources-exist', async (req, res) => {
  try {
    var data = req.body;

    if (Object.keys(data).length === 0 && data.constructor === Object) {
      res.status(400).send();
      return;
    }

    var coll = '';
    var qp1 = '';

    if (data.type === 'image') {
      coll = 'images';
      qp1 = 'image';
    } else {
      coll = 'files';
      qp1 = 'file';
    }

    var query = {};
    query[qp1] = { $in: data.names };

    var returnData = [];
    var queryData = [];

    let db = null;

    mongoClient.connect(process.env.APP_MONGODB_LINK, { useNewUrlParser: true, useUnifiedTopology: true }, async (err, client) => {
      if (err) {
        console.log(err);
      }
      db = await client.db(process.env.APP_MONGODB_NAME);
      console.log('Database connected');

      var dbPromise = () => {
        return new Promise((resolve, reject) => {
          db.collection(coll).find(query).toArray(function (err, res) {
            err ? reject(err) : resolve(res);
          });
        })
      };

      var qRes = await dbPromise();

      client.close();
      // res.send(qRes); // For debug.

      data.names.forEach(function (value, index, array) {
        var isExist = false;

        qRes.forEach(function (value2, index2, array2) {

          if (value2[qp1] === value) {
            console.log(value + ' existed.');
            isExist = true;
          }
        });
        returnData.push({
          "name": value,
          "exist": isExist
        });
      });
      res.send(returnData);
    });
  } catch (e) {
    console.log(e);
  }
});

function getCollectionAndField(type) {
  var returnData = {};
  if (type === 'image') {
    returnData['collection'] = 'images';
    returnData['field'] = 'image';
  } else {
    returnData['collection'] = 'files';
    returnData['field'] = 'file';
  }
  return returnData;
}

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
