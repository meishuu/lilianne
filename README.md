# Lilianne

Lilianne is a [Discord](https://discordapp.com/) bot that plays music over voice chat.

![UI Example](https://i.imgur.com/6J6m2Pm.png)

Each user in the voice channel can queue up songs they want to play. Lilianne will choose who gets their song played based on the order in which users joined the music channel. This way, everyone gets a turn to play their music!

At the moment, Lilianne supports the following services:
- YouTube
- SoundCloud

After retrieving the songs, Lilianne will perform additional processing such as volume normalization.

Check the [roadmap](https://github.com/meishuu/lilianne/wiki/Roadmap) for a look at what's coming in the future.

## Requirements

You will need:
* [Node.js](https://nodejs.org/)
* [ffmpeg](https://ffmpeg.org/)
* a [Redis](https://redis.io/) server
* a [Discord app](https://discordapp.com/developers/applications/me) with an associated bot user
* a Discord server with a chat channel and a voice channel for music, with the bot on the server

## Installation

First, if you have [Git](https://git-scm.com/) installed, run:

```
git clone https://github.com/meishuu/lilianne.git
```

Otherwise, you can [download the latest source from GitHub](https://github.com/meishuu/lilianne/archive/master.zip) and unzip it anywhere convenient.

Next,

```
cd path/to/lilianne
npm install
```

## Configuration

You will need to set up a configuration file as a JSON file. For a list of possible options, please see the `ConfigOptions` interface in [`src/index.ts`](https://github.com/meishuu/lilianne/blob/master/src/index.ts).

Note that any fields *without* a question mark `?` after the field name are **required**. This means your config file must have, at minimum:

```json
{
  "discord": {
    "oauth2": {
      "client_id": "...",
      "client_secret": "..."
    },
    "bot": {
      "token": "...",
      "server_id": "...",
      "text_channel": "...",
      "voice_channel": "..."
    },
  },
  "radio": {
    "cache": "..."
  },
  "web": {
    "url": "..."
  }
}
```

You can get `discord.oauth2.client_id`, `discord.oauth2.client_secret`, and `discord.bot.token` from your Discord app's information page. There, you should add a Redirect URI that points to `web.url` with `/auth` appended to the path.

`discord.bot.server_id`, `discord.bot.text_channel`, and `discord.bot.voice_channel` can be determined from within Discord by going to Settings, Appearance, Advanced and turning on "Developer Mode", then right-clicking on the server or channels and clicking "Copy ID". Use these for the config values.

`radio.cache` points to the directory in which to store cached songs. An absolute path is preferred but not required.

## Usage

For development:

```
node path/to/lilianne/lib path/to/config.json
```

This supports hot module reloading for React components. If any web client code changes, the page will be updated accordingly.

For production:

```
npm run build
NODE_ENV=production node path/to/lilianne/lib path/to/config.json
```
