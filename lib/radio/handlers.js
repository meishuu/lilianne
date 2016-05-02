'use strict';

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
for (let file of fs.readdirSync(base)) {
  try {
    if (file.startsWith('.')) continue;
    const handler = require(path.join(base, file));
    handlers.push(handler);
  } catch (e) {
    console.warn(`[media] error loading ${file}: ${e.message}`);
  }
}

module.exports = function getHandler(link) {
  for (let handler of handlers) {
    if (handler.match(link)) {
      return new handler(link);
    }
  }
};
