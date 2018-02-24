/* @flow */

import Discord from 'discord.js';

import Web from '.';
import {SongInfoExtended, UserInfo, trimUser} from '../radio';
import type {QueueItem} from '../radio';
export default function webapp(web: Web) {
  const {base, io} = web;
  const {radio} = base;

  let current: SongInfoExtended | null = null;
  let order: UserInfo[] = [];

  radio.on('history', history => {
    io.emit('history', history);
  });

  radio.on('song', (fp, song) => {
    if (song) {
      current = Object.assign({}, song);
      current.player = Object.assign({}, song.player);
      current.player.currentTime = Date.now();
    } else {
      current = null;
    }
    io.emit('song', current);
  });

  radio.on('order', newOrder => {
    order = newOrder.map(trimUser);
    io.emit('order', order);
  });

  radio.on('queue', (_user, _queue) => {
    // ?
  });

  io.on('connection', socket => {
    // CHECK ERRORS
    if (!socket.request.session || !socket.request.session.passport) {
      socket.emit('app error', {type: 'not authenticated'});
      return;
    }

    if (!base.bot.server) {
      socket.emit('app error', {type: 'not connected'});
      return;
    }

    const {id} = socket.request.session.passport.user;
    const {server} = base.bot;
    const {voiceChannel} = base.bot;
    if (!server.members.has(id) && voiceChannel) {
      socket.emit('app error', {
        type: 'not in server',
        user: socket.request.session.passport.user,
        server: {
          id: server.id,
          name: server.name,
          icon: server.icon,
          channel: voiceChannel.name, // TODO
        },
      });
      return;
    }

    const member = server.members.get(id);
    if (!member) return; // TODO
    const {user} = member;

    // RADIO HOOKS
    function onQueue(u: Discord.User, queue: QueueItem[]) {
      if (u.id !== user.id) return;
      socket.emit('queue', queue.map(({fp, ...item}) => item)); // eslint-disable-line no-unused-vars
    }

    radio.on('queue', onQueue);
    socket.on('disconnect', () => {
      radio.removeListener('queue', onQueue);
    });

    // ADD HOOKS
    socket.on('add', (url: string) => {
      radio.addSongWrapper(url, user).then(result => {
        result.forEach(event => {
          event.on('update', queueItem => {
            socket.emit('add status', queueItem);
          });
        });
      });
    });

    socket.on('delete', (qid: string) => {
      radio.removeSong(user, qid);
    });

    // SEND INIT
    if (current) current.player.currentTime = Date.now();
    const queue = radio.queues.get(id) || [];
    if (server && voiceChannel) {
      socket.emit('load', {
        id,
        server: {
          id: server.id,
          name: server.name,
          icon: server.icon,
          channel: voiceChannel.name, // TODO
        },
        order,
        queue: queue.map(({fp, ...item}) => item), // eslint-disable-line no-unused-vars
        current,
        history: radio.history,
      });
    }
  });
}
