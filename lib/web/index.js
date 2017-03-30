// REQUIRES
const url = require('url');
const http = require('http');
const path = require('path');

// express
const express = require('express');
const express_session = require('express-session');
const RedisStore = require('connect-redis')(express_session);

// passport
const passport = require('passport');
const DiscordStrategy = require('passport-discord');

// socket.io
const socket_io = require('socket.io');

// CONSTANTS
const SCOPES = ['identify'];

// EXPORTS
module.exports = function Web(base) {
  // APPLICATION
  const app = express();
  const server = http.createServer(app);
  const io = socket_io(server, { serveClient: false });

  // SESSIONS
  const store = express_session({
    store: new RedisStore({ client: base.db, ttl: 7 * 24 * 60 * 60 }),
    secret: 'Magical Girls represent!',
    resave: false,
    saveUninitialized: false,
  });

  app.use(store);
  io.use((socket, next) => {
    store(socket.request, {}, next);
  });

  // AUTHENTICATION
  passport.use(new DiscordStrategy({
    clientID: base.config.discord.oauth2.client_id,
    clientSecret: base.config.discord.oauth2.client_secret,
    callbackURL: url.resolve(base.config.web.url, 'auth'),
    scope: SCOPES,
  }, (accessToken, refreshToken, profile, done) => {
    process.nextTick(() => done(null, profile));
  }));

  passport.serializeUser((user, done) => {
    done(null, user);
  });
  passport.deserializeUser((obj, done) => {
    done(null, obj);
  });

  app.use(passport.initialize());
  app.use(passport.session());

  // ROUTES
  app.get('/',
    (req, res, next) => next(req.isAuthenticated() ? 'route' : ''),
    passport.authenticate('discord', { scope: SCOPES })
  );

  app.get('/auth',
    passport.authenticate('discord', { failureRedirect: '/' }),
    (req, res) => res.redirect('/')
  );

  app.post('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
  });

  app.use(express.static(path.join(__dirname, '../../www')));

  // MAIN
  this.base = base;
  this.io = io;
  this.server = server;

  require('./app')(this); // eslint-disable-line global-require
};
