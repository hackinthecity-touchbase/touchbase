var passport = require("passport");
var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/user').model;

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.use(new LocalStrategy(function(username, password, done) {
  User.findOne({ username: username }, function(err, user) {
    if (err) { return done(err); }
    if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
 
    if (password == user.password) return done(null, user)
    
    return done(null, false, {message: 'Invalid password'});
    /*
    user.comparePassword(password, function(err, isMatch) {
      if (err) return done(err);
      if(isMatch) {
        return done(null, user);
      } else {
        return done(null, false, { message: 'Invalid password' });
      }
    });
    */
  });
}));

module.exports = passport;