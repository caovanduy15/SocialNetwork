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
                code: "1005",
                message: err
            })
            res.json({
                code: "1000",
                message: "Get user settings successfully",
                data: setting
            })
        }
    )
})


// set push settings for user
router.post('/set_push_settings', verify, (req, res) => {

    const varToString = varObj => Object.keys(varObj)[0];

    const update = {}
    const checkParamInvalid = (map_params) => {
        var isEnough=false;
        for (const [ key, value ] of Object.entries(map_params)) {
            if (value==0 || value==1) {
                isEnough=true
                update[key] = value
            }
            else if (value) return { code: "1003", message: `The param ${varToString({key})} is invalid (0 or 1)`}
            
        }
        if (!isEnough) return { code: "1002", message: "Parameter is not enough" }

        return null
    }

    const { like_comment, from_friends, requested_friend, suggested_friend,
            birthday, video, report, sound_on, notification_on, vibrant_on, led_on } = req.body;
    
    const map_params = { like_comment, from_friends, requested_friend, suggested_friend,
        birthday, video, report, sound_on, notification_on, vibrant_on, led_on }
    
    const isNotValid = checkParamInvalid(map_params)
    if (isNotValid) return res.json(isNotValid)
    console.log(update)
    Setting.findOneAndUpdate(
        { "user": ObjectId(req.user.id) },
        update,
        (err, setting) => {
            if (err) return res.status(500).json({
                code: "1005",
                message: err
            })
            return res.json({
                code: "1000",
                message: "Set settings successfully",
                data: setting
            })
        }
    )
})

module.exports = router;