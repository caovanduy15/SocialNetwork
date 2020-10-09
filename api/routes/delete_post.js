const express = require('express');
const verifyToken = require('../verifyToken');
const User = require('../models/User');
const Post = require('../models/Post');
var router = express.Router();

// API DELETE /it4788/delete_post
// EXAMPLE BODY: {
//      "token": "xxxxxx",
//      "id": "5f80246e161f7f4bf594cd2b"
// }
router.delete('/', verifyToken, (req, res) => {
    var { id } = req.body;
    if (!id) return res.status(400).json({code:1002, message: "not enough param"});
    var user = req.user;
    Post.findById(id).populate('author').exec( (err, post) => {
        if (!post) return res.status(400).json({code: 1004, message: "Not found post"})
        console.log(post.author._id);
        console.log(user.id);
        if (! post.author._id == user.id) {
            res.status(400).json({code: 1009, message: "not access because user not owner of post"})
        } else {
            // update data
            Post.deleteOne(post)
                .then(() => res.status(200).json({code: 1000, message: "OK"}))
                .catch(err => res.json({code: 1005, message: "Unknown Error"}));
        }
    })
})

module.exports = router;