// REQUIRES
import * as fs from 'fs';
import * as url from 'url';
import * as http from 'http';
import * as path from 'path';
import * as https from 'https';

// express
import * as express from 'express';
import * as express_session from 'express-session';
import * as connect_redis from 'connect-redis';
const RedisStore = connect_redis(express_session);

// passport
import * as passport from 'passport';
const DiscordStrategy = require('passport-discord');

// socket.io
import * as socket_io from 'socket.io';

//
import Application from '..';
import webapp from './app';

// CONSTANTS
const SCOPES = ['identify'];

// EXPORTS
export default class Web {
  io: SocketIO.Server;
  server: http.Server | https.Server;

  constructor(public base: Application) {
    // APPLICATION
    const app = express();
    const server = base.config.web.tls
      ? https.createServer({
          key: fs.readFileSync(base.config.web.tls.key, 'utf8'),
          cert: fs.readFileSync(base.config.web.tls.cert, 'utf8'),
        }, app)
      : http.createServer(app);
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
      store(socket.request, <express.Response>{}, next);
    });

    // AUTHENTICATION
    passport.use(new DiscordStrategy({
      clientID: base.config.discord.oauth2.client_id,
      clientSecret: base.config.discord.oauth2.client_secret,
      callbackURL: url.resolve(base.config.web.url, 'auth'),
      scope: SCOPES,
    }, (accessToken: any, refreshToken: any, profile: any, done: (err: Error, user?: any, info?: any) => void) => {
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
    this.io = io;
    this.server = server;
    webapp(this);
  }
}
