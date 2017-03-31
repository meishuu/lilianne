const url = require('url');
const ytdl = require('ytdl-core');

import { Readable, Writable } from 'stream';
import { HandlerImpl, SongInfo } from '../handlers';

export default class YouTube implements HandlerImpl {
  static match(link: string) {
    const parse = url.parse(link);
    return (parse.hostname === 'youtu.be' || /\byoutube\b/.test(parse.hostname));
  }

  info: any;

  constructor(public link: string) {
  }

  getMeta(cb: (error: Error, song?: SongInfo) => void) {
    try {
      ytdl.getInfo(this.link, (err: Error, info?: any) => {
        // check ytdl error
        if (err) return cb(err);

        //
        this.info = info;

        cb(null, {
          id: info.video_id,
          title: info.title,
          url: info.loaderUrl,
          image: info.thumbnail_url,
          duration: +info.length_seconds,
          plays: info.view_count,
          uploader: {
            name: info.author.name,
            url: info.author.channel_url,
          },
        });
      });
    } catch (e) {
      cb(e);
    }
  }

  download(stream: Writable) {
    return (<Readable>ytdl.downloadFromInfo(this.info, { filter: 'audioonly' })).pipe(stream);
  }
};
