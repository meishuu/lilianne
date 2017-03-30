/* eslint-disable no-param-reassign, no-shadow */

const fs = require('fs');
const path = require('path');
const events = require('events');

const async = require('async');
const mkdirp = require('mkdirp');

const handlers = require('./handlers');
const replaygain = require('./replaygain');

let uid = 0;
function getUid() {
  return uid++;
}

function skipRatio(length) {
  const minutes = length / 60;
  return 0.6 - 0.3 / (1 + Math.exp(3 - minutes / 3)); // eslint-disable-line no-mixed-operators
}

function trimUser(user) {
  const props = [
    'username',
    'discriminator',
    'id',
    'avatar',
  ];

  const res = {};
  for (const prop of props) res[prop] = user[prop];
  return res;
}

module.exports = class Radio extends events.EventEmitter {
  constructor(app) {
    super();
    this.app = app;

    this.queues = {};
    this.order = [];
    this.current = null;
    this.history = [];
    this.skips = new Set();

    app.db.lrange('radio:history', 0, 19, (err, res) => {
      if (res) {
        this.history = res.map(s => JSON.parse(s));
        this.emit('history', this.history);
      }
    });
  }

  addDj(user) {
    if (this.order.some(u => u.id === user.id)) return;

    if (!this.current) {
      this.order.push(user);
    } else {
      let last = this.order.pop();
      if (last && last.id !== this.current.user.id) {
        this.order.push(last);
        last = null;
      }
      this.order.push(user);
      if (last != null) {
        this.order.push(last);
      }
    }

    this.emit('order', this.order);
  }

  removeDj(user) {
    const idx = this.order.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      this.order.splice(idx, 1);
      this.emit('order', this.order);
    }

    if (this.current) {
      this.skips.delete(user);
      this.checkSkips();
    }
  }

  voteSkip(user) {
    if (this.current && user.equals(this.current.player.dj)) {
      getNext();
      return true;
    }

    if (!this.order.some(u => u.equals(user))) return false;

    this.skips.add(user);
    this.checkSkips();
    return true;
  }

  checkSkips() {
    if (!this.current) return false;

    const ratio = skipRatio(this.current.duration);
    const skipped = this.skips.size;
    const total = this.order.length;
    const needed = Math.ceil(ratio * total);
    console.log(skipped, needed, total, skipped / total, ratio);
    this.emit('skips', this.skips, needed);
  }

  addSong(link, user) {
    const self = this;
    const handler = handlers(link);
    if (!handler) return null;

    const emitter = new events.EventEmitter();

    handler.getMeta((err, song) => {
      if (err) return emitter.emit('error', err);

      // reject if too long
      if (song.duration > 2 * 60 * 60) {
        return emitter.emit('error', new Error('Track is too long'));
      }

      const service = handler.constructor.name.toLowerCase();
      song.service = service;
      emitter.emit('meta', song);

      const cache = path.join(self.app.config.radio.cache, service);
      const fp = path.join(cache, song.id.toString());
      const key = ['radio', service, song.id].join(':');

      function getFile(fp, cb) {
        function download() {
          mkdirp(cache, (err2) => {
            if (err) {
              cb(err2);
              return;
            }

            handler.download(fs.createWriteStream(fp))
              .on('error', (err3) => { cb(err3); })
              .on('finish', () => { cb(null, true); });

            emitter.emit('downloading');
          });
        }

        fs.stat(fp, (err, stats) => {
          // not cached
          if (err) {
            if (err.code === 'ENOENT') {
              download();
            } else {
              cb(err);
            }
          // cached
          } else if (stats.size === 0) {
            download();
          } else {
            cb(null, true);
          }
        });
      }

      async.parallel([
        cb => getFile(fp, err => cb(err)),
        cb => self.app.db.get(key, cb),
      ], (err, res) => {
        if (err) return emitter.emit(err);

        function finish(song) {
          const uid = user.id;
          if (!self.queues[uid]) self.queues[uid] = [];
          self.queues[uid].push([fp, song, getUid()]);

          emitter.emit('done', song);
          self.emit('queue', user, self.queues[uid]);

          self.app.db.multi()
            .set(key, JSON.stringify(song))
            .sadd(['radio', service].join(':'), song.id)
            .exec();
        }

        let data;
        try {
          data = JSON.parse(res[1]);
        } catch (e) {
        }

        if (!data) {
          emitter.emit('processing');

          replaygain(fp, (err, gain) => {
            if (err) return emitter.emit('error', err);

            song.gain = gain;
            finish(song);
          });
        } else {
          song.gain = data.gain;
          finish(song);
        }
      });
    });

    return emitter;
  }

  removeSong(user, qid) {
    const queue = this.queues[user.id];
    if (!queue) return;

    const index = queue.findIndex(q => q[2] === qid);
    if (index !== -1) {
      queue.splice(index, 1);
      this.emit('queue', user, queue);
    }
  }

  getNext() {
    this.skips.clear();

    if (this.current) {
      const song = this.current;
      const dj = trimUser(song.player.dj);
      song.player.dj = dj;
      delete song.player.currentTime;

      this.history.unshift(this.current);
      while (this.history.length > 20) this.history.pop();

      this.app.db.lpush('radio:history', JSON.stringify(this.current)); // TODO
    }

    if (this.order.length > 0) {
      const index = this.order.findIndex(u => this.queues[u.id] && this.queues[u.id].length > 0);
      if (index !== -1) {
        const user = this.order[index];
        const queue = this.queues[user.id];
        const data = queue.shift();

        const front = this.order.splice(0, index + 1);
        [].push.apply(this.order, front);

        const fp = data[0];
        this.current = data[1];
        this.current.player = {
          dj: user,
          startTime: Date.now(),
        };

        this.emit('song', fp, this.current);
        this.emit('order', this.order);
        this.emit('queue', user, queue);
        return;
      }
    }

    if (this.current) {
      this.current = null;
      this.emit('song', null);
    }
  }
};
