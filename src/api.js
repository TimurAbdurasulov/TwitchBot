const express       = require('express')
var session         = require('express-session');
var passport        = require('passport');
var OAuth2Strategy  = require('passport-oauth').OAuth2Strategy;
var request         = require('request');
var handlebars      = require('handlebars');
const serverless    = require('serverless-http')
const app           = express()
const router        = express.Router();


const TWITCH_CLIENT_ID = 'rpkrq12ndse0ml03u7rqs23d1d78r2';
const TWITCH_SECRET    = 'od0xnz118xnskynob1f2ywcdou225b';
const SESSION_SECRET   = 'anything';
const CALLBACK_URL     = 'https://5ea275583c49d4776ae616dd--stupefied-elion-f671bf.netlify.app/.netlify/functions/api/';  // You can run locally with - http://localhost:3000/auth/twitch/callback


app.use('/.netlify/functions/api', router)
app.use(session({secret: SESSION_SECRET, resave: false, saveUninitialized: false}));
app.use(express.static('public'));
app.use(passport.initialize());
app.use(passport.session());


OAuth2Strategy.prototype.userProfile = function(accessToken, done) {
    var options = {
      url: 'https://api.twitch.tv/helix/users',
      method: 'GET',
      headers: {
        'Client-ID': TWITCH_CLIENT_ID,
        'Accept': 'application/vnd.twitchtv.v5+json',
        'Authorization': 'Bearer ' + accessToken
      }
    };
  
    request(options, function (error, response, body) {
      if (response && response.statusCode == 200) {
        done(null, JSON.parse(body));
      } else {
        done(JSON.parse(body));
      }
    });
  }

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});
  
passport.use('twitch', new OAuth2Strategy({
    authorizationURL: 'https://id.twitch.tv/oauth2/authorize',
    tokenURL: 'https://id.twitch.tv/oauth2/token',
    clientID: TWITCH_CLIENT_ID,
    clientSecret: TWITCH_SECRET,
    callbackURL: CALLBACK_URL,
    state: true
},
function(accessToken, refreshToken, profile, done) {
    profile.accessToken = accessToken;
    profile.refreshToken = refreshToken;

    // Securely store user profile in your DB
    //User.findOrCreate(..., function(err, user) {
    //  done(err, user);
    //});

    done(null, profile);
}
));

// Set route to start OAuth link, this is where you define scopes to request
router.get('/auth/twitch', passport.authenticate('twitch', { scope: 'user_read' }));

// Set route for OAuth redirect
router.get('/auth/twitch/callback', passport.authenticate('twitch', { successRedirect: '/', failureRedirect: '/' }));

// Define a simple template to safely generate HTML with values from user's profile
var template = handlebars.compile(`
<html><head><title>Twitch Auth Sample</title></head>
<table>
    <tr><th>Access Token</th><td>{{accessToken}}</td></tr>
    <tr><th>Refresh Token</th><td>{{refreshToken}}</td></tr>
    <tr><th>Display Name</th><td>{{display_name}}</td></tr>
    <tr><th>Bio</th><td>{{bio}}</td></tr>
    <tr><th>Image</th><td>{{logo}}</td></tr>
</table></html>`);

// If user has an authenticated session, display it, otherwise display link to authenticate
router.get('/', function (req, res) {
if(req.session && req.session.passport && req.session.passport.user) {
    res.send(template(req.session.passport.user));
} else {
    res.send('<html><head><title>Twitch Auth Sample</title></head><a href="/auth/twitch"><img src="http://ttv-api.s3.amazonaws.com/assets/connect_dark.png"></a></html>');
}
});


// router.get('/', (req,res)=>{
//     res.json({
//         'hello': 'hi!'
//     })
// })


module.exports.handler = serverless(app)