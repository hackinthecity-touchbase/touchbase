var express        = require("express");
var __             = require("underscore");
var async          = require("async");
var RedisStore     = require("connect-redis")(express);
var http           = require('http');
var util           = require('util');
var passport       = require("./classes/passport");
var store          = require('./classes/store').Redis;
var passportSocketIo = require("passport.socketio");
var User           = require('./models/user');
var Room           = require('./models/room');
var ejs            = require("ejs");

var rooms          = require('./routes/rooms');
var users          = require('./routes/users');

var Message        = require('./models/message').model;

var app = require("./classes/server").app;
var notification = require("./classes/notification");


app.configure(function () {
  app.set("views", __dirname + "/views");
  app.set("view engine", "ejs");
  app.engine("html", ejs.renderFile);
  app.use(express.bodyParser({ keepExtensions: true, uploadDir: __dirname + "/static/uploads" }));
  app.use(express.cookieParser("This is the answer you are looking for %&$!$%$"));
  app.use(express.session({ store: new RedisStore({client: store}) }));
  app.use(express.methodOverride());
  app.use(express.static(__dirname + "/static"));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
});

app.get('/', function(req, res) {
  res.render('index.html');
});

app.get("/login", function (req, res) {
  return res.render("login.html");
});

app.post('/login', passport.authenticate('local', { successRedirect: '/', failureRedirect: '/login' }));

app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});

// app.all("*", function (req, res, next) {
//   if (!req.user) {
//     res.send(401);
//   } else {
//     next();
//   }
// });

app.get('/users', users.query);
app.all('/users/:id*', users.getUser);
app.get('/users/:id', users.get);
app.put('/users/:id', users.update);

app.get('/rooms', rooms.query);
app.post('/rooms', rooms.create);
app.all('/rooms/:id*', rooms.getRoom);
app.get('/rooms/:id', rooms.get);
app.put('/rooms/:id', rooms.update);
app.get('/rooms/:id/members', rooms.getMembers);
app.post('/rooms/:id/members', rooms.addMember);
app.del('/rooms/:id/members', rooms.deleteMember);
app.get('/rooms/:id/messages', rooms.getMessages);






User.model.findOne({username: 'bang'}, function (err, first_user) {
  if (first_user) {
    return;
  }

  first_user = new User.model({ username: 'bang', password: '123', email:"security@gmail.com" });
  first_user.save();

});

Room.model.findOne({name: 'Vera\'s Room!'}, function (err, first_room) {
  if (first_room) {
    return;
  }

  first_room = new Room.model({ name: 'Vera\'s Room!' });
  first_room.save();

});
