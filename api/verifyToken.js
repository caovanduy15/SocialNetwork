const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function(req, res, next) {
    const token = req.body.token;
    if(!token) return res.status(401).send('Access Denied');

    try {
        const verified = jwt.verify(token, config.get('jwtSecret'));
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).send({
            code: 9998,
            message: "Token is invalid"
          });
    }
}