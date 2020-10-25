const router = require('express').Router();
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const User = require('../models/User');
const verify = require('../utils/verifyToken');

// @route  POST it4788/comment/set_comment
// @desc   add new comment
// @access Public
router.post('/set_comment', verify, async (req, res) => {

    try {
        // Validation
        const post = await Post.findById(req.body.id);
        if(!post) {
            return res.status(400).send({
                code: 9992,
                message: "Post is not existed"
            });
        }

        const poster = await User.findById(req.user.id);
        if(!poster) return res.status(400).send({
            code: 9995,
            message: "User is not validated",
        });

        // Create Comment
        const comment = new Comment({
            comment: req.body.comment,
            poster: req.user.id,
            post: req.body.id
        });

        // Save comment
        const savedComment = await comment.save();
        if(post.comments.length > 0) {
            post.comments.push(savedComment._id);
        } else {
            post.comments = [savedComment._id];
        }
        const updatedPost = await post.save();

        res.status(200).send({
            code: 1000,
            message: "OK",
            data: {
                id: savedComment._id,
                comment: savedComment.comment,
                created: savedComment.created,
                poster: {
                    id: poster._id,
                    name: poster.name,
                    avatar: null
                }
            },
            is_blocked: null
        });
    } catch (err) {
        console.log(err);
        res.status(400).send({
            code: 1001,
            message: "Can not connect to DB"
        });
    }
});

// @route  POST it4788/comment/get_comment
// @desc   add new comment
// @access Public
router.post('/get_comment', verify, async (req, res) => {
    try {
        const post = await Post.findById(req.body.id).populate('comments').populate({
                path: 'comments',
                populate: {
                    path: 'poster',
                    model: 'users'
                }
            });
        res.status(200).send({
            code: 1000,
            message: "OK",
            data: post.comments.map(comment => {
                return {
                    id: comment._id,
                    comment: comment.comment,
                    created: comment.created,
                    poster: {
                        id: comment.poster._id,
                        name: comment.poster.name,
                        avatar: null
                    },
                    is_blocked: null
                };
                })
            });
    } catch (err) {
        console.log(err);
        res.status(400).send({
            code: 1001,
            message: "Can not connect to DB"
        });
    }
});

module.exports = router;