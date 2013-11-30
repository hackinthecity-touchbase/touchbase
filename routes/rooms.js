var io = require('socket.io');

var Room = require('../models/room').model;
var User = require('../models/user').model;
var Message = require('../models/message').model;

exports.query = function (req, res, next) {
	Room.find(function (err, users) {
		res.json(users);
	});
};

exports.create = function (req, res, next) {
  var room = new Room({name: req.body.name});
	room.save(function (err, room) {
		if (err) {
			next(err);
		} else {
			res.json(room);
		}
	});
};

exports.getRoom = function (req, res, next) {
	Room.findById(req.params.id, function (err, room) {
		if (err) return next(err);
    if (!room) return res.send(404);

		res.locals.room = room;
		next();
	});
};

exports.get = function (req, res, next) {
	res.json(res.locals.room);
};

exports.update = function (req, res, next) {
	res.locals.room.update(req.body.room, function (err) {
		if (err) {
			next(err);
		} else {
			res.send(200);
		}
	});
};

exports.getMembers = function (req, res, next) {
	Room.findOne({_id: res.locals.room._id})
	.populate('members')
	.exec(function (err, room) {
		if (err) {
			next(err);
		} else {
			res.json(room.members);
		}
	});
};

exports.addMember = function (req, res, next) {
	res.locals.room.members.push(req.body.memberId);
	res.locals.room.save(function (err, room) {
		if (err) {
			next(err);
		} else {
			io.sockets.in(room._id).emit('add_member', {memberId: req.body.memberId});
			res.send(200);
		}
	});
};

exports.deleteMember = function (req, res, next) {
	res.locals.room.members.pull(req.body.memberId);
	res.locals.room.save(function (err, room) {
		if (err) {
			next(err);
		} else {
			io.sockets.in(room._id).emit('remove_member', {memberId: req.body.memberId});
			res.send(200);
		}
	});
};

exports.getMessages = function (req, res, next) {
	Message.find({room: req.params.id}, function (err, messages) {
		if (err) {
			next(err);
		} else {
			res.json(messages);
		}
	});
};
