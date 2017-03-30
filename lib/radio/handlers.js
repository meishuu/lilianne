/* eslint-disable global-require, import/no-dynamic-require */

const fs = require('fs');
const path = require('path');

const handlers = [];

/*
song = {
  id: '',
  title: '',
  url: '',
  image: '',
  duration: 0, // in seconds
  plays: '0', // as string
  uploader: {
    name: '',
    url: '',
  },

  // added by radio
  service: '',
  gain: 0,
  player: {
    // TODO dj
    startTime: 0, // in ms
    currentTime: 0, // in ms
  },
};
*/

const base = path.join(__dirname, 'handlers');
for (const file of fs.readdirSync(base)) {
  try {
    if (file.startsWith('.')) continue;
    const Handler = require(path.join(base, file));
    handlers.push(Handler);
  } catch (e) {
    console.warn(`[media] error loading ${file}: ${e.message}`);
  }
}

module.exports = function getHandler(link) {
  for (const Handler of handlers) {
    if (Handler.match(link)) {
      return new Handler(link);
    }
  }
  return null;
};
