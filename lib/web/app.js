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

module.exports = function webapp(web) {
  const base = web.base;
  const io = web.io;

  const radio = base.radio;

  let current = null;
  let order = [];

  radio.on('history', (history) => {
    io.emit('history', history);
  });

  radio.on('song', (fp, song) => {
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

  radio.on('order', (newOrder) => {
    order = newOrder.map(trimUser);
    io.emit('order', order);
  });

  radio.on('queue', (user, queue) => {
    // ?
  });

  io.on('connection', (socket) => {
    let adding = false;

    // CHECK ERRORS
    if (!socket.request.session.passport) {
      socket.emit('app error', { type: 'not authenticated' });
      return;
    }

    if (!base.bot.server) {
      socket.emit('app error', { type: 'not connected' });
      return;
    }

    const id = socket.request.session.passport.user.id;
    const user = base.bot.server.members.get(id);
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

    // RADIO HOOKS
    function onQueue(u, queue) {
      if (u.id !== user.id) return;
      socket.emit('queue', queue.map(q => q.slice(1)));
    }

    radio.on('queue', onQueue);
    socket.on('disconnect', () => {
      radio.removeListener('queue', onQueue);
    });

    // ADD HOOKS
    socket.on('add', (url) => {
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

      res.on('error', (err) => {
        socket.emit('add status', 'error', err);
        adding = false;
      });

      res.on('meta', (song) => {
        socket.emit('add status', 'meta', song);
      });

      res.on('downloading', () => {
        socket.emit('add status', 'downloading');
      });

      res.on('processing', () => {
        socket.emit('add status', 'processing');
      });

      res.on('done', (song) => {
        socket.emit('add status', 'done', song);
        adding = false;
      });
    });

    socket.on('delete', (qid) => {
      radio.removeSong(user, qid);
    });

    // SEND INIT
    if (current) current.player.currentTime = Date.now();
    const queue = radio.queues[id] || [];
    socket.emit('load', {
      id,
      server: {
        id: base.bot.server.id,
        name: base.bot.server.name,
        icon: base.bot.server.icon,
        channel: base.bot.voiceChannel.name,
      },
      order,
      queue: queue.map(q => q.slice(1)),
      current,
      history: radio.history,
    });
  });
};
