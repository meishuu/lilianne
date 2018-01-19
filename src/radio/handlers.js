/* @flow */

import fs from 'fs';
import path from 'path';
import { Writable } from 'stream';
import type { ConfigOptions } from '..';
import soundcloud from './handlers/soundcloud';
import youtube from './handlers/youtube';

const handlers: Array<Class<Handler>> = [
  soundcloud,
  youtube,
];

export interface Handler {
  //constructor(link: string, config: $PropertyType<ConfigOptions, 'services'>): Handler;
  //static match(link: string): boolean;
  getMeta(cb: (error: ?Error, song?: SongInfo) => void): void;
  download(stream: Writable): Writable;
}

export interface SongInfo {
  id: string,
  title: string,
  url: string,
  image: string,
  duration: number, // in seconds
  plays: string,
  uploader: {
    name: string,
    url: string,
  },
}


export default function getHandler(link: string, config: ConfigOptions) {
  for (const handler of handlers) {
    //$FlowFixMe
    if (handler.match(link)) {
      //$FlowFixMe
      return new handler(link, config.services);
    }
  }
  return null;
}
