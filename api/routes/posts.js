const config = require("config");
const router = require('express').Router();
const Post = require('../models/Post');
const verify = require('../utils/verifyToken');
var multer  = require('multer');
const { Storage } = require('@google-cloud/storage');

// Create new storage instance with Firebase project credentials
const storage = new Storage({
    projectId: config.get("GCLOUD_PROJECT_ID"),
    keyFilename: config.get("GCLOUD_APPLICATION_CREDENTIALS"),
});

// Create a bucket associated to Firebase storage bucket
const bucket =
    storage.bucket(config.get("GCLOUD_STORAGE_BUCKET_URL"));

// Initiating a memory storage engine to store files as Buffer objects
const uploader = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // keep images size < 5 MB
    },
    fileFilter: function(req, file, cb) {
        checkFileType(file, cb);
    }
});

function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|mp4/;
    const mimetype = filetypes.test(file.mimetype);

    if(mimetype) {
        cb(null, true);
    } else {
        cb(new Error('I don\'t have a clue!'), false);
    }
}

// @route  POST it4788/post/get_list/posts
// @desc   get list posts
// @access Public
router.post('/get_list_posts', /*verify,*/ (req, res) => {

    res.send("Get list posts");
});

// @route  POST it4788/post/get_post
// @desc   get post
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
                        image: post.image.length > 0 ? post.image.map(image => { return {id: image._id, url: image.url};}) : undefined,
                        video: post.video.length > 0 ? post.video : undefined,
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
var cpUpload = uploader.fields([{ name: 'image', maxCount: 3 }, { name: 'video', maxCount: 1 }]);
router.post('/add_post', function (req, res, next) {
    cpUpload(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading.
        if(err.code == "LIMIT_UNEXPECTED_FILE" && err.field == 'image' ) {
            return res.status(500).send({
                code: 1008,
                message: "Maximum number of images"
            });
        }
        if(err.code == "LIMIT_FILE_SIZE" && err.field == 'image' ) {
            return res.status(500).send({
                code: 1008,
                message: "File size is too big"
            });
        }
        if(err.code == "LIMIT_UNEXPECTED_FILE" && err.field == 'video' ) {
            return res.status(500).send({
                code: 1008,
                message: "Maximum number of video"
            });
        }
        if(err.code == "LIMIT_FILE_SIZE" && err.field == 'video' ) {
            return res.status(500).send({
                code: 1008,
                message: "File size is too big"
            });
        }

        return res.send(err);
      } else if (err) {
        // An unknown error occurred when uploading.
        return res.status(500).send({
            code: 1003,
            message: "Parameter type is invalid"
        });
      }

      // Everything went fine.
      next();
    })
    }, verify, async (req, res, next) => {
    try {
        // console.log(req.files.image === undefined);
        // return res.send(req.files.image);
        if(req.files.image && req.files.video) {
            return res.status(500).send({
                code: 1003,
                message: "Parameter type is invalid"
            });
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
                        video: {
                            url: file[0].url
                        }
                    });
                    console.log(post);
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