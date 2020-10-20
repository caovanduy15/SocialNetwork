const router = require('express').Router();
const Post = require('../models/Post');
const verify = require('../verifyToken');

router.post('/', verify, async (req, res) => {

    const userExist = await User.findById(req.user.id);
    if(!userExist) return res.status(400).send({
        code: 9995,
        message: "User is not validated",
    });

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