var querystring = require('querystring');
var request = require('request');
module.exports = function(app, passport) {

// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index.ejs');
    });

    // PROFILE SECTION =========================
    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile.ejs', {
            user : req.user
        });
    });
    // STREAM SECTION =========================
    app.get('/profile/stream', isLoggedIn, function(req, resp) {
      var user          = req.user;
      var options = {
        url: 'https://api.twitch.tv/kraken/streams/69409226',
        headers: {
          'Accept': 'application/vnd.twitchtv.v5+json',
          'Client-ID': 'wicyupq8h14jx88i60vasnvbjj0hc8'
        }
      };
    //  console.log(options);

      function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
          var info = JSON.parse(body);
          //console.log(body + " Stars");
          resp.render('profile.ejs', {
              user : req.user
          });
        }
      }
      request(options, callback);
    });

    // CHANNEL SECTION =========================
    app.get('/profile/channel', isLoggedIn, function(req, resp) {
      var user          = req.user;

      var options = {
        url: 'https://api.twitch.tv/kraken/channel',
        headers: {
          'Accept': 'application/vnd.twitchtv.v5+json',
          'Client-ID': 'wicyupq8h14jx88i60vasnvbjj0hc8',
          'Authorization': 'OAuth '+ user.twitch.token
        }
      };
    //  console.log(options);

      function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
          var info = JSON.parse(body);
          console.log(body + " CANAL");
          resp.render('profile.ejs', {
              user : req.user
          });
        }
      }

      request(options, callback);

    });

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================
            // twitch ---------------------------------

        // send to twitch to do the authentication
        app.get('/auth/twitch', passport.authenticate('twitch', { scope : ['user_read channel_read'] }));

        // the callback after twitch has authenticated the user
        app.get("/auth/twitch/callback", passport.authenticate("twitch", { failureRedirect: "/" }), function(req, res) {
        // Successful authentication, redirect home.
          res.redirect("/profile");
        });

// =============================================================================
// AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
// =============================================================================


        app.get('/connect/twitch', passport.authorize('twitch', { scope : ['user_read channel_read'] }));

        // the callback after twitch has authorized the user
        app.get('/connect/twitch/callback',
            passport.authorize('twitch', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }));
// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    app.get('/unlink/twitch', isLoggedIn, function(req, res) {
        var user          = req.user;
        user.twitch.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
