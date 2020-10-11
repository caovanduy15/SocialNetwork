const router = require('express').Router();
const Post = require('../models/Post');
const verify = require('../verifyToken');

router.post('/', verify, (req, res) => {
    Post.findById(req.body.id).populate('author').
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
            like: post.likedUser.length,
            comment: null,
            is_liked: post.likedUser.includes(req.user.id),
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