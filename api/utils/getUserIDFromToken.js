const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports.getUserIDFromToken = async function(token) {
    if(!token) {
        return undefined;
    }

    try {
        const verified = jwt.verify(token, process.env.jwtSecret);
        const user = await User.findById(verified.id);
        if (user.dateLogin) {
            var date = new Date(verified.dateLogin);
            if (user.dateLogin.getTime() == date.getTime())
            {
                return user;
            }
        }
        return undefined;
    } catch (err) {
        return undefined;
    }
}