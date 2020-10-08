const router = require('express').Router();
const Post = require('../models/Post');
const verify = require('../verifyToken');

router.post('/add_post', verify, async (req, res) => {

    const post = new Post({
        author: req.user.id,
        described: req.body.described,
        status: req.body.status
    });

    try {
        const savedPost = await post.save();
        console.log(savedPost);
        res.status(200).send({
            code: 1000,
            message: "OK",
            data: {
                id: savedPost._id,
                url: null
            }
        });
    } catch (err) {
        res.status(400).send({
            code: 1001,
            message: "Can not connect to DB"
        });
    }
});

module.exports = router;