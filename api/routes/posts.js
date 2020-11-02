const router = require('express').Router();
const Post = require('../models/Post');
const verify = require('../utils/verifyToken');
var multer  = require('multer')
var upload = multer({ dest: 'uploads/' })

// @route  POST it4788/post/get_posts
// @desc   get posts
// @access Public
router.post('/get_post', verify, (req, res, next) => {
    // Get post
    Post.findById(req.body.id)
        .populate('author')
        .exec()
        .then(post => {
            // console.log(post);
            if(post) {
                res.status(200).send({
                    code: 1000,
                    message: "OK",
                    data: {
                        id: post._id,
                        described: post.described,
                        created: post.created,
                        modified: post.modified,
                        like: post.likedUser.length,
                        comment: post.comments.length,
                        is_liked: post.likedUser.includes(req.user.id),
                        author: {
                            id: post.author._id,
                            name: post.author.name
                        },
                        state: post.state
                    }
                  });
            } else {
                res.status(404).send({
                    code: 9992,
                    message: "Post is not existed"
                });
            }
        })
        .catch(err => {
            // console.log(err);
            res.status(500).send({
                code: 1001,
                message: "Can not connect to DB"
            });
        });
});


// @route  POST it4788/post/add_post
// @desc   add new post
// @access Public
var cpUpload = upload.fields([{ name: 'image', maxCount: 3 }, { name: 'video', maxCount: 1 }])
router.post('/add_post', cpUpload, verify, (req, res, next) => {
    // Validation

    // Create Post
    const post = new Post({
        author: req.user.id,
        described: req.body.described,
        status: req.body.status
    });

    // Save Post
    post.save()
        .then(result => {
            // console.log(result);
            res.status(201).send({
                code: 1000,
                message: "OK",
                data: {
                    id: result._id,
                    url: null
                }
            });
        })
        .catch(err => {
            // console.log(err);
            res.status(500).send({
                code: 1001,
                message: "Can not connect to DB"
            });
        });
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