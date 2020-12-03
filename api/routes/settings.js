const router = require('express').Router();
const Setting = require('../models/Setting');
const verify = require('../utils/verifyToken');
const { ObjectId } = require('mongodb');
const Search = require('../models/Search');


// get push settings of the user
router.post('/get_push_settings', verify, (req, res) => {
    Setting.find(
        { "user": ObjectId(req.user.id) },
        (err, setting) => {
            if (err) res.status(500).json({
                code: 1005,
                message: err
            })
            res.json({
                code: 1000,
                message: "Get user settings successfully",
                data: setting
            })
        }
    )
})


// set push settings for user
router.post('/set_push_settings', verify, (req, res) => {

    const { }

})

module.exports = router;