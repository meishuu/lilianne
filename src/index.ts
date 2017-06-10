if (process.env.NODE_ENV !== 'production') process.env.NODE_ENV = 'development';

import * as path from 'path';
import * as redis from 'redis';

import Radio from './radio';
import Web from './web';
import Bot from './discord';

export interface ConfigOptions {
  discord: {
    oauth2: {
      client_id: string,
      client_secret: string,
    },
    bot: {
      token: string,
      server_id: string,
      text_channel: string,
      voice_channel: string,
    },
  },
  radio: {
    cache: string,
  },
  redis?: redis.ClientOpts,
  services?: {
    soundcloud?: {
      client_id?: string,
    },
  },
  web: {
    url: string,
    port?: number,
    tls?: {
      key: string,
      cert: string,
      hsts?: boolean | {
        force?: boolean,
        maxAge?: number,
        includeSubDomains?: boolean,
        preload?: boolean,
      },
    },
  },
}

export default class Application {
  config: ConfigOptions;
  db: redis.RedisClient;
  radio: Radio;
  web: Web;
  bot: Bot;

  constructor(configPath: string = process.argv[2] || 'config.json') {
    this.config = require(path.resolve(configPath));
    this.db = redis.createClient(this.config.redis);
    this.radio = new Radio(this);
    this.web = new Web(this);
    this.bot = new Bot(this);

    const port = this.config.web.port || (this.config.web.tls ? 443 : 80);

    this.web.server.listen(port, (err: Error) => {
      if (err) {
        console.error(err);
        return;
      }

      console.log(`Listening on port ${port}`);
    });
  }
}

if (require.main === module) new Application();
