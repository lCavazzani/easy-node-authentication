// load all the things we need
var LocalStrategy    = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy  = require('passport-twitter').Strategy;
var GoogleStrategy   = require('passport-google-oauth').OAuth2Strategy;
var TwitchStrategy = require("passport-twitch").Strategy;


// load up the user model
var User       = require('../app/models/user');

// load the auth variables
var configAuth = require('./auth'); // use this one for testing

module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });


    var twitchStrategy = configAuth.twitchAuth;
    twitchStrategy.passReqToCallback = true;  // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    passport.use(new TwitchStrategy(twitchStrategy,
    function(req, token, refreshToken, profile, done) {
      //  console.log(profile)
        // asynchronous
        process.nextTick(function() {

            // check if the user is already logged in
            if (!req.user) {

                User.findOne({ 'twitch.id' : profile.id }, function(err, user) {
                    if (err)
                        return done(err);

                    if (user) {

                        // if there is a user id already but no token (user was linked at one point and then removed)
                        if (!user.twitch.token) {
                            user.twitch.token = token;
                            user.twitch.name  = profile.username;
                            //user.twitch.email = (profile.emails[0].value || '').toLowerCase();

                            user.save(function(err) {
                                if (err)
                                    return done(err);

                                return done(null, user);
                            });
                        }

                        return done(null, user); // user found, return that user
                    } else {
                        // if there is no user, create them
                        var newUser            = new User();

                        newUser.twitch.id    = profile.id;
                        newUser.twitch.token = token;
                        newUser.twitch.name  = profile.username;
                        newUser.twitch.email = profile.email;
                        //newUser.twitch.email = (profile.emails[0].value || '').toLowerCase();

                        newUser.save(function(err) {
                            if (err)
                                return done(err);

                            return done(null, newUser);
                        });
                    }
                });

            } else {
                // user already exists and is logged in, we have to link accounts
                var user            = req.user; // pull the user out of the session

                user.twitch.id    = profile.id;
                user.twitch.token = token;
                user.twitch.name  = profile.username;
                //user.twitch.email = (profile.emails[0].value || '').toLowerCase();

                user.save(function(err) {
                    if (err)
                        return done(err);

                    return done(null, user);
                });

            }
        });

    }));


};
