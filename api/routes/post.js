const express = require('express');
const router = express.Router();


// @route  POST api/auth/create-post
// @desc   create new post
// @access Public
router.post('/create-post', (req, res) => {
    const { title, image, authorId } = req.body;
    if (!title && !image){
        throw new Error('Post title or image is required');
    } 
})