'use strict';

const events = require('events');
const Discord = require('discord.js');

function timeStr(s) {
  const pad = n => `0${n}`.slice(-2);

  let m = Math.floor(s / 60);
  s %= 60;
  let h = Math.floor(m / 60);
  m %= 60;

  if (h > 0) {
    return [h, pad(m), pad(s)].join(':');
  } else {
    return [m, pad(s)].join(':');
  }
}

function humanize(n) {
  const trunc = n => Number(Number(n).toPrecision(3));

  const prefixes = ['', 'k', 'm', 'b', 't', 'q'];
  n = trunc(n);
  while (1000 <= n && prefixes.length > 0) {
    n = trunc(n / 1000);
    prefixes.shift();
  }
  return n + prefixes.shift();
}

module.exports = class Bot extends events.EventEmitter {
  constructor(app) {
    super();

    const self = this;
    const radio = app.radio;

    const bot = new Discord.Client;
    bot.loginWithToken(app.config.discord.bot.token);

    self.server = null;
    self.chatChannel = null;
    self.voiceChannel = null;
    self.voiceConnection = null;

    function setTopic() {
      if (!self.chatChannel) return;

      const $current = radio.current;
      const $order = radio.order;
      const $queues = radio.queues;

      let np = 'Now Playing: ';
      np += ($current
        ? `${$current.title} [${timeStr($current.duration)}] <${$current.player.dj.username}>`
        : 'Nothing'
      );

      let dj = 'DJ order: ';
      if ($order.length === 0) {
        dj += 'Nobody';
      } else {
        dj += $order.map(u => {
          const q = $queues[u.id];
          return (q && q.length > 0) ? `__${u.username}__` : u.username;
        }).join(', ');
      }

      bot.setChannelTopic(self.chatChannel, [np, dj].join(' // '));
    };

    bot.on('ready', function onReady() {
      self.server = bot.servers.get('id', app.config.discord.bot.server_id);
      self.chatChannel = self.server.channels.get('id', app.config.discord.bot.text_channel);
      self.voiceChannel = self.server.channels.get('id', app.config.discord.bot.voice_channel);

      for (let member of self.voiceChannel.members) {
        if (!member.equals(bot.user) && !member.bot) {
          radio.addDj(member);
        }
      }
      setTopic();

      bot.joinVoiceChannel(self.voiceChannel, function onJoinVoiceChannel(err, connection) {
        if (err) console.warn(err);
        self.voiceConnection = connection;
      });
    });

    bot.on('message', function onMessage(message) {
      if (!message.channel.equals(self.chatChannel)) return;
      if (message.author.equals(bot.user)) return;

      const args = message.content.split(/\s+/g);
      switch (args[0].toLowerCase()) {
        case '!add':
        case '!queue':
          const res = radio.addSong(args[1], message.author);
          res.on('error', err => {
            bot.reply(message, `I couldn't add that! The error was: \`${err.message}\``);
            console.error(err.stack);
          });
          res.on('done', song => {
            const duration = timeStr(song.duration);

            bot.reply(message,
              `queueing ${song.title} [${duration}] uploaded by ${song.uploader.name}` +
              '' // ` (${rating_str}★ / ${views_str} views)`
            );

            setTopic();
          });
          break;
      }
    });

    bot.on('voiceJoin', function onVoiceJoin(channel, user) {
      if (channel.equals(self.voiceChannel) && !user.equals(bot.user) && !user.bot) {
        radio.addDj(user);
        setTopic();
      }
    });

    bot.on('voiceLeave', function onVoiceLeave(channel, user) {
      if (channel.equals(self.voiceChannel)) {
        radio.removeDj(user);
        setTopic();
      }
    });

    setInterval((function onInterval() {
      if (!self.voiceConnection) return;
      if (self.voiceConnection.playing) return;
      radio.getNext();
    }), 1000);

    radio.on('song', function onSong(fp, song) {
      if (song) {
        const baseline = -16;

        self.voiceConnection.playFile(fp, { volume: 0 }, () => {
          const volume = self.voiceConnection.encoder.volume;
          if (volume) volume.setVolumeDecibels(baseline + song.gain);
        });
      }
      setTopic();
    });

    this.client = bot;
  }

  get users() {
    if (self.voiceChannel) return self.voiceChannel.members;
  }
};
