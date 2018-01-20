/* @flow */
/* eslint-disable no-param-reassign, no-shadow */

import fs from 'fs';
import path from 'path';
import events from 'events';

import uuid from 'uuid/v4';
import mkdirp from 'mkdirp';
import Discord from 'discord.js';

import Application from '..';
import handlers from './handlers';
import type {SongInfo} from './handlers';
import replaygain from './replaygain';

const {EventEmitter} = events;

export interface SongInfoExtended extends SongInfo {
  service: string;
  gain: number;
  player: {
    dj: UserInfo,
    startTime: number, // in ms
    currentTime?: number, // in ms
  };
}

export interface UserInfo {
  name: string;
  username: string;
  discriminator: string;
  id: string;
  avatar: string;
}

function skipRatio(length: number) {
  const minutes = length / 60;
  return 0.6 - 0.3 / (1 + Math.exp(3 - minutes / 3)); // eslint-disable-line no-mixed-operators
}

export function trimUser(user: Discord.User): UserInfo {
  const {username, discriminator, id, avatar} = user;
  const name = username; // TODO
  return {name, username, discriminator, id, avatar};
}

export type QueueItem = {
  fp: string,
  song: SongInfoExtended,
  id: string,
};

/*
interface AddSongEmitter extends EventEmitter {
  on(event: 'error', listener: (err: Error) => void): this;
  on(event: 'meta', listener: (song: SongInfoExtended) => void): this;
  on(event: 'downloading', listener: () => void): this;
  on(event: 'processing', listener: () => void): this;
  on(event: 'done', listener: (song: SongInfoExtended) => void): this;
}
*/

class Radio extends EventEmitter {
  queues: Map<string, QueueItem[]>;
  order: Discord.User[];
  current: ?SongInfoExtended;
  history: SongInfoExtended[];
  skips: Set<string>;
  app: Application;

  constructor(app: Application) {
    super();

    this.app = app;
    this.queues = new Map();
    this.order = [];
    this.current = null;
    this.history = [];
    this.skips = new Set();

    // eslint-disable-next-line handle-callback-err
    app.db.lrange('radio:history', 0, 19, (err: Error, res?: string[]) => {
      if (res) {
        this.history = res.map(s => JSON.parse(s));
        this.emit('history', this.history);
      }
    });
  }

  addDj(user: Discord.User) {
    if (this.order.some(u => u.id === user.id)) return;

    if (!this.current) {
      this.order.push(user);
    } else {
      const currentId = this.current.player.dj.id;
      let last = this.order.pop();
      if (last && last.id !== currentId) {
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

  removeDj(user: Discord.User) {
    const idx = this.order.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      this.order.splice(idx, 1);
      this.emit('order', this.order);
    }

    if (this.current) {
      this.skips.delete(user.id);
      this.checkSkips();
    }
  }

  voteSkip(user: Discord.User) {
    if (this.current && user.id === this.current.player.dj.id) {
      this.getNext();
      return true;
    }

    if (!this.order.some(u => u.equals(user))) return false;

    this.skips.add(user.id);
    this.checkSkips();
    return true;
  }

  checkSkips() {
    if (!this.current) return false;

    const ratio = skipRatio(this.current.duration);
    const total = this.order.length;
    const needed = Math.ceil(ratio * total);
    this.emit('skips', this.skips, needed);
  }

  addSong(link: string, user: Discord.User) {
    const handler = handlers(link, this.app.config);
    if (!handler) return null;

    const emitter = new EventEmitter();

    handler.getMeta((err, song: SongInfoExtended) => {
      if (err) return emitter.emit('error', err);

      // reject if too long
      if (song.duration > 2 * 60 * 60) {
        return emitter.emit('error', new Error('Track is too long'));
      }

      const service = handler.constructor.name.toLowerCase();
      song.service = service;
      emitter.emit('meta', song);

      const cache = path.join(this.app.config.radio.cache, service);
      const fp = path.join(cache, song.id.toString());
      const key = ['radio', service, song.id].join(':');

      function getFile(fp: string, cb: (error: ?Error, success?: boolean) => void) {
        function download() {
          mkdirp(cache, err2 => {
            if (err) {
              cb(err2);
              return;
            }

            handler
              .download(fs.createWriteStream(fp))
              .on('error', err3 => {
                cb(err3);
              })
              .on('finish', () => {
                cb(null, true);
              });

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

      function promisify(func: (cb: (err: ?Error, res?: any) => void) => any) {
        return new Promise((resolve, reject) => {
          func((err: ?Error, res?: any) => {
            if (err) {
              reject(err);
            } else {
              resolve(res);
            }
          });
        });
      }

      Promise.all([promisify(cb => getFile(fp, cb)), promisify(cb => this.app.db.get(key, cb))])
        .then((res: any[]) => {
          const self = this;
          function finish(song: SongInfoExtended) {
            const uid = user.id;
            if (!self.queues.has(uid)) self.queues.set(uid, []);
            const q = self.queues.get(uid) || [];
            q.push({fp, song, id: uuid()});

            emitter.emit('done', song);
            self.emit('queue', user, q);

            self.app.db
              .multi()
              .set(key, JSON.stringify(song))
              .sadd(['radio', service].join(':'), song.id)
              .exec();
          }

          let data;
          try {
            data = JSON.parse(res[1]);
          } catch (e) {}

          if (!data) {
            emitter.emit('processing');

            replaygain(fp)
              .then(gain => {
                song.gain = gain;
                finish(song);
              })
              .catch(err => {
                emitter.emit('error', err);
              });
          } else {
            song.gain = data.gain;
            finish(song);
          }
        })
        .catch(err => {
          emitter.emit(err);
        });
    });

    return emitter;
  }

  removeSong(user: Discord.User, qid: $PropertyType<QueueItem, 'id'>) {
    const queue = this.queues.get(user.id);
    if (!queue) return;

    const index = queue.findIndex(q => q.id === qid);
    if (index !== -1) {
      queue.splice(index, 1);
      this.emit('queue', user, queue);
    }
  }

  getNext() {
    this.skips.clear();

    if (this.current) {
      const song = this.current;
      delete song.player.currentTime;

      this.history.unshift(this.current);
      while (this.history.length > 20) this.history.pop();

      this.app.db.lpush('radio:history', JSON.stringify(this.current)); // TODO
    }

    if (this.order.length > 0) {
      // $FlowFixMe
      const index = this.order.findIndex(u => this.queues.has(u.id) && this.queues.get(u.id).length > 0);
      if (index !== -1) {
        const user = this.order[index];
        const queue = this.queues.get(user.id) || [];
        const data = queue.shift();

        this.order.push(...this.order.splice(0, index + 1));

        const {fp} = data;
        this.current = data.song;
        // $FlowFixMe
        this.current.player = {
          dj: trimUser(user),
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
}

/*
interface Radio {
  on(event: 'history', listener: (history: Radio.history) => void): this;
  on(event: 'order', listener: (order: Radio.order) => void): this;
  on(event: 'skips', listener: (skips: Radio.skips, needed: number) => void): this;
  on(event: 'queue', listener: (user: Discord.User, queue: QueueItem[]) => void): this;
  on(event: 'song', listener: (fp?: string, song?: SongInfoExtended) => void): this;
}
*/

export default Radio;
