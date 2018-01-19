/* @flow */

import events from 'events';

import Discord from 'discord.js';

import Application from '..';

const { EventEmitter } = events;

const BASELINE_DB = -16;

function timeStr(s: number) {
  const pad = (n: number) => `0${n}`.slice(-2);

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

function humanize(n: number) {
  const trunc = (n: number) => Number(Number(n).toPrecision(3));

  const prefixes = ['', 'k', 'm', 'b', 't', 'q'];
  n = trunc(n);
  while (n > 1000 && prefixes.length > 0) {
    n = trunc(n / 1000);
    prefixes.shift();
  }
  return n + prefixes.shift();
}

export default class Bot extends EventEmitter {
  client: Discord.Client;
  server: Discord.Guild | null;
  chatChannel: Discord.TextChannel | null;
  voiceChannel: Discord.VoiceChannel | null;
  voiceConnection: Discord.VoiceConnection | null;

  constructor(app: Application) {
    super();

    const radio = app.radio;

    const bot = new Discord.Client();
    bot.login(app.config.discord.bot.token);

    this.server = null;
    this.chatChannel = null;
    this.voiceChannel = null;
    this.voiceConnection = null;

    const setTopic = () => {
      const { chatChannel } = this;
      if (!chatChannel) return;
      if (!chatChannel.permissionsFor(bot.user).has('MANAGE_CHANNELS')) return;

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
          const q = $queues.get(u.id);
          return (q && q.length > 0) ? `__${u.username}__` : u.username;
        }).join(', ');
      }
      chatChannel.setTopic([np, dj].join(' // '));
    };

    bot.on('ready', () => {
      const server = bot.guilds.get(app.config.discord.bot.server_id);
      const chatChannel = server.channels.get(app.config.discord.bot.text_channel);
      const voiceChannel = server.channels.get(app.config.discord.bot.voice_channel);
      this.server = server;
      this.chatChannel = chatChannel;
      this.voiceChannel = voiceChannel;

      const currVoiceChannel = this.voiceChannel;
      for (const [id, member] of Array.from(currVoiceChannel.members)) {
        if (id !== bot.user.id && !member.user.bot) {
          radio.addDj(member.user);
        }
      }
      setTopic();
      currVoiceChannel.join()
        .then((connection) => {
          this.voiceConnection = connection;
        })
        .catch((err) => {
          console.warn(err);
        });
    });

    bot.on('message', (message) => {
      if(this.chatChannel){
        if (message.channel.id !== this.chatChannel.id) return;
      }
      if (message.author.id === bot.user.id) return;

      const args = message.content.split(/\s+/g);
      switch (args[0].toLowerCase()) {
        case '!add':
        case '!play':
        case '!queue': {
          const res = radio.addSong(args[1], message.author);
          if (!res){
            break;
          }
            res.on('error', (err) => {
              message.reply(`I couldn't add that! The error was: \`${err.message}\``);
              console.error(err.stack);
            });
            res.on('done', (song) => {
              const duration = timeStr(song.duration);

              message.reply(
                `queueing ${song.title} [${duration}] uploaded by ${song.uploader.name}` +
                '' // ` (${rating_str}★ / ${views_str} views)`
              );

              setTopic();
            });
            break;
        }
        default: {
          break; // do nothing
        }
      }
    });

    bot.on('voiceStateUpdate', (oldMember, newMember) => {
      if (oldMember.voiceChannelID === newMember.voiceChannelID) return;
      if (newMember.user.bot) return;
      if (this.voiceChannel) {
        if (newMember.voiceChannelID === this.voiceChannel.id) {
          radio.addDj(newMember.user);
          setTopic();
        } else if (oldMember.voiceChannelID === this.voiceChannel.id) {
          radio.removeDj(newMember.user);
          setTopic();
        }
      }
    });

    setInterval(() => {
      if (!this.voiceConnection) return;
      if (this.voiceConnection.speaking) return;
      radio.getNext();
    }, 1000);

    radio.on('song', (fp, song) => {
      if (song && this.voiceConnection) {
        const dispatcher = this.voiceConnection.playFile(fp, { volume: 0 });
        dispatcher.setVolumeDecibels(BASELINE_DB + song.gain);
      }
      setTopic();
    });

    this.client = bot;
  }
}
