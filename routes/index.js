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

/* GET home page. */
router.get('/', async function (req, res, next) {
  var viewData = { title: 'NJS Static Service' };

  try {
    let files = await getFilesPath(process.env.APP_FILES_STORAGE);
    let images = await getFilesPath(process.env.APP_IMAGES_STORAGE);

    if (!files || !images) {
      throw new Error('Load files or images failed.');
    }

    viewData['files_count'] = files.length;
    viewData['images_count'] = images.length;

    res.render('index', viewData);
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

router.get('/public/*', async (req, res) => {
  try {
    var path = req.params[0] ? req.params[0] : '/';
    res.sendFile(path, { root: process.env.APP_PUBLIC_STORAGE }, function (err) {
      if (err) {
        console.log(err);
        res.status(err.status).end();
      } else {
        console.log('Load file: ' + req.params[0] + ' correct.');
      }
    });
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

router.get('/file/*', async (req, res) => {
  try {
    var path = req.params[0] ? req.params[0] : '/';
    res.sendFile(path, { root: process.env.APP_FILES_STORAGE }, function (err) {
      if (err) {
        console.log(err);
        res.status(err.status).end();
      } else {
        console.log('Load file: ' + req.params[0] + ' correct.');
      }
    });
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

router.get('/image/*', async (req, res) => {
  try {
    var path = req.params[0] ? req.params[0] : '/';
    res.sendFile(path, { root: process.env.APP_IMAGES_STORAGE }, function (err) {
      if (err) {
        console.log(err);
        res.status(err.status).end();
      } else {
        console.log('Load image: ' + req.params[0] + ' correct.');
      }
    });
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

module.exports = router;
