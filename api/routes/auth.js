const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

// Item Model
const User = require("../models/User");

// @route  POST api/auth/register
// @desc   Register new user
// @access Public
// Example: Use Postman
// URL: http://127.0.0.1:5000/api/auth/login
// BODY: {
// "email": "nguyen@gmail.com",
// "password": "nguyen123"
//}
router.post('/register', (req, res) => {
    const { name, email, password, phone_number } = req.body;

    if (!name || !email || !password || !phone_number){
        return res.status(400).json({ msg: "Please Enter All Fields "});
    }

    // check for existing user
    User.findOne({ email })
        .then( user => {
            if (user) return res.status(400).json({ msg: "User has existed "});
            const newUser = new User({
                phone_number,
                name,
                email,
                password,
            });

    newUser.verify_code = Math.floor(Math.random() * (99999 - 10000) + 10000);

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
                                token: token,
                                user: {
                                    id: user.id,
                                    name: user.name,
                                    email: user.email,
                                    verify_code: user.verify_code
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
router.post('/get_verify_code', (req, res) => {
    const {phone_number} = req.body;

    if (!phone_number){
      return res.status(400).json({ msg: "Please enter your phone number"});
    }

    User.findOne({ phone_number }).then( user => {
        if (!user) return res.status(400).json({ msg: "Invalid phone number"});
        else res.json({
            msg: "Success",
            verify_code: user.verify_code
        });
    });
});

router.post('/check_verify_code', (req, res) => {
    const {phone_number, verify_code} = req.body;

    if (!phone_number){
      return res.status(400).json({ msg: "Please enter your phone number"});
    }

    if (!verify_code){
        return res.status(400).json({ msg: "Please enter the code"});
    }

    User.findOne({ phone_number }).then( user => {
        if (!user)
            return res.status(400).json({ msg: "Invalid phone number"});
        else if (user.verify_code != verify_code)
            return res.status(400).json({ msg: "Wrong code"});
        else res.json({
            msg: "Your account has been verified",
        });
    });
});

router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ msg: "Please enter all fields" })
    }

    // check for existing user
    User.findOne({ email })
        .then(user => {
            if (!user) return res.status(400).json({ msg: "User doesn't exists" });
            console.log("starting compare");
            // validate password
            bcrypt.compare(password, user.password)
                .then(isMatch => {
                    console.log(`isMatch: ${isMatch}`);
                    if (!isMatch) return res.status(400).json({ msg: "Invalid Credentials" })

                    jwt.sign(
                        { id: user.id },
                        config.get('jwtSecret'),
                        { expiresIn: 3600 },
                        (err, token) => {
                            if (err) throw err;
                            res.json({
                                msg: "Login successfully",
                                token: token,
                                user: {
                                    id: user.id,
                                    name: user.name,
                                    email: user.email
                                }
                            }

                            )
                        }
                    )
                })
        })
})

module.exports = router;
