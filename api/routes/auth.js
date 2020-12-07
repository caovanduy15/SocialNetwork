const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validInput = require('../utils/validInput');
const verify = require('../utils/verifyToken');
const convertString = require('../utils/convertString');
const {responseError, callRes} = require('../response/error');
const checkInput = require('../utils/validInput');
const validTime = require('../utils/validTime');



var multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const MAX_IMAGE_NUMBER = 4;
const MAX_SIZE_IMAGE = 4 * 1024 * 1024; // for 4MB

// Create new storage instance with Firebase project credentials

const storage = new Storage({
  projectId: process.env.GCLOUD_PROJECT_ID,
  credentials: {
    private_key: process.env.private_key,
    client_email: process.env.client_email
  }
});

// Create a bucket associated to Firebase storage bucket
const bucket =
  storage.bucket(process.env.GCLOUD_STORAGE_BUCKET_URL);

// Initiating a memory storage engine to store files as Buffer objects
const uploader = multer({
  storage: multer.memoryStorage(),
});

// Item Model
const User = require("../models/User");
const Setting = require("../models/Setting");

// @route  POST it4788/signup
// @desc   Register new user
// @access Public
// Example: Use Postman
// URL: http://127.0.0.1:5000/it4788/signup
// BODY: {
// "phoneNumber": "0789554152",
// "password": "nguyen123"
//}
router.post('/signup', async (req, res) => {
  const { phoneNumber, password } = req.query;

  if (phoneNumber === undefined || password === undefined) {
    return callRes(res, responseError.PARAMETER_IS_NOT_ENOUGH, 'phoneNumber, password');
  }
  if (typeof phoneNumber != 'string' || typeof password != 'string') {
    return callRes(res, responseError.PARAMETER_TYPE_IS_INVALID, 'phoneNumber, password');
  } 
  if (!validInput.checkPhoneNumber(phoneNumber)) {
    return callRes(res, responseError.PARAMETER_VALUE_IS_INVALID, 'phoneNumber');
  }
  if (!validInput.checkUserPassword(password)) {
    return callRes(res, responseError.PARAMETER_VALUE_IS_INVALID, 'password');
  }
  try {
    let user = await User.findOne({phoneNumber});
    if (user) return callRes(res, responseError.USER_EXISTED);
    const newUser = new User({
      phoneNumber,
      password,
      verifyCode: random4digit(),
      isVerified: false
    });
    // hash the password before save to DB
    bcrypt.genSalt(10, (err, salt) => {
      if (err) return callRes(res, responseError.UNKNOWN_ERROR, err.message);
      bcrypt.hash(newUser.password, salt, async (err, hash) => {
        if (err) return callRes(res, responseError.UNKNOWN_ERROR, err.message);
        newUser.password = hash;
        try {
          let saved = await newUser.save();
          let data = {
            id: saved.id,
            phoneNumber: saved.phoneNumber,
            verifyCode: saved.verifyCode,
            isVerified: saved.isVerified
          }
          return callRes(res, responseError.OK, data);  
        } catch (error) {
          return callRes(res, responseError.CAN_NOT_CONNECT_TO_DB, error.message);
        }
      })
    })
  } catch (error) {
    return callRes(res, responseError.UNKNOWN_ERROR, error.message);
  }
})


// @route  POST it4788/get_verify_code
// @desc   get verified code
// @access Public
router.post('/get_verify_code', (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ msg: "Please enter your phone number" });
  }

  User.findOne({ phoneNumber: phoneNumber }).then(user => {
    if (!user) return res.status(400).json({ msg: "Invalid phone number" });
    else res.json({
      msg: "Success",
      verifyCode: user.verifyCode
    });
  });
});


// @route  POST it4788/check_verify_code
// @desc   check verified code
// @access Public
router.post('/check_verify_code', (req, res) => {
  const { phoneNumber, verifyCode } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ msg: "Please enter your phone number" });
  }

  if (!verifyCode) {
    return res.status(400).json({ msg: "Please enter the code" });
  }

  User.findOne({ phoneNumber }).then(user => {
    if (!user)
      return res.status(400).json({ msg: "Invalid phone number" });
    else if (user.verifyCode != verifyCode)
      return res.status(400).json({ msg: "Wrong code" });
    else {
      user.isVerified = true;
      user.save()
        .then(() => res.json({
          msg: "Your account has been verified",
        }))
        .catch(err => res.json({
          code: 1005,
          message: "Unknown Error"
        }))
    }
  });
});


// @route  POST it4788/login
// @desc   login
// @access Public
router.post('/login', async (req, res) => {
  const { phoneNumber, password } = req.query;
  if (phoneNumber === undefined || password === undefined) {
    return callRes(res, responseError.PARAMETER_IS_NOT_ENOUGH, 'phoneNumber, password');
  }
  if (typeof phoneNumber != 'string' || typeof password != 'string') {
    return callRes(res, responseError.PARAMETER_TYPE_IS_INVALID, 'phoneNumber, password');
  } 
  if (!validInput.checkPhoneNumber(phoneNumber)) {
    return callRes(res, responseError.PARAMETER_VALUE_IS_INVALID, 'phoneNumber');
  }
  if (!validInput.checkUserPassword(password)) {
    return callRes(res, responseError.PARAMETER_VALUE_IS_INVALID, 'password');
  }
  try {
    // check for existing user
    let user = await User.findOne({ phoneNumber });
    if (!user) return callRes(res, responseError.USER_IS_NOT_VALIDATED, 'không có user này');
    if (!user.isVerified) return callRes(res, responseError.USER_IS_NOT_VALIDATED, 'chưa xác thực code verify');
    bcrypt.compare(password, user.password)
      .then(async (isMatch) => {
        if (!isMatch) return callRes(res, responseError.PARAMETER_VALUE_IS_INVALID, 'password');
        user.dateLogin = Date.now();
        try {
          let loginUser = await user.save();
          jwt.sign(
            { id: loginUser.id, dateLogin: loginUser.dateLogin },
            process.env.jwtSecret,
            { expiresIn: 86400 },
            (err, token) => {
              if (err) return callRes(res, responseError.UNKNOWN_ERROR, err.message);
              let data = {
                id: loginUser.id,
                username: (loginUser.name) ? loginUser.name : null,
                token: token,
                avatar: (loginUser.avatar.url) ? loginUser.avatar.url : null,
                active: null
              }
              return callRes(res, responseError.OK, data);
            }
          )
        } catch (error) {
          return callRes(res, responseError.UNKNOWN_ERROR, error.message);
        }
      })
  } catch (error) {
    return callRes(res, responseError.UNKNOWN_ERROR, error.message);
  }
})

router.post("/change_password", (req, res) => {
  const { token, oldPassword, newPassword } = req.body;

  if (!token || !oldPassword || !newPassword) {
    return res.status(400).json({ code: 1004, message: "Please enter all fields" })
  }
  if (!validInput.checkUserPassword(oldPassword)) {
    return res.status(400).json({ code: 1004, message: "Old password is invalid" });
  }
  if (!validInput.checkUserPassword(newPassword)) {
    return res.status(400).json({ code: 1004, message: "New password is invalid" });
  }
  jwt.verify(token, process.env.jwtSecret, (err, user) => {

    // not valid token
    if (("undefined" === typeof (user))) {
      return res.json({ code: 1004, message: "Invalid token" });
    }

    // valid token
    User.findById(user.id, (err, user) => {
      bcrypt.compare(oldPassword, user.password)
        .then(isMatch => {
          if (!isMatch) return res.status(400).json({ code: 9995, message: "Wrong old password" })
          else
            bcrypt.genSalt(10, (err, salt) => {
              bcrypt.hash(newPassword, salt, (err, hash) => {
                if (err) throw err;
                user.password = hash;
                user.save()
                  .then(() => res.json({ code: 1000, message: "Your password has been changed" }))
                  .catch(err => res.json({ code: 1005, message: err.message }))
              })
            })
        })
    })
  })
});
// @route  POST it4788/logout
// @desc   logout
// @access Public
router.post("/logout", verify, async (req, res) => {
  try {
    let user = await User.findById(req.user.id);
    user.dateLogin = "";
    await user.save();
    return callRes(res, responseError.OK);
  } catch (error) {
    return callRes(res, responseError.UNKNOWN_ERROR, error.message);
  }
})

router.post("/set_devtoken", (req, res) => {
  var { token, devtype, devtoken } = req.body;
  if (!token || !devtype || !devtoken)
    return res.status(400).json({ code: 1004, message: "Please enter all fields" });
  jwt.verify(token, process.env.jwtSecret, (err, user) => {

    // not valid token
    if (("undefined" === typeof (user))) {
      return res.json({ code: 1004, message: "Invalid token" });
    }
    if (user.isBlocked) {
      return res.json({ code: 1004, message: "Your account is blocked" });
    }
  });
  if (devtype != "Android" && devtype != "IOS")
    return res.status(400).json({ code: 1004, message: "Invalid device type" });
  else
    return res.status(400).json({ code: 1000, message: "Your device information has been recorded" });
});

router.post("/change_info_after_signup", uploader.single('avatar'), (req, res) => {
  // do what you want
  // Validation
  if (!req.file || !req.body.username) {
    return res.json({ code: 1004, message: "Please enter all the fields" });
  }
  jwt.verify(req.body.token, config.get('jwtSecret'), (err, user) => {

    // not valid token
    if (("undefined" === typeof (user))) {
      return res.json({ code: 1004, message: "Invalid token" });
    }

    User.findById(user.id, (err, user) => {
      let promises;
      promises = uploadFile(req.file);
      promises.then(result => {
        console.log(result);
        user.name = req.body.username;
        user.avatar = result;
        user.save()
          .then(result => {
            res.status(201).send({
              code: 1000,
              message: "Successfully change user information",
              data: {
                id: user.id,
                username: user.name,
                phoneNumber: user.phoneNumber,
                created: Date.now(),
                avatar: user.avatar
              }
            });
          })
          .catch(err => {
            // console.log(err);
            res.status(500).send({
              code: 1001,
              message: "Can not connect to DB"
            });
          });
      });
    })
  })
});

router.post("/check_new_version", (req, res) => {
  var { token, lastUpdate } = req.body;
  if (!token || !lastUpdate)
    return res.status(400).json({ code: 1004, message: "Please enter all fields" });
  jwt.verify(token, process.env.jwtSecret, (err, user) => {

    // not valid token
    if (("undefined" === typeof (user))) {
      return res.json({ code: 1004, message: "Invalid token" });
    }
    if (user.isBlocked) {
      return res.json({ code: 1004, message: "Your account is blocked" });
    }
  })
  if (lastUpdate != currentVersion) {
    return res.json({
      code: 1000,
      message: "You need to update your browser",
      data: {
        version: currentVersion,
        required: 1,
        url: "updateversion.com"
      }
    });
  }
  else {
    return res.json({
      code: 1000,
      message: "Your browser is up to date",
      data: {
        version: currentVersion,
        required: 0,
      }
    });
  }
});

var currentVersion = "1.0";

function uploadFile(file) {
  const newNameFile = new Date().toISOString() + file.originalname;
  const blob = bucket.file(newNameFile);
  const blobStream = blob.createWriteStream({
    metadata: {
      contentType: file.mimetype,
    },
  });
  const publicUrl =
    `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURI(blob.name)}?alt=media`;
  return new Promise((resolve, reject) => {

    blobStream.on('error', reject);
    blobStream.end(file.buffer, resolve({ url: publicUrl }));
  });
}

function random4digit() {
  return Math.floor(Math.random() * 9000) + 1000;
}

module.exports = router;
