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
const { Calendar } = require("node-calendar-js");
const db = require("./src/db/dbconn");
const Register = require("./src/models/users");
const Chat = require("./src/models/chat");
const Training = require("./src/models/training");
const Timeline = require("./src/models/timeline");
const Admin = require("./src/models/admin");
// const Tasks = require("./src/models/tasks");
// const Timeline = require("./src/models/timeline");
// const auth = require("./src/middleware/auth");
const logKey = process.env.SEC_KEY_SES;
// const formatMessage = require("./src/users/messages");
// const createAdapter = require("@socket.io/redis-adapter").createAdapter;
// const redis = require("redis");
const port = process.env.PORT;
const path = require("path");
const createAdapter = require("@socket.io/redis-adapter").createAdapter;
const redis = require("redis");
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
    cookie: { maxAge: null }
})
);

hbs.registerHelper("ifeqday", function (a, b, options) {
    if (a == b) {
        return (this.name)
    }
});

hbs.registerHelper("ifinc", function (a) {
    if (a >= 0) {
        const b = a + 1;
        console.log(b)
        return new hbs.SafeString('{{' + b + '.task}}')
    }
});

hbs.registerHelper("ifeqdate", function (a, b, options) {
    if (a == b) {
        return (this.day)
    }
});

// // Flash messages middleware

app.use((req, res, next) => {
    res.locals.message = req.session.message
    delete req.session.message
    next()
});

const ratings = { underhand: "", overhand: "", spiking: "", setting: "", dumps: "", blocks: "", digs: "", loggedIn: false };
const notifications = { message: "", username: "", date: "", room: "" };
const logData = { loggedIn: false, username: "" }

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

hbs.registerHelper("htmlpresent", async function (value) {
    return new hbs.SafeString('<div class="percent" style="--clr:#ec4899; --num:' + value + '"> <div class="dot"></div><svg><circle cx="70" cy="70" r="70"></circle><circle cx="70" cy="70" r="70"></circle></svg><div class="number"><h2></h2><p>Underhand</p></div></div>')
});

const calendar = new Calendar({
    year: Date.now.year,
    month: 0
});

const calHtml = calendar.toJSON();

var calendarTimeline = { calendar: calHtml };

const { createClient } = redis;
const {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers,
} = require("./src/users/users");

const botName = "Dost Bot";

io.on("connection", (socket) => {
    console.log(io.of("/").adapter);
    socket.on("joinRoom", async ({ username, room }) => {
        const user = userJoin(socket.id, username, room);

        const oldMessage = await Chat.find({ room }, { message: 1, username: 1, date: 1, room: 1, _id: 0 })
        console.log(oldMessage)

        socket.join(user.room);

        // Welcome current user 
        socket.emit("message", formatMessage(botName, "Welcome to Dost Community!"));

        // socket.emit("Old Messages", oldMessage)
        // socket.on("Old Messages", (oldMessage) => {
        //     io.to(username.oldMessage).emit("message", formatMessage(oldMessage.username, oldMessage.message));
        // })

        // Broadcast when a user connects
        socket.broadcast
            .to(user.room)
            .emit(
                "message",
                formatMessage(botName, `${user.username} has joined the chat`)
            );

        // Send users and room info
        io.to(user.room).emit("roomUsers", {
            room: user.room,
            users: getRoomUsers(user.room),
        });
    });

    // Listen for chatMessage
    socket.on("chatMessage", (msg) => {
        const user = getCurrentUser(socket.id);

        const newMsg = new Chat({ message: msg, username: user.username, room: user.room })

        newMsg.save(function (err) {
            if (err) throw err;
            io.to(user.room).emit("message", formatMessage(user.username, msg));
        });
    });

    // Runs when client disconnects
    socket.on("disconnect", () => {
        const user = userLeave(socket.id);

        if (user) {
            io.to(user.room).emit(
                "message",
                formatMessage(botName, `${user.username} has left the chat`)
            );

            // Send users and room info
            io.to(user.room).emit("roomUsers", {
                room: user.room,
                users: getRoomUsers(user.room),
            });
        }
    });
});

app.get('/', (req, res) => {
    res.render('login.hbs')
});

app.get('/Home', (req, res) => {
    if (req.cookies.keyrem) {
        logData.username = req.cookies.user,
            logData.loggedIn = true
        res.render('index.hbs', logData)
    }
    else {
        res.render('login.hbs')
    }
});

//getting data for Match Calender
app.get('/Matches', async (req, res) => {
    if (req.cookies.keyrem) {
        const data = await Timeline.find({ eventType: "Event" });
        const jsonData = JSON.stringify(data).replace(/&/g, '&amp;');
        loggedIn = true
        res.render('match.hbs', { data: jsonData, loggedIn: loggedIn });
    } else {
        res.render('login.hbs')
    }
});

//getting data for Skills
app.get('/Skill', async (req, res) => {
    if (req.cookies.keyrem) {
        const username = req.cookies.user
        const data = await Register.findOne({ username }, { underhand: 1, overhand: 1, spiking: 1, setting: 1, digs: 1, dumps: 1, blocks: 1, _id: 0 })
        console.log(data)
        ratings.underhand = data.underhand,
            ratings.overhand = data.overhand,
            ratings.spiking = data.spiking,
            ratings.setting = data.setting,
            ratings.dumps = data.dumps,
            ratings.blocks = data.blocks,
            ratings.digs = data.digs,
            ratings.loggedIn = true,
            ratings.email = data.email,
            console.log(ratings)
        res.render('ratings.hbs', ratings)
    } else {
        res.render('login.hbs')
    }
});
//getting data for notification screen
app.get('/Notify', async (req, res) => {
    if (req.cookies.keyrem) {
        const room = "Main"
        const data = await Chat.find({ room })
        console.log(data)
        loggedIn = true

        //creating an array uniqueusername to display users in the chat
        const uniqueUsernames = [];
        // Loop through the data object
        data.forEach(entry => {
            // Check if the username is already in the array
            if (!uniqueUsernames.includes(entry.username)) {
                // If it's not, add it to the array
                uniqueUsernames.push(entry.username);
            }
        });
        console.log(uniqueUsernames)

        res.render('notify.hbs', { data, loggedIn: loggedIn, uniqueUsernames: uniqueUsernames })
    } else {
        res.render('login.hbs')
    }
});

//getting data for training screen
app.get('/Training', async (req, res) => {
    if (req.cookies.keyrem) {
        const videoType = "video"
        const data = await Training.find({ videoType })
        // console.log(data)
        loggedIn = true
        res.render('training.hbs', { data, loggedIn: loggedIn })
    } else {
        res.render('login.hbs')
    }
});



app.get('/Logout', (req, res) => {
    try {
        res.clearCookie('keyrem');
        res.clearCookie('user');
        res.render('login.hbs');
    } catch (err) {
        res.status(400).send(err);
    }

});
app.get('/AdminLogout', (req, res) => {
    try {
        res.clearCookie('keyremadmin');
        res.clearCookie('email');
        res.render('adminlogin.hbs');
    } catch (err) {
        res.status(400).send(err);
    }

});

app.get('/Admin', (req, res) => {
    if (req.cookies.keyremadmin) {
        res.render('admin.hbs')
    }
    else {
        res.render('adminlogin.hbs')

    }
});
app.get('/adminlogin', (req, res) => {
    res.render('adminlogin.hbs')
});

app.post('/Admin/Register', async (req, res) => {

    try {
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

        const userEmail = await Register.findOne({ email: registerUser.email });
        const userName = await Register.findOne({ username: registerUser.username });


        if (registerUser.name == '' || registerUser.email == '' || registerUser.password == '') {
            req.session.message = {
                type: 'Danger',
                intro: 'Empty fields ',
                message: 'Please fill all the required fields'
            }
            res.redirect('/Admin')
            delete req.session.message
        }
        else if (userEmail) {
            req.session.message = {
                type: 'Danger',
                intro: 'Email already exsits ',
                message: 'Please use another Email or Login using the exisiting Email'
            }
            res.redirect('/Admin')
            delete req.session.message
        }
        else if (userName) {
            req.session.message = {
                type: 'Danger',
                intro: 'Username already exsits ',
                message: 'Please use another Username or Login using the exisiting Username'
            }
            res.redirect('/Admin')
            delete req.session.message
        }
        else if (registerUser.password.length < 6) {
            req.session.message = {
                type: 'Danger',
                intro: 'Password too short ',
                message: 'Please enter a password of at least 6 characters'
            }
            res.redirect('/Admin')
            delete req.session.message
        }
        else if (registerUser == '') {
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
                    if (err) console.log(err);

                    registerUser.password = hash;

                    const token = await registerUser.generateAuthToken()
                    console.log(token);

                    registerUser.save()
                        .then(user => {
                            res.status(201).redirect('/Admin')
                        }
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

    } catch (err) {
        res.status(400).send(err);
        req.session.message = {
            type: 'Backend Problem',
            intro: 'Something went wrong ',
            message: 'Cannot register user please try again later'
        }
        res.redirect('/Admin')
        delete req.session.message
    }
});

app.post('/Admin/RegisterAdmin', async (req, res) => {

    try {
        const registerAdmin = new Admin({
            email: req.body.email,
            password: req.body.password,
        })

        const adminEmail = await Admin.findOne({ email: registerAdmin.email });


        if (registerAdmin.email == '' || registerAdmin.password == '') {
            req.session.message = {
                type: 'Danger',
                intro: 'Empty fields ',
                message: 'Please fill all the required fields'
            }
            res.redirect('/Admin')
            delete req.session.message
        }
        else if (adminEmail) {
            req.session.message = {
                type: 'Danger',
                intro: 'Email already exsits ',
                message: 'Please use another Email or Login using the exisiting Email'
            }
            res.redirect('/Admin')
            delete req.session.message
        }

        else if (registerAdmin.password.length < 6) {
            req.session.message = {
                type: 'Danger',
                intro: 'Password too short ',
                message: 'Please enter a password of at least 6 characters'
            }
            res.redirect('/Admin')
            delete req.session.message
        }
        else if (registerAdmin == '') {
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
                bcrypt.hash(registerAdmin.password, salt, async (err, hash) => {
                    if (err) console.log(err);

                    registerAdmin.password = hash;

                    const token = await registerAdmin.generateAuthToken()
                    console.log(token);

                    registerAdmin.save()
                        .then(admin => {
                            res.status(201).redirect('/Admin')
                        }
                        )
                        .catch(error => console.log(error))
                })
            )
            req.session.message = {
                type: 'Success',
                intro: ' Admin Registration successful ',
                message: 'Please Login'
            }
        }

    } catch (err) {
        res.status(400).send(err);
        req.session.message = {
            type: 'Backend Problem',
            intro: 'Something went wrong ',
            message: 'Cannot register user please try again later'
        }
        res.redirect('/Admin')
        delete req.session.message
    }
});

//delete a user
app.post('/Admin/DeleteUser', async (req, res) => {
    try {
        const email = req.body.email;
        const user = await Register.findOne({ email });

        if (!user) {
            // Handle user not found
            res.status(404).send('User not found');
            return;
        }

        await user.remove();

        // Handle success
        res.status(200).send('User deleted');
        res.redirect('/Admin');

    } catch (error) {
        // Handle error
        console.error(error);
        res.status(500).send('An error occurred');
    }
});


app.post('/Admin/Timeline', async (req, res) => {

    try {
        const registerTimeline = new Timeline({
            title: req.body.name,
            description: req.body.description,
            date: req.body.date,

        })
        registerTimeline.save()
            .then(event => {
                res.status(201).redirect('/Admin')
            }
            )
            .catch(error => console.log(error))









    } catch (err) {
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

app.post('/Message', async (req, res) => {

    try {
        const registerMessage = new Chat({
            username: req.cookies.user,
            message: req.body.message,
        })

        registerMessage.save()
            .then(chat => {
                res.status(201).redirect('/Notify')
            }
            )
            .catch(error => console.log(error))









    } catch (err) {
        res.status(400).send(err);
        req.session.message = {
            type: 'Backend Problem',
            intro: 'Something went wrong ',
            message: 'Cannot send a message'
        }
        res.redirect('/')
        delete req.session.message
    }
});

app.post('/Admin/DeleteEvent', async (req, res) => {
    try {
      const eventName = req.body.name;
      await Timeline.deleteOne({ title: eventName }); // remove the event from the database
  
      const events = await Timeline.find({}); // retrieve updated events data from the database
      
      // Handle success
      res.redirect('/Admin');

  } catch (error) {
      // Handle error
      console.error(error);
      res.status(500).send('An error occurred');
  }
      
  });
  
  
  
app.post('/Training', async (req, res) => {

    try {
        const registerVideo = new Training({
            username: req.cookies.user,
            description: req.body.description,
            link: req.body.link.replace("watch?v=", "embed/"),

        })
        registerVideo.save()
            .then(video => {
                res.status(201).redirect('/Training')
            }
            )
            .catch(error => console.log(error))









    } catch (err) {
        res.status(400).send(err);
        req.session.message = {
            type: 'Backend Problem',
            intro: 'Something went wrong ',
            message: 'Cannot upload video'
        }
        res.redirect('/')
        delete req.session.message
    }
});

app.post('/Login', async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const userEmail = await Register.findOne({ email: email });

        if (userEmail) {
            const validpass = await bcrypt.compare(password, userEmail.password);

            if (validpass) {
                const token = await userEmail.generateAuthToken();
                console.log(token);

                const userName = await userEmail.username;

                res.cookie("keyrem", token, {
                    expires: new Date(Date.now() + 5000000),
                    httpOnly: true,
                    secure: true
                });

                res.cookie("user", userName, {
                    expires: new Date(Date.now() + 5000000),
                    httpOnly: true,
                    secure: true
                })

                req.session.message = {
                    type: 'Success',
                    intro: 'Login successful ',
                    message: 'Welcome to Remedies Member only area! Enjoy'
                }
                res.status(201).redirect('/Home')
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
    } catch (err) {
        res.status(400).send(err);
        req.session.message = {
            type: 'Backend Problem',
            intro: 'Something went wrong ',
            message: 'Cannot login please try again later'
        }
        res.redirect('/')
    }
});

// login for admin
app.post('/AdminLogin', async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const adminEmail = await Admin.findOne({ email: email });

        if (adminEmail) {
            const validpass = await bcrypt.compare(password, adminEmail.password);

            if (validpass) {
                const token = await adminEmail.generateAuthToken();
                console.log(token);

                // const userName = await userEmail.username;

                res.cookie("keyremadmin", token, {
                    expires: new Date(Date.now() + 5000000),
                    httpOnly: true,
                    secure: true
                });

                res.cookie("email", adminEmail, {
                    expires: new Date(Date.now() + 5000000),
                    httpOnly: true,
                    secure: true
                })

                req.session.message = {
                    type: 'Success',
                    intro: 'Login successful ',
                    message: 'Welcome to Admin '
                }
                res.status(201).redirect('/Admin')
                delete req.session.message
            } else {
                req.session.message = {
                    type: 'Danger',
                    intro: 'Wrong Credentials ',
                    message: 'Either email or password is not correct'
                }
                res.status(400).redirect('/AdminLogin')
                delete req.session.message
            }
        } else {
            req.session.message = {
                type: 'Danger',
                intro: 'Email does not exsits ',
                message: 'Please use another Email or Register'
            }
            res.redirect('/AdminLogin')
            delete req.session.message
        }
    } catch (err) {
        res.status(400).send(err);
        req.session.message = {
            type: 'Backend Problem',
            intro: 'Something went wrong ',
            message: 'Cannot login please try again later'
        }
        res.redirect('/AdminLogin')
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
    console.log(`Server is Up and Running at port:`, port)
});




  