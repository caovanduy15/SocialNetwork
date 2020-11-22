const router = require('express').Router();
const Post = require('../models/Post');
const verify = require('../utils/verifyToken');
const removeAccents  = require('../utils/removeAccents');


router.post('/', verify, (req, res) => {

    const { keyword, index, count} = req.body;

    // if we get none query params then return []
    if (!keyword) return res.status(400).json({
        "code": 500,
        "message": "You must add a keyword to search something"
    });

    console.log("searching posts with keyword: " + keyword)

    const found_posts = []

    Post.find(
        {}, 
        (err, posts) => {
            if (err) res.status(500).json({
                        code: 1005,
                        message: err
            })

            console.log(posts.length)
            // condition 1: match exactly
            var tmp = []
            posts.forEach( (post, index, object) => {
                if (post["described"].toLowerCase().includes(keyword.toLowerCase())){
                    var item = {}
                    item[post._id] = post["described"]
                    item["criteria"] = 1
                    tmp.push(post)
                    found_posts.push(item)
                }
            });

            posts = posts.filter(item => !tmp.includes(item))

            // condition 2: enough words and ignore the order
            tmp = []
            var words = keyword.split(" ")
            posts.forEach( (post, index, object) => {

                var accepted = true
                words.forEach(word => {
                    if (!post["described"].toLowerCase().includes(word.toLowerCase())){
                        accepted = false;
                        return;
                    }
                })
                if (accepted){
                    var item = {}
                    item[post._id] = post["described"]
                    item["criteria"] = 2
                    tmp.push(post)
                    found_posts.push(item)
                }
            });

            posts = posts.filter(item => !tmp.includes(item))

            // condition 3: 20% of keyword in described and in the right order
            tmp = []
            num_words = Math.ceil(words.length*0.2)
            console.log("num words: " + num_words)
            search_text = []
            console.log(words.slice(0,1))
            for( var i=0; i <= (words.length-num_words); i++ ){
                search_text.push(words.slice(i, (i+num_words)).join(" "));
            }

            posts.forEach( (post, index, object) => {
                var accepted = false
                search_text.forEach(text => {
                    if (post["described"].toLowerCase().includes(text.toLowerCase())){
                        accepted = true;
                        return;
                    }
                })
                if (accepted){
                    var item = {}
                    item[post._id] = post["described"]
                    item["criteria"] = 3
                    tmp.push(post)
                    found_posts.push(item)
                }
            });

            posts = posts.filter(item => !tmp.includes(item))

            // condition 4: ignore accents
            posts.forEach( (post, index, object) => {
                var accepted = false
                search_text.forEach(text => {
                    var described = removeAccents(post["described"].toLowerCase())
                    text = removeAccents(text.toLowerCase());
                    if (described.includes(text)){
                        accepted = true;
                        return;
                    }
                })
                if (accepted){
                    var item = {}
                    item[post._id] = post["described"]
                    item["criteria"] = 4
                    tmp.push(post)
                    found_posts.push(item)
                }
            });

            posts = posts.filter(item => !tmp.includes(item))

            res.json({
                "code": 1000,
                "posts": found_posts
            })

        }
    )
  
})

module.exports = router;