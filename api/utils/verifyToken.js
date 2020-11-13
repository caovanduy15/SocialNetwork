const jwt = require('jsonwebtoken');
const config = require('config');
const User = require('../models/User');

module.exports = function(req, res, next) {
    const token = req.body.token;
    if(!token) return res.status(401).send({
        code: 9998,
        message: "Token is invalid"
      });

    try {
        const verified = jwt.verify(token, config.get('jwtSecret'));
        User.findById(verified.id , (err, user) => {
            if (err) throw err;
            if (user.dateLogin) {
                var date = new Date(verified.dateLogin);
                if (user.dateLogin.getTime() == date.getTime())
                {
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