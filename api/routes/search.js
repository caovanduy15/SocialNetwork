const router = require('express').Router();
const Post = require('../models/Post');
const verify = require('../utils/verifyToken');


router.post('/', verify, (req, res) => {
    const { keyword, index, count} = req.body;

    user = req.user;

    // if we get none query params then return []
    if (!keyword && !index && !count) return [];

    User.find({
        $or: [
          { name: new RegExp("^" + name, 'i') },
          { phoneNumber: new RegExp("^" + phoneNumber) },
        ],
    }, (err, users) => {
        if (err) res.status(500).json({
            code: 1005,
            message: err
        })
        var userMap = {};
        users.forEach(user => {
            userMap[user._id] = user;
        });
        res.json({
            "code": 1000,
            "users": userMap
        })
    });
  
})

module.exports = router;