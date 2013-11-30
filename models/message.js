var db = require('../classes/store').MongoDB;
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var messageSchema = new Schema({
  text: { type: String, required: true },
  room: { type: Schema.ObjectId, ref: 'Room' },
  author: { type: Schema.ObjectId, ref: 'User' }
});

mongoose.model("Message", messageSchema);

module.exports = {
  model: db.model("Message")
};
