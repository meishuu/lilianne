import * as fs from 'fs';
import * as path from 'path';
import { Writable } from 'stream';

const handlers: AbstractHandler[] = [];

interface AbstractHandler {
  new (link: string): HandlerImpl;
  match(link: string): boolean;
}

export interface HandlerImpl {
  getMeta(cb: (error: Error, song?: SongInfo) => void): void;
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

const base = path.join(__dirname, 'handlers');
for (const file of fs.readdirSync(base)) {
  try {
    if (file.startsWith('.')) continue;
    const handler = <AbstractHandler>require(path.join(base, file)).default;
    handlers.push(handler);
  } catch (e) {
    console.warn(`[media] error loading ${file}: ${e.message}`);
  }
}

export default function getHandler(link: string, config: object) { // TODO
  for (const handler of handlers) {
    if (handler.match(link)) {
      return new handler(link);
    }
  }
  return null;
}
