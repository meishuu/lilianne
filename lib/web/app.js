'use strict';

function trimUser(user) {
  const props = [
    'username',
    'discriminator',
    'id',
    'avatar'
  ];

  const res = {};
  for (let prop of props) res[prop] = user[prop];
  return res;
}

module.exports = function webapp(web) {
  const base = web.base;
  const io = web.io;

  const radio = base.radio;

  let current = null;
  let order = [];

  radio.on('history', function onHistory(history) {
    io.emit('history', history);
  });

  radio.on('song', function onSong(fp, song) {
    console.log(song);
    if (song) {
      current = Object.assign({}, song);
      current.player = Object.assign({}, song.player);
      current.player.dj = trimUser(current.player.dj);
      current.player.currentTime = Date.now();
    } else {
      current = null;
    }
    io.emit('song', current);
  });

  radio.on('order', function onOrder(newOrder) {
    order = newOrder.map(trimUser);
    io.emit('order', order);
  });

  radio.on('queue', function onQueue(user, queue) {
  });

  io.on('connection', function(socket) {
    let adding = false;

    /****************
     * CHECK ERRORS *
     ****************/
    if (!socket.request.session.passport) {
      return socket.emit('app error', { type: 'not authenticated' });
    }

    if (!base.bot.server) {
      return socket.emit('app error', { type: 'not connected' });
    }

    const id = socket.request.session.passport.user.id;
    const user = base.bot.server.members.get('id', id);
    if (!user) {
      socket.emit('app error', {
        type: 'not in server',
        user: socket.request.session.passport.user,
        server: {
          id: base.bot.server.id,
          name: base.bot.server.name,
          icon: base.bot.server.icon,
          channel: base.bot.voiceChannel.name,
        },
      });
      return;
    }

    /***************
     * RADIO HOOKS *
     ***************/
    function onQueue(u, queue) {
      if (!user.equals(u)) return;
      socket.emit('queue', queue.map(q => q.slice(1)));
    }

    radio.on('queue', onQueue);
    socket.on('disconnect', function onDisconnect() {
      radio.removeListener('queue', onQueue);
    });

    /*************
     * ADD HOOKS *
     *************/
    socket.on('add', function onAdd(url) {
      if (adding) {
        socket.emit('add status', 'error', new Error('Already adding'));
        return;
      }

      const res = radio.addSong(url, user);
      if (!res) {
        socket.emit('add status', 'error', new Error('Invalid URL'));
        return;
      }

      adding = true;

      res.on('error', function onError(err) {
        socket.emit('add status', 'error', err);
        adding = false;
      });

      res.on('meta', function onMeta(song) {
        socket.emit('add status', 'meta', song);
      });

      res.on('downloading', function onDownloading() {
        socket.emit('add status', 'downloading');
      });

      res.on('processing', function onProcessing() {
        socket.emit('add status', 'processing');
      });

      res.on('done', function onDone(song) {
        socket.emit('add status', 'done', song);
        adding = false;
      });
    });

    socket.on('delete', function onDelete(qid) {
      radio.removeSong(user, qid);
    });

    /*************
     * SEND INIT *
     *************/
    if (current) current.player.currentTime = Date.now();
    const queue = radio.queues[id] || [];
    socket.emit('load', {
      id: id,
      server: {
        id: base.bot.server.id,
        name: base.bot.server.name,
        icon: base.bot.server.icon,
        channel: base.bot.voiceChannel.name,
      },
      order: order,
      queue: queue.map(q => q.slice(1)),
      current: current,
      history: radio.history,
    });
  });
};
