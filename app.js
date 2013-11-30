var express        = require("express");
var __             = require("underscore");
var async          = require("async");
var RedisStore     = require("connect-redis")(express);
var http           = require('http');
var util           = require('util');
var passport       = require("./classes/passport");
var store          = require('./classes/store').Redis;
var ejs            = require("ejs");
var app = module.exports = express();

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
  return res.render("login");
});

app.post('/login', passport.authenticate('local', { successRedirect: '/', failureRedirect: '/login' }));

app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});


var port = process.env.PORT || 1201;
var server = http.createServer(app).listen(port, function () {
	console.log("Vera server started on port ", server.address().port, app.settings.env);
});

var io = require('socket.io').listen(server);

io.configure(function () { 
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10); 
});

io.sockets.on('connection', function (socket) {
  socket.on('test', function(data) {
    console.log('test');
  });
});
