const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const validInput = require('../utils/validInput');

// Item Model
const User = require("../models/User");

// @route  POST api/auth/signup
// @desc   Register new user
// @access Public
// Example: Use Postman
// URL: http://127.0.0.1:5000/api/auth/signup
// BODY: {
// "phoneNumber": "0789554152",
// "password": "nguyen123"
//}
router.post('/signup', (req, res) => {
    const { phoneNumber, password } = req.body;

    if (!phoneNumber || !password){
        return res.status(400).json({ code: 1004, message: "Please Enter All Fields "});
    }
    if (!validInput.checkPhoneNumber(phoneNumber)){
        return res.status(400).json({ code: 1004, message: "phone number is invalid"});
    }
    if (!validInput.checkUserPassword(password)){
        return res.status(400).json({code: 1004, message: "password is invalid"});
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
                    newUser.save()
                        .then( user => {
                            jwt.sign(
                                { id: user.id },
                                config.get('jwtSecret'),
                                { expiresIn: 86400},
                                (err, token) => {
                                    if (err) throw err;
                                    res.json({
                                        code: 1000,
                                        message: "OK",
                                        token: token,
                                        user: {
                                            id: user.id,
                                            phoneNumber: user.phoneNumber
                                        }
                                    })
                                }
                            )
                        })
                })
            })
        })
})

// @route  POST api/auth/login
// @desc   Authenticate user
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
            console.log("starting compare");
            // validate password
            bcrypt.compare(password, user.password)
                .then(isMatch => {
                    console.log(`isMatch: ${isMatch}`);
                    if (!isMatch) return res.status(400).json({code: 9995, message: "Wrong Password" })

                    jwt.sign(
                        { id: user.id },
                        config.get('jwtSecret'),
                        { expiresIn: 3600 },
                        (err, token) => {
                            if (err) throw err;
                            res.json({
                                message: "Login successfully",
                                token: token,
                                user: {
                                    id: user.id,
                                    phoneNumber: user.phoneNumber
                                }
                            }

                            )
                        }
                    )
                })
        })
})

module.exports = router;