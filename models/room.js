var db = require('../classes/store').MongoDB;
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = require('./user').model;

var roomSchema = new Schema({
  name: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  members: [{ type: Schema.ObjectId, ref: 'User' }]
});

mongoose.model("Room", roomSchema);

module.exports = {
  model: db.model("Room")
};
