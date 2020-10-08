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

router.post('/get_post', verify, (req, res) => {
    const posts = Post.findById(req.body.id).populate('author').
    exec(function (err, post) {
      if (err) return res.status(404).send({
        code: 9992,
        message: "Post is not existed"
      });

      res.send({
        code: 1000,
        message: "OK",
        data: {
            id: post._id,
            described: post.described,
            created: post.created,
            modified: null,
            like: null,
            comment: null,
            is_liked: null,
            author: {
                id: post.author.id,
                name: post.author.name
            },
            state: post.state
        }
      });
    });;
});

module.exports = router;