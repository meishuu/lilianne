/* @flow */

import {Writable} from 'stream';
import type {ConfigOptions} from '..';
import soundcloud from './handlers/soundcloud';
import youtube from './handlers/youtube';

const handlers: Array<Class<Handler>> = [soundcloud, youtube];

export interface Handler {
  // constructor(link: string, config: $PropertyType<ConfigOptions, 'services'>): Handler;
  // static match(link: string): boolean;
  getMeta(cb: (error: ?Error, song?: SongInfo) => void): void;
  download(stream: Writable): Writable;
}

export interface SongInfo {
  id: string;
  title: string;
  url: string;
  image: string;
  duration: number; // in seconds
  plays: string;
  uploader: {
    name: string,
    url: string,
  };
}

export default function getHandler(link: string, config: ConfigOptions) {
  for (const Handler of handlers) {
    // $FlowFixMe
    if (Handler.match(link)) {
      // $FlowFixMe
      return new Handler(link, config.services);
    }
  }
  return null;
}
