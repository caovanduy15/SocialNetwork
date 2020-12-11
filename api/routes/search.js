const router = require('express').Router();
const Post = require('../models/Post');
const Search = require('../models/Search');
const verify = require('../utils/verifyToken');
const removeAccents  = require('../utils/removeAccents');
const { ObjectId } = require('mongodb');
const {responseError, callRes} = require('../response/error');

// search posts by keyword
router.post('/', verify, (req, res) => {

    const { keyword, index, count} = req.body;

    // if we get none query params then return []
    if (!keyword) return res.status(400).json({
        "code": 1002,
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

            const newSearch = Search({
                user: req.user.id,
                keyword: keyword
            })
            newSearch.save()

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

            return res.json({
                "code": 1000,
                "message": `found ${found_posts.length} posts with search keyword \'${keyword}\'`,
                "posts": found_posts
            })

        }
    )
  
})


// get saved search
router.post('/get_saved_search', verify, (req, res) => {
    const user = req.user;
    Search.find(
        { user: user.id },
        null,
        { sort: '-createdAt'},
        (err, searches) => {
            if (err) return res.status(500).json({
                code: 1005,
                message: err
            })
            unique_searches = Array.from(new Set(searches.map( item => item["keyword"] )))
                                    .map(kw => {
                                        console.log(kw)
                                        return searches.find(item => item["keyword"] === kw)
                                    })

            return res.json({
                "code": 1000,
                "message": `found ${unique_searches.length} searches in history`,
                "posts": unique_searches.slice(0,20)
            })
            
        }
    )
})


// delete saved search
router.post('/del_saved_search', verify, async (req, res) => {
    const { search_id, all } = req.body
    console.log(search_id)
    console.log(all)
    if (!search_id && all === null) return res.status(400).json({
        "code": 1002,
        "message": "You must provide search_id or all parameter to del search history"
    })

    if (all === 0 && !search_id) return res.status(400).json({
        "code": 1002,
        "message": "You must provide search_id to del search history"
    })

    // if all=1 delete all search history of user
    if (all === 1) {
        var searches = await Search.find({ user: req.user.id });
        if (!searches) return res.json({ "code": 9994, "message": "You don't have anything to delete all"})
        else Search.deleteMany(searches, (err, result) => {
            if (err) {
                res.json({
                    "code": 1005,
                    "message": "Unkown Errors"
                })
            }else{
                res.json({
                    "code": 1000,
                    "message": `deleted successfully ${searches.length} searches in history`
                })
            }
        })
    }

    // else del search by search id
    var search = await Search.findOne({
        user: req.user.id,
        _id: new ObjectId(search_id)
    })
    console.log(search)
    if (!search) res.json({ "code": 9994, "message": "You don't have anything to delete all"})
    else Search.deleteOne(
        search,
        (err, result) => {
        if (err) {
            res.json({
                "code": 1005,
                "message": err
            })
        }else{
            res.json({
                "code": 1000,
                "message": `deleted successfully ${search_id} searches in history`
            })
        }
    })
})


module.exports = router;