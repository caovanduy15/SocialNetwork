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
router.post('/register', (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password){
        return res.status(400).json({ msg: "Please Enter All Fields "});
    }

    // check for existing user
    User.findOne({ email })
        .then( user => {
            if (user) return res.status(400).json({ msg: "User has existed "});
            const newUser = new User({
                name,
                email,
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
                                        token: token,
                                        user: {
                                            id: user.id,
                                            name: user.name,
                                            email: user.email
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