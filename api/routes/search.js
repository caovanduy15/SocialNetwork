const router = require('express').Router();
const Post = require('../models/Post');
const Search = require('../models/Search');
const verify = require('../utils/verifyToken');
const removeAccents  = require('../utils/removeAccents');
const { ObjectId } = require('mongodb');
const {responseError, callRes, setAndSendResponse} = require('../response/error');
const validInput = require('../utils/validInput');

// search posts by keyword
router.post('/', verify, (req, res) => {

    var { keyword, index, count} = req.query;

    // PARAMETER_IS_NOT_ENOUGH
    if((index !== 0 && !index) || (count !== 0 && !count) || (keyword !== 0 && !keyword)) {
        console.log("No have parameter index, count");
        return setAndSendResponse(res, responseError.PARAMETER_IS_NOT_ENOUGH);
    }

    // parameter is invalid
    if (typeof keyword != "string" || typeof index != "string" || typeof count != "string"){
        console.log("PARAMETER_TYPE_IS_INVALID");
        return setAndSendResponse(res, responseError.PARAMETER_TYPE_IS_INVALID);
    }

    if(!validInput.checkNumber(index) || !validInput.checkNumber(count)) {
        console.log("chi chua cac ki tu so");
        return setAndSendResponse(res, responseError.PARAMETER_VALUE_IS_INVALID);
    }

    index = parseInt(index, 10);
    count = parseInt(count, 10);
    if(isNaN(index) || isNaN(count)) {
        console.log("PARAMETER_VALUE_IS_INVALID");
        return setAndSendResponse(res, responseError.PARAMETER_VALUE_IS_INVALID);
    }

    console.log("searching posts with keyword: " + keyword)
    var found_posts = []

    Post.find(
        { "described": {$ne: null} }, 
        null, {sort: '-created'},
        (err, posts) => {

            // problem with DB
            if (err) return setAndSendResponse(res, responseError.CAN_NOT_CONNECT_TO_DB);

            // NO_DATA_OR_END_OF_LIST_DATA
            if(posts.length < 1) {
                console.log('No have posts');
                return setAndSendResponse(res, responseError.NO_DATA_OR_END_OF_LIST_DATA);
            }

            const newSearch = Search({
                user: req.user.id,
                keyword: keyword
            })
            newSearch.save()

            // condition 1: match exactly
            posts.forEach( (post, index, object) => {
                if (post["described"].toLowerCase().includes(keyword.toLowerCase())){
                    found_posts.push(post)
                }
            });

            posts = posts.filter(item => !found_posts.includes(item))

            // condition 2: enough words and ignore the order
            var words = keyword.split(" ")
            posts.forEach( (post, index, object) => {
                var accepted = true
                words.forEach(word => {
                    if (!post["described"].toLowerCase().includes(word.toLowerCase())){
                        accepted = false;
                        return;
                    }
                })
                if (accepted) found_posts.push(post)
            });

            posts = posts.filter(item => !found_posts.includes(item))

            // condition 3: 20% of keyword in described and in the right order
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
                if (accepted) found_posts.push(post)
            });

            posts = posts.filter(item => !found_posts.includes(item))

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
                if (accepted) found_posts.push(post)
            });

            posts = posts.filter(item => !found_posts.includes(item))
            found_posts = found_posts.slice(index, index+count)

            return res.json({
                "code": "1000",
                "message": "OK",
                "data": {
                    "posts": found_posts
                }
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