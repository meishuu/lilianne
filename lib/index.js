'use strict';

const redis = require('redis');

const Radio = require('./radio');
const Web = require('./web');
const Bot = require('./discord');

const confPath = process.argv[2] || 'config.json';
const config = JSON.parse(require('fs').readFileSync(confPath, { encoding: 'utf8' }));

const app = {};
app.config = config;
app.db = redis.createClient(app.config.redis);
app.radio = new Radio(app);
app.web = new Web(app);
app.bot = new Bot(app);

app.web.server.listen(app.config.web.port, function(err) {
  if (err) return console.error(err);
  console.log('Listening at on port ' + app.config.web.port)
});
