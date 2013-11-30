var __ = require('underscore');

var User = require('../models/user').model;

exports.query = function (req, res, next) {
	User.find(function (err, users) {
		if (err) {
			next(err);
		} else {
			res.json(users);
		}
	});
};

exports.getUser = function (req, res, next) {
	if (!/"^[0-9a-fA-F]{24}$"/.test(req.params.id)) {
		return res.send(404);
	}
	User.findById(req.params.id, function (err, user) {
		if (err) {
			next(err);
		} else {
			res.locals.user = user;
			next();
		}
	});
};

exports.get = function (req, res, next) {
	res.json(res.locals.user);
};

exports.update = function (req, res, next) {
	res.locals.user = __.extend(res.locals.user, req.body.user);
	res.locals.user.save(function (err, user) {
		if (err) {
			next(err);
		} else {
			res.json(user);
		}
	});
};
