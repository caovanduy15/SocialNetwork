const router = require('express').Router();
const Post = require('../models/Post');
const verify = require('../utils/verifyToken');
var multer  = require('multer');
const { Storage } = require('@google-cloud/storage');
const MAX_IMAGE_NUMBER = 4;
const MAX_SIZE_IMAGE = 4 * 1024 * 1024; // for 4MB
const MAX_VIDEO_NUMBER = 1;
const MAX_SIZE_VIDEO = 10 * 1024 * 1024; // for 10MB
const MAX_WORD_POST = 500;

// Create new storage instance with Firebase project credentials
const storage = new Storage({
    projectId: process.env.GCLOUD_PROJECT_ID,
    keyFilename: process.env.GCLOUD_APPLICATION_CREDENTIALS,
});

// Create a bucket associated to Firebase storage bucket
const bucket =
    storage.bucket(process.env.GCLOUD_STORAGE_BUCKET_URL);

// Initiating a memory storage engine to store files as Buffer objects
const uploader = multer({
    storage: multer.memoryStorage(),
});

function countWord(str) {
    return str.split(" ").length;
}

// @route  POST it4788/post/get_list/posts
// @desc   get list posts
// @access Public
router.post('/get_list_posts', verify, async (req, res) => {
    if((req.body.index !== 0 || req.body.count !== 0) && (!req.body.index || !req.body.count)) {
        console.log("No have parameter index, count");
        return res.status(500).send({
            code: 1002,
            message: "Parameter is not enought"
        });
    }

    const posts = await Post.find().populate('author').sort("-created");

    if(!posts) {
        console.log('No have posts');
        return res.status(500).send({
            code: 9994,
            message: "No data or end of list data"
        });
    }

    res.status(200).send({
                    code: 1000,
                    message: "OK",
                    data: posts.map(post => {
                        return {
                            id: post._id,
                            described: post.described,
                            created: post.created,
                            modified: post.modified,
                            like: post.likedUser.length,
                            comment: post.comments.length,
                            is_liked: post.likedUser.includes(req.user.id),
                            image: post.image.map(image => { return {id: image._id, url: image.url};}),
                            video: post.video,
                            author: {
                                id: post.author._id,
                                name: post.author.name
                            },
                            state: post.state
                        }
                    })
                  });
});

// @route  POST it4788/post/get_post
// @desc   get post
// @access Public
router.post('/get_post', verify, (req, res, next) => {
    if(!req.body.id) {
        console.log("No have parameter id");
        return res.status(500).send({
            code: 1002,
            message: "Parameter is not enought"
        });
    }
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
                        image: post.image.map(image => { return {id: image._id, url: image.url};}),
                        video: post.video,
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
            if(err.kind == "ObjectId") {
                console.log("Sai id");
                return res.status(500).send({
                    code: 1004,
                    message: "Parameter value is invalid"
                });
            }
            res.status(500).send({
                code: 1001,
                message: "Can not connect to DB"
            });
        });
});


function uploadFile(file) {
    const newNameFile = new Date().toISOString() + file.originalname;
        const blob = bucket.file(newNameFile);
        const blobStream = blob.createWriteStream({
        metadata: {
            contentType: file.mimetype,
        },
    });
    const publicUrl =
        `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURI(blob.name)}?alt=media`;
    return new Promise((resolve, reject) => {

        blobStream.on('error', reject);
        blobStream.end(file.buffer, resolve({url: publicUrl}));
    });
}

// @route  POST it4788/post/add_post
// @desc   add new post
// @access Public
var cpUpload = uploader.fields([{ name: 'image'}, { name: 'video'}]);
router.post('/add_post', cpUpload, verify, async (req, res, next) => {
    try {
        if(req.body.described && countWord(req.body.described) > MAX_WORD_POST) {
            console.log("MAX_WORD_POST");
            return res.status(500).send({
                code: 1004,
                message: "Parameter value is invalid"
            });
        }

        if(req.files.image && req.files.video) {
            console.log("Have image and video");
            return res.status(500).send({
                code: 1003,
                message: "Parameter type is invalid"
            });
        }

        if(req.files.image) {
            if(req.files.image.length > MAX_IMAGE_NUMBER) {
                console.log("Max image number");
                return res.status(500).send({
                    code: 1008,
                    message: "Maximum number of images"
                });
            }

            for(const image of req.files.image) {
                const filetypes = /jpeg|jpg|png/;
                const mimetype = filetypes.test(image.mimetype);
                if(!mimetype) {
                    console.log("Mimetype image is invalid");
                    return res.status(500).send({
                        code: 1003,
                        message: "Parameter type is invalid"
                    });
                }

                if (image.buffer.byteLength > MAX_SIZE_IMAGE) {
                    console.log("Max image file size");
                    return res.status(500).send({
                        code: 1008,
                        message: "File size is too big"
                    });
                }
            }
        }

        if(req.files.video) {
            if(req.files.video.length > MAX_VIDEO_NUMBER) {
                console.log("MAX_VIDEO_NUMBER");
                return res.status(500).send({
                    code: 1008,
                    message: "Maximum number of video"
                });
            }

            for(const video of req.files.video) {
                const filetypes = /mp4/;
                const mimetype = filetypes.test(video.mimetype);
                if(!mimetype) {
                    console.log("Mimetype video is invalid");
                    return res.status(500).send({
                        code: 1003,
                        message: "Parameter type is invalid"
                    });
                }

                if (video.buffer.byteLength > MAX_SIZE_VIDEO) {
                    console.log("Max video file size");
                    return res.status(500).send({
                        code: 1008,
                        message: "File size is too big"
                    });
                }
            }
        }

        let promises;
        if(req.files.image) {
            // This is where we'll upload our file to Cloud Storage
            // Create new blob in the bucket referencing the file
            promises = req.files.image.map(image => {
                return uploadFile(image);
            });
        }

        if(req.files.video) {
            // This is where we'll upload our file to Cloud Storage
            // Create new blob in the bucket referencing the file
            promises = req.files.video.map(video => {
                return uploadFile(video);
            });
        }

        if(promises) {
            Promise.all(promises).then(file => {
                // do what you want
                // Validation
                let post;

                if(req.files.image) {
                    // Create Post
                    post = new Post({
                        author: req.user.id,
                        described: req.body.described,
                        status: req.body.status,
                        image: file
                    });
                } else if(req.files.video) {
                    // Create Post
                    post = new Post({
                        author: req.user.id,
                        described: req.body.described,
                        status: req.body.status,
                        video: file[0]
                    });
                } else {
                    // Create Post
                    post = new Post({
                        author: req.user.id,
                        described: req.body.described,
                        status: req.body.status
                    });
                }


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
            }).catch(err => {
                // handle I/O error
                console.error(err);
                res.status(500).send({
                    code: 1007,
                    message: "Upload file failed"
                });
            });
    } else {
        return res.status(500).send({
            code: 1003,
            message: "Parameter type is invalid"
        });
    }
    } catch (error) {
        res.status(500).send({
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