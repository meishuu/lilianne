/* @flow */

import {parse as parseUrl} from 'url';
import ytdl from 'ytdl-core';

import {Writable} from 'stream';
import {Handler, SongInfo} from '../handlers';

export default class YouTube implements Handler {
  static match(link: string) {
    const parse = parseUrl(link);
    return parse.hostname === 'youtu.be' || /\byoutube\b/.test(String(parse.hostname));
  }

  info: ytdl.videoInfo;
  link: string;

  constructor(link: string) {
    this.link = link;
  }

  getMeta(cb: (error: ?Error, song?: SongInfo) => void) {
    try {
      ytdl.getInfo(this.link, (err, info) => {
        // check ytdl error
        if (err) return cb(err);

        //
        this.info = info;

        cb(null, {
          id: info.video_id,
          title: info.title,
          url: info.video_url,
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
    return ytdl.downloadFromInfo(this.info, {filter: 'audioonly'}).pipe(stream);
  }
}
