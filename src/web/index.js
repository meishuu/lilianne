/* @flow */

// REQUIRES
import fs from 'fs';
import url from 'url';
import http from 'http';
import https from 'https';

// express
import express from 'express';
import compression from 'compression';
import expressSession from 'express-session';
import connectRedis from 'connect-redis';

// passport
import passport from 'passport';
import DiscordStrategy from 'passport-discord';

// socket.io
import socketIo from 'socket.io';

// app
import Application from '..';
import webapp from './app';
import serve from './serve';

// CONSTANTS
const RedisStore = connectRedis(expressSession);

const SCOPES = ['identify'];

// EXPORTS
export default class Web {
  io: SocketIO$Server;
  server: http.Server | https.Server;
  base: Application;

  constructor(base: Application) {
    this.base = base;
    const {tls} = base.config.web;

    // APPLICATION
    const app = express();
    const server =
      tls && tls.key && tls.cert
        ? https.createServer(
            {
              key: fs.readFileSync(tls.key, 'utf8'),
              cert: fs.readFileSync(tls.cert, 'utf8'),
            },
            app
          )
        : http.createServer(app);
    const io = socketIo(server, {serveClient: false});

    // SECURITY
    app.disable('x-powered-by');

    if (tls && tls.hsts) {
      const hsts =
        tls.hsts !== true
          ? tls.hsts
          : {
              force: false,
              maxAge: 180 * 24 * 60 * 60,
              includeSubDomains: false,
              preload: false,
            };

      const {force, maxAge, includeSubDomains, preload} = hsts;

      app.use((req, res, next) => {
        if (force || req.secure) {
          let header = 'max-age=' + maxAge;
          if (includeSubDomains) header += '; includeSubDomains';
          if (preload) header += '; preload';
          res.setHeader('Strict-Transport-Security', header);
        }
        next();
      });
    }

    // SESSIONS
    const store = expressSession({
      store: new RedisStore({client: base.db, ttl: 7 * 24 * 60 * 60}),
      secret: 'Magical Girls represent!',
      resave: false,
      saveUninitialized: false,
    });

    app.use(store);
    io.use((socket, next) => {
      store(socket.request, {}, next);
    });

    // AUTHENTICATION
    passport.use(
      new DiscordStrategy(
        {
          clientID: base.config.discord.oauth2.client_id,
          clientSecret: base.config.discord.oauth2.client_secret,
          callbackURL: url.resolve(base.config.web.url, 'auth'),
          scope: SCOPES,
        },
        (
          accessToken: any,
          refreshToken: any,
          profile: any,
          done: (err: Error | null, user?: any, info?: any) => void
        ) => {
          process.nextTick(() => done(null, profile));
        }
      )
    );

    passport.serializeUser((user, done) => {
      done(null, user);
    });
    passport.deserializeUser((obj, done) => {
      done(null, obj);
    });

    app.use(passport.initialize());
    app.use(passport.session());

    // COMPRESSION
    app.use(compression());

    // ROUTES
    app.get(
      '/',
      (req, res, next) => next(req.isAuthenticated() ? 'route' : ''),
      passport.authenticate('discord', {scope: SCOPES})
    );

    app.get('/auth', passport.authenticate('discord', {failureRedirect: '/'}), (req, res) => res.redirect('/'));

    app.post('/logout', (req, res) => {
      req.logout();
      res.redirect('/');
    });

    serve(app);

    // MAIN
    this.io = io;
    this.server = server;
    webapp(this);
  }
}
