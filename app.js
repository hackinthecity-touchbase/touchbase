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
var app = module.exports = express();

var rooms          = require('./routes/rooms');
var users          = require('./routes/users');

var Message        = require('./models/message').model;

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

app.all("*", function (req, res, next) {
  if (!req.user) {
    res.send(401);
  } else {
    next();
  }
});

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
app.get('/room/:id/messages', rooms.getMessages);


var port = process.env.PORT || 1201;
var server = http.createServer(app).listen(port, function () {
	console.log("Vera server started on port ", server.address().port, app.settings.env);
});

var io = require('socket.io').listen(server);

io.configure(function () {
  io.set("transports", ["xhr-polling"]);
  io.set("polling duration", 10);

  io.set("authorization", passportSocketIo.authorize({
    cookieParser: express.cookieParser,
    key: "connect.sid",
    secret: "This is the answer you are looking for %&$!$%$",
    store: new RedisStore({client: store}),
    fail: function(data, accept) {
      accept(null, false);
    },
    success: function(data, accept) {
      accept(null, true);
    }
  }));

});

io.sockets.on('connection', function (socket) {
  socket.on('subscribe', function (data) {
    var roomId = data.room;
    socket.join(roomId);
    socket.on('chat_send', function (data) {
      message = new Message({text: data.message, room: roomId, author: data.userId});
      message.save(function (err, message) {
        if (err) {
          socket.emit('chat_error', err);
        } else {
          socket.broadcast.to(roomId).emit('chat_receive', data);
        }
      });
    });
  });
  socket.on('unsubscribe', function (data) {
    socket.leave(data.room);
  });
});


User.model.findOne({username: 'vera'}, function (err, first_user) {
  if (first_user) {
    return;
  }

  first_user = new User.model({ username: 'vera', password: 'pass', email:"notsecurity@gmail.com" });
  first_user.save();

});

Room.model.findOne({name: 'Vera\'s Room!'}, function (err, first_room) {
  if (first_room) {
    return;
  }

  first_room = new Room.model({ name: 'Vera\'s Room!' });
  first_room.save();

});
