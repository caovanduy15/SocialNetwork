const router = require('express').Router();
const Post = require('../models/Post');
const verify = require('../utils/verifyToken');

// @route  POST it4788/post/get_posts
// @desc   get posts
// @access Public
router.post('/get_posts', verify, (req, res) => {
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


// @route  POST it4788/post/add_post
// @desc   add new post
// @access Public
router.post('/add_post', verify, async (req, res) => {

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


// @route  POST it4788/post/delete_post
// @desc   delete a post
// @access Public
router.delete('/delete_post', verify, (req, res) => {
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


// @route  POST it4788/post/edit_post
// @desc   edit an existing post
// @access Public
router.put('/edit_post', verify, (req, res) => {
    var { id, status, image, image_del, image_sort, video, described, auto_accept, auto_block } = req.body;
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
            post.status = status;
            post.described = described;
            post.save()
                .then(() => res.status(200).json({code: 1000, message: "OK"}))
                .catch(err => res.json({code: 1005, message: "Unknown Error"}));
        }
    })
})

module.exports = router;