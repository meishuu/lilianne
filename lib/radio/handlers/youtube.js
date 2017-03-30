const url = require('url');
const ytdl = require('ytdl-core');

module.exports = class YouTube {
  static match(link) {
    const parse = url.parse(link);
    return (parse.hostname === 'youtu.be' || /\byoutube\b/.test(parse.hostname));
  }

  constructor(link) {
    this.link = link;
  }

  getMeta(cb) {
    const self = this;

    try {
      ytdl.getInfo(this.link, (err, info) => {
        // check ytdl error
        if (err) return cb(err);

        //
        self.info = info;

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

  download(stream) {
    return ytdl.downloadFromInfo(this.info, { filter: 'audioonly' }).pipe(stream);
  }
};
