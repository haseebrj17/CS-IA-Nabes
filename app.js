const express = require('express');
const http = require('http');
const app = express(); 
const server = http.createServer(app);
const socketio = require('socket.io');
const io = socketio(server);
const hbs = require('hbs'); 
const session = require('express-session'); 
const cookieParser = require('cookie-parser'); 
require('dotenv').config(); 
const mongoose = require('mongoose'); 
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');
const { Calendar }= require("node-calendar-js");
const db = require("./src/db/dbconn"); 
const Register = require("./src/models/users");
// const Tasks = require("./src/models/tasks");
// const Timeline = require("./src/models/timeline");
// const auth = require("./src/middleware/auth");
const logKey = process.env.SEC_KEY_SES;
// const formatMessage = require("./src/users/messages");
// const createAdapter = require("@socket.io/redis-adapter").createAdapter;
// const redis = require("redis");
const port = process.env.PORT;
const path = require("path");
const templatePath = path.join(__dirname, '/templates/views');
const partialsPath = path.join(__dirname, "/templates/partials")
const publicPath = path.join(__dirname, "/public")
app.use(express.static(publicPath));
app.set("View Engine", hbs);
app.set("views", templatePath);
hbs.registerPartials(partialsPath);

app.use(cookieParser());

// // Express session

app.use(session({
      key: 'flash_sid',
      secret: logKey,
      resave: true,
      saveUninitialized: true,
      cookie: {maxAge: null}
    })
);

// // Flash messages middleware

app.use((req, res, next) =>{
    res.locals.message = req.session.message
    delete req.session.message
    next()
});

const ratings = {underhand: "", overhand: "", spiking: "", setting: "", dumps: "", blocks: "", digs: ""};


app.use(express.json());
app.use(express.urlencoded({extended: false}));

hbs.registerHelper("htmlpresent", async function(value) {
    return new hbs.SafeString('<div class="percent" style="--clr:#ec4899; --num:' + value + '"> <div class="dot"></div><svg><circle cx="70" cy="70" r="70"></circle><circle cx="70" cy="70" r="70"></circle></svg><div class="number"><h2></h2><p>Underhand</p></div></div>')
});

const logData = {loggedIn: false};
const usernames = {username: ""};

app.get('/Login', (req, res) => {
    res.render('login.hbs')
});

app.get('/', (req, res) => {
    usernames.username = req.cookies.user,
    res.render('mainpage.hbs', usernames)
});

app.get('/Matches', (req, res) => {
    res.render('mainpage.hbs')
});

app.get('/Skill', async (req, res) => {
    if(req.cookies.keyrem) {
        const user = req.cookies.user
        const data = await Register.findOne({user}, {underhand: 1, overhand: 1, spiking: 1, setting: 1, digs: 1, dumps: 1, blocks: 1, _id: 0})
        console.log(data)
        ratings.underhand = data.underhand,
        ratings.overhand = data.overhand,
        ratings.spiking = data.spiking,
        ratings.setting = data.setting,
        ratings.dumps = data.dumps,
        ratings.blocks = data.blocks,
        ratings.digs = data.digs
        console.log(ratings)
        res.render('ratings.hbs', ratings)
    } else {
        res.render('ratings.hbs')
    }
});

app.get('/Training', (req, res) => {
    res.render('mainpage.hbs')
});

app.get('/Notify', (req, res) => {
    res.render('mainpage.hbs')
});

app.get('/Logout', (req, res) => {
    res.render('mainpage.hbs')
});

app.get('/Admin', (req, res) => {
    res.render('admin.hbs')
});

app.post('/Admin/Register', async (req, res) => {
    
    try{
        const registerUser = new Register({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
            underhand: req.body.underhand,
            overhand: req.body.overhand,
            spiking: req.body.spiking,
            setting: req.body.setting,
            digs: req.body.digs,
            dumps: req.body.dumps,
            blocks: req.body.blocks
        })

        const userEmail = await Register.findOne({email:registerUser.email});
        const userName = await Register.findOne({username:registerUser.username});

        if(registerUser.name == '' || registerUser.email == '' || registerUser.password == '') {
            req.session.message = {
                type: 'Danger',
                intro: 'Empty fields ',
                message: 'Please fill all the required fields'
            }
            res.redirect('/Admin')
            delete req.session.message
        }
        else if(userEmail) {
            req.session.message = {
                    type: 'Danger',
                    intro: 'Email already exsits ',
                    message: 'Please use another Email or Login using the exisiting Email'
            }
            res.redirect('/Admin')
            delete req.session.message
        }
        else if(userName) {
            req.session.message = {
                    type: 'Danger',
                    intro: 'Username already exsits ',
                    message: 'Please use another Username or Login using the exisiting Username'
            }
            res.redirect('/Admin')
            delete req.session.message
        }
        else if(registerUser.password.length < 6) {
            req.session.message = {
                type: 'Danger',
                intro: 'Password too short ',
                message: 'Please enter a password of at least 6 characters'
            }
            res.redirect('/Admin')
            delete req.session.message
        }
        else if(registerUser == '') {
            req.session.message = {
                type: 'Danger',
                intro: 'Connection Issues ',
                message: 'Please connect to internet, or there is a problem in our backend'
            }
            res.redirect('/Admin')
            delete req.session.message
        }
        else {
            bcrypt.genSalt(10, (err, salt) => 
            bcrypt.hash(registerUser.password, salt, async (err, hash) => {
                if(err) console.log(err);

                registerUser.password = hash;
                
                const token = await registerUser.generateAuthToken()
                console.log(token);

                registerUser.save()
                    .then(user => {
                        res.status(201).redirect('/Login')}
                    )
                    .catch(error => console.log(error))
                })
            )
            req.session.message = {
                type: 'Success',
                intro: 'Registration successful ',
                message: 'Please Login'
            }
        }

    } catch (err){
        res.status(400).send(err);
        req.session.message = {
            type: 'Backend Problem',
            intro: 'Something went wrong ',
            message: 'Cannot register user please try again later'
        }
        res.redirect('/')
        delete req.session.message
    }
});

app.post('/Login', async (req, res) =>{
    try {
        const email = req.body.email;
        const password = req.body.password;
        const userEmail = await Register.findOne({email:email});

        if(userEmail) {
            const validpass = await bcrypt.compare(password, userEmail.password);

            if(validpass) {
                const token = await userEmail.generateAuthToken();
                console.log(token);

                const userName = await userEmail.username;

                res.cookie("keyrem", token, {
                    expires:new Date(Date.now() + 5000000),
                    httpOnly:true,
                    secure:true
                });

                res.cookie("user", userName, {
                    expires:new Date(Date.now() + 5000000),
                    httpOnly:true,
                    secure:true
                })

                req.session.message = {
                    type: 'Success',
                    intro: 'Login successful ',
                    message: 'Welcome to Remedies Member only area! Enjoy'
                }
                res.status(201).redirect('/')
                delete req.session.message
            } else {
                req.session.message = {
                    type: 'Danger',
                    intro: 'Wrong Credentials ',
                    message: 'Either email or password is not correct'
                }
                res.status(400).redirect('/Login')
                delete req.session.message
            }
        } else {
            req.session.message = {
                type: 'Danger',
                intro: 'Email does not exsits ',
                message: 'Please use another Email or Register'
            }
            res.redirect('/Login')
            delete req.session.message
        }
    } catch (err){
        res.status(400).send(err);
        req.session.message = {
            type: 'Backend Problem',
            intro: 'Something went wrong ',
            message: 'Cannot login please try again later'
        }
        res.redirect('/')
    }
});

// //Server live realod for updating HTML and CSS files in browser, only for development session

const livereload = require('livereload');
const { response } = require('express');
const { ALL } = require('dns');
var lrserver = livereload.createServer({
    exts: ['js', 'css', 'hbs', 'html', 'svg']
});
lrserver.watch(partialsPath);
lrserver.watch(templatePath);
lrserver.watch(publicPath);

server.listen(port, () => {
    console.log(`Server is Up and Running at port:`,port)
});
