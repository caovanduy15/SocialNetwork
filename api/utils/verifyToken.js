const jwt = require('jsonwebtoken');
const User = require('../models/User');
var {responseError, setAndSendResponse} = require('../response/error');

module.exports = function (req, res, next) {
    const token = req.body.token;
    if(token !== 0 && !token) {
        console.log("PARAMETER_IS_NOT_ENOUGH");
        return setAndSendResponse(res, responseError.PARAMETER_IS_NOT_ENOUGH);
    }
    if(token && typeof token !== "string") {
        console.log("PARAMETER_TYPE_IS_INVALID");
        return setAndSendResponse(res, responseError.PARAMETER_TYPE_IS_INVALID);
    }

    try {
        const verified = jwt.verify(token, process.env.jwtSecret);
        User.findById(verified.id, (err, user) => {
            if (err) throw err;
            if (user.dateLogin) {
                var date = new Date(verified.dateLogin);
                if (user.dateLogin.getTime() == date.getTime()) {
                    req.user = verified;
                    next();
                } else {
                    res.status(400).send({
                        code: 9998,
                        message: "User has logout"
                    });
                }
            } else {
                res.status(400).send({
                    code: 9998,
                    message: "User has logout"
                });
            }

        })

    } catch (err) {
        res.status(400).send({
            code: 9998,
            message: "Token is invalid"
        });
    }
}