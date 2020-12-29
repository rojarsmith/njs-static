var express = require('express');
var path = require('path');
var router = express.Router();
var multer = require('multer');
var fs = require('fs');
var uuid = require('uuid')

var mongo = require('mongodb');
const { resolve } = require('path');
const { rejects } = require('assert');
var mongoClient = require('mongodb').MongoClient;
var mongoMod = require('../utility/mongoClient');
var mongoCli = new mongoMod.mongoDbClient();

var conn = {
  url: process.env.APP_MONGODB_LINK,
  dbName: process.env.APP_MONGODB_NAME
}

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
    let suuid = uuid.v1().substring(0, 8);
    cb(null, Date.now() + '-' + suuid + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1]) //Appending .jpg
  }
});

var uploadFiles = multer({
  storage: storageFiles
});

var uploadImages = multer({
  storage: storageImages
});

const promisify = function (nodeFunction) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      nodeFunction.call(this, ...args, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  };
};

const readDir = promisify(fs.readdir);
const fileStat = promisify(fs.stat);

const getFilesPath = async (dir) => {
  let files = await readDir(dir);

  let result = files.map(file => {
    let filePath = path.join(dir, file);
    return fileStat(filePath).then(stat => {
      if (!stat.isDirectory()) {
        if (typeof file !== 'undefined') {
          return file;
        }
      }
    });
  });

  var res = await Promise.all(result);
  res = res.filter(function (el) {
    return el != null;
  })

  return await Promise.all(res);
};

router.post('/file/upload/single', uploadFiles.single('file'), async (req, res, next) => {
  try {
    var file = req.file;

    if (typeof file === 'undefined') {
      console.log('File undefined.');
      throw new Error('File undefined.');
    }

    var inse = {
      "file": file.filename,
      "size": file.size
    }

    await mongoCli.connect(
      conn,
      () => { },
      (err) => { console.log(err) });

    await mongoCli.insertDocument('files', inse);

    await mongoCli.teardown(
      () => { },
      (err) => { console.log(err) });

    let data = {
      name: file.filename,
      size: file.size,
      url: process.env.APP_RESOURECES_BASE_URL + '/file/' + file.filename
    };

    let payload = {
      "success": true,
      "message": "Upload single file success.",
      "data": data,
      "trace": null
    };
    res.send(payload);
  } catch (error) {
    console.log(error);
    let payload = {
      "success": false,
      "message": error.message,  // "Upload single file failed.",
      "data": null,
      "trace": error.stack
    };
    res.status(400).send(payload);
  }
});

router.post('/file/upload/fields', uploadFiles.fields([{ name: 'file', maxCount: 16 }]), async (req, res) => {
  try {
    var files = req.files;

    if (typeof files === 'undefined') {
      let payload = 'File undefined.';
      console.log(payload);
      res.status(400).send(payload);
      return;
    }

    var insertData = [];
    var returnData = [];

    if (files) {
      files.file.forEach(function (file) {
        insertData.push({
          "file": file.filename,
          "size": file.size
        });
        returnData.push({
          name: file.filename,
          size: file.size,
          Url: process.env.APP_RESOURECES_BASE_URL + '/file/' + file.filename
        });
      })

      await mongoCli.connect(
        conn,
        () => { },
        (err) => { console.log(err) });

      if (files.file.length <= 1) {
        await mongoCli.insertDocument('files', insertData[0]);
      } else {
        await mongoCli.insertDocument('files', insertData);
      }

      await mongoCli.teardown(
        () => { },
        (err) => { console.log(err) });
    };

    let payload = {
      "success": true,
      "message": "Upload field of files success.",
      "data": returnData,
      "trace": null
    };
    res.send(payload);
  } catch (error) {
    console.log(error);
    let payload = {
      "success": false,
      "message": error.message,
      "data": null,
      "trace": error.stack
    };
    res.status(400).send(payload);
  }
});

router.post('/image/upload/single', uploadImages.single('file'), async (req, res) => {
  try {
    var file = req.file;

    if (typeof file === 'undefined') {
      let payload = 'File undefined.';
      console.log(payload);
      res.status(400).send(payload);
      return;
    }

    var inse = {
      "image": file.filename,
      "size": file.size
    }

    await mongoCli.connect(
      conn,
      () => { },
      (err) => { console.log(err) });

    await mongoCli.insertDocument('images', inse);

    await mongoCli.teardown(
      () => { },
      (err) => { console.log(err) });

    let payload = {
      "success": true,
      "message": "Upload single image success.",
      "data": {
        name: file.filename,
        size: file.size,
        Url: process.env.APP_RESOURECES_BASE_URL + '/image/' + file.filename
      },
      "trace": null
    };

    res.send(payload);
  } catch (error) {
    console.log(error);
    let payload = {
      "success": false,
      "message": error.message,  // "Upload single file failed.",
      "data": null,
      "trace": error.stack
    };
    res.status(400).send(payload);
  }
});

router.post('/image/upload/fields', uploadImages.fields([{ name: 'file', maxCount: 16 }]), async (req, res) => {
  try {
    var files = req.files;

    if (typeof files === 'undefined') {
      let payload = 'File undefined.';
      console.log(payload);
      res.status(400).send(payload);
      return;
    }

    var insertData = [];
    var returnData = [];

    if (files) {
      files.file.forEach(function (file) {
        insertData.push({
          "image": file.filename,
          "size": file.size
        });
        returnData.push({
          name: file.filename,
          size: file.size,
          Url: process.env.APP_RESOURECES_BASE_URL + '/image/' + file.filename
        });
      })

      await mongoCli.connect(
        conn,
        () => { },
        (err) => { console.log(err) });

      if (files.file.length <= 1) {
        await mongoCli.insertDocument('images', insertData[0]);
      } else {
        await mongoCli.insertDocument('images', insertData);
      }

      await mongoCli.teardown(
        () => { },
        (err) => { console.log(err) });
    };

    let payload = {
      "success": true,
      "message": "Upload field of images success.",
      "data": returnData,
      "trace": null
    };

    res.send(payload);
  } catch (error) {
    console.log(error);
    let payload = {
      "success": false,
      "message": error.message,
      "data": null,
      "trace": error
    };
    res.status(400).send(payload);
  }
});

router.post('/action/delete/fields', async (req, res) => {
  try {
    if (('Bearer ' + process.env.APP_ACCESS_TOKEN) !== req.header('authorization')) {
      console.log('Authorize failed.');
      res.status(400).send();
      return;
    }

    var data = req.body;

    if (Object.keys(data).length === 0 && data.constructor === Object) {
      res.status(400).send();
      return;
    }

    var cf = getCollectionAndField(data.type);
    var query = {};
    query[cf.field] = { $in: data.names };

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

      let payload = {
        "success": true,
        "message": "Delete field of resources success.",
        "data": data,
        "trace": null
      };
      res.send(payload);
    });
  } catch (error) {
    console.log(error);
    let payload = {
      "success": false,
      "message": error.message,
      "data": null,
      "trace": error.stack
    };
    res.status(400).send(payload);
  }
});

router.get('/action/rebuild-file-index', async (req, res) => {
  try {
    if (('Bearer ' + process.env.APP_ACCESS_TOKEN) !== req.header('authorization')) {
      console.log('Authorize failed.');
      let payload = {
        "success": true,
        "message": "Authorize failed.",
        "data": null,
        "trace": null
      };
      res.status(400).send(payload);
      return;
    }

    fs.readdir(process.env.APP_FILES_STORAGE, function (err, files) {
      if (err) {
        console.log(err);
        let payload = {
          "success": true,
          "message": err.message,
          "data": null,
          "trace": null
        };
        res.status(err.status).send(payload).end();
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

      let payload = {
        "success": true,
        "message": "Rebuild completed.",
        "data": null,
        "trace": null
      };
      res.send(payload);
    })
  } catch (error) {
    console.log(error);
    let payload = {
      "success": false,
      "message": error.message,
      "data": null,
      "trace": error.stack
    };
    res.status(400).send(payload);
  }
});

router.get('/action/rebuild-image-index', async (req, res) => {
  try {
    if (('Bearer ' + process.env.APP_ACCESS_TOKEN) !== req.header('authorization')) {
      console.log('Authorize failed.');
      let payload = {
        "success": true,
        "message": "Authorize failed.",
        "data": null,
        "trace": null
      };
      res.status(400).send(payload);
      return;
    }

    fs.readdir(process.env.APP_IMAGES_STORAGE, function (err, files) {
      if (err) {
        console.log(err);
        let payload = {
          "success": true,
          "message": err.message,
          "data": null,
          "trace": null
        };
        res.status(err.status).send(payload).end();
        return;
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

      let payload = {
        "success": true,
        "message": "Rebuild completed.",
        "data": null,
        "trace": null
      };
      res.send(payload);
    })
  } catch (error) {
    console.log(error);
    let payload = {
      "success": false,
      "message": error.message,
      "data": null,
      "trace": error.stack
    };
    res.status(400).send(payload);
  }
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

      let payload = {
        "success": true,
        "message": "Check resources success.",
        "data": returnData,
        "trace": null
      };
      res.send(payload);
    });
  } catch (error) {
    console.log(error);
    let payload = {
      "success": false,
      "message": error.message,
      "data": null,
      "trace": error.stack
    };
    res.status(400).send(payload);
  }
});

router.get('/action/health', async (req, res) => {
  var returnData = {};

  try {
    await mongoCli.connect(
      conn,
      () => { },
      (err) => {
        console.log(err);
        throw err;
      });

    var dataDb = await mongoCli.runCommand({ serverStatus: 1, repl: 1 });

    await mongoCli.teardown(
      () => { },
      (err) => {
        console.log(err);
        throw err;
      });

    if (dataDb.uptime > 0) {
      returnData['mongodb'] = 'OK';
    }
  } catch (err) {
    console.log(err);
    let payload = {
      "success": false,
      "message": err.message,
      "data": null,
      "trace": err.stack
    };
    res.status(400).send(payload).end();
    return;
  }

  console.log(returnData);
  let payload = {
    "success": true,
    "message": "Check health success.",
    "data": returnData,
    "trace": null
  };
  res.send(payload);
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

module.exports = router;
