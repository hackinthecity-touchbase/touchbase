var express = require("express");
var server = require("../classes/server").server;
var passportSocketIo = require("passport.socketio");

var RedisStore     = require("connect-redis")(express);
var store          = require('../classes/store').Redis;
var Message        = require('../models/message').model;


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
    if (io.sockets.clients(roomId).indexOf(socket) == -1) {
      socket.join(roomId);
      socket.broadcast.to(roomId).emit('add_member', socket.handshake.user);

      socket.on('chat_send', function (data) {
        message = new Message({text: data.message, room: roomId, author: socket.handshake.user._id});
        message.save(function (err, message) {
          if (err) {
            socket.emit('chat_error', err);
          } else {
            socket.broadcast.to(roomId).emit('chat_receive', message);
            socket.emit('chat_receive', message);
          }
        });
      });
    }
  });
  socket.on('unsubscribe', function (data) {
    socket.broadcast.to(roomId).emit('remove_member', socket.handshake.user._id);
    socket.leave(data.room);
  });
});

module.exports = exports = io;