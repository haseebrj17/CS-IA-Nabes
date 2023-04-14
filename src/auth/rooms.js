const Register = require("../models/user");

const rooms = async (req, res, next) =>{
    try {
        const token = req.cookies.keyrem;
    
        if (token){ 
            

            req.token = token;
            req.user = user;

            next();
        } else {
            req.session.message = {
                type: 'Danger',
                intro: 'Invalid Token ',
                message: 'Login to view member only area'
            }
            res.redirect('/Login')
        }

    } catch (error) {
        res.status(401).send(error);
        req.session.message = {
            type: 'Danger',
            intro: 'Invalid Token ',
            message: 'please try again later'
        }
        res.redirect('/')
    }
}


module.exports = auth;
