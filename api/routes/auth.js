const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const validInput = require('../utils/validInput');

// Item Model
const User = require("../models/User");

// @route  POST it4788/signup
// @desc   Register new user
// @access Public
router.post('/register', (req, res) => {
    const { name, password, phoneNumber } = req.body;

    if (!name || !password || !phoneNumber){
        return res.status(400).json({ msg: "Please Enter All Fields "});
    }
    // check for existing user
    User.findOne({ phoneNumber })
        .then( user => {
            if (user) return res.status(400).json({ code: 9996, message: "User existed "});
            const newUser = new User({
                phoneNumber,
                password
            });

            // hash the password before save to DB
            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(newUser.password, salt, (err, hash) => {
                    if (err) throw err;
                    newUser.password = hash;
                    newUser.verify_code = Math.floor(Math.random() * (99999 - 10000) + 10000)
                    newUser.save()
                        .then( user => {
                            // send verify code
                            res.json({
                                code: 1000,
                                message: "OK",
                                user: {
                                    id: user.id,
                                    phoneNumber: user.phoneNumber
                                }
                            })
                        })
                        .catch (err => {
                            res.json({
                                code: 1005,
                                message: "Unknown Error"
                            })
                        })
                })
        })
    })
})


// @route  POST it4788/get_verify_code
// @desc   get verified code
// @access Public
router.post('/get_verify_code', (req, res) => {
    const {phoneNumber} = req.body;

    if (!phoneNumber){
      return res.status(400).json({ msg: "Please enter your phone number"});
    }

    User.findOne({ phoneNumber }).then( user => {
        if (!user) return res.status(400).json({ msg: "Invalid phone number"});
        else res.json({
            msg: "Success",
            verify_code: user.verify_code
        });
    });
});


// @route  POST it4788/check_verify_code
// @desc   check verified code
// @access Public
router.post('/check_verify_code', (req, res) => {
    const {phoneNumber, verify_code} = req.body;

    if (!phoneNumber){
      return res.status(400).json({ msg: "Please enter your phone number"});
    }

    if (!verify_code){
        return res.status(400).json({ msg: "Please enter the code"});
    }

    User.findOne({ phoneNumber }).then( user => {
        if (!user)
            return res.status(400).json({ msg: "Invalid phone number"});
        else if (user.verify_code != verify_code)
            return res.status(400).json({ msg: "Wrong code"});
        else res.json({
            msg: "Your account has been verified",
        });
    });
});


// @route  POST it4788/check_verify_code
// @desc   login
// @access Public
router.post('/login', (req, res) => {
    const { phoneNumber, password } = req.body;

    if (!phoneNumber || !password) {
        return res.status(400).json({code: 1004, message: "Please enter all fields" })
    }
    if (!validInput.checkPhoneNumber(phoneNumber)){
        return res.status(400).json({ code: 1004, message: "phone number is invalid"});
    }
    if (!validInput.checkUserPassword(password)){
        return res.status(400).json({code: 1004, message: "password is invalid"});
    }
    // check for existing user
    User.findOne({ phoneNumber })
        .then(user => {
            if (!user) return res.status(400).json({code:9995, message: "User doesn't exists" });
            // validate password
            bcrypt.compare(password, user.password)
                .then(isMatch => {
                    if (!isMatch) return res.status(400).json({code: 9995, message: "Wrong Password" })
                    user.dateLogin = Date.now();
                    user.save()
                        .then(loginUser => {
                            jwt.sign(
                                { id: loginUser.id, dateLogin: loginUser.dateLogin },
                                config.get('jwtSecret'),
                                { expiresIn: 3600 },
                                (err, token) => {
                                    if (err) throw err;
                                    res.json({
                                        code: 1000,
                                        message: "Login successfully",
                                        token: token,
                                        user: {
                                            id: user.id,
                                            phoneNumber: user.phoneNumber,
                                            dateLogin: user.dateLogin
                                        }
                                    })
                                }
                            )
                        })

                })
        })
})


// @route  POST it4788/logout
// @desc   logout
// @access Public
router.post("/logout",(req, res) => {
    var { token } = req.body;

    // no token
    if (!token) return res.status(400).json({code: 1004, message: "not correct parameter!"});
    jwt.verify(token,config.get('jwtSecret'), (err, user) =>{

        // not valid token
        if (("undefined" === typeof (user))) {
            return res.json({code: 1004, message: "not correct parameter!"});
        }

        // valid token
        User.findById(user.id, (err, rslUser)=> {
            rslUser.dateLogin = "";
            rslUser.save()
                .then( () => res.json({code: 1000, message: "Log out success"}))
                .catch(err => res.json({code: 1005, message: err.message}))
        })
    })
})

module.exports = router;
