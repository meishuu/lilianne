/* @flow */

import { spawn } from 'child_process';

const regex = /track_gain = (.+?) dB/;
const nul = (process.platform === 'win32') ? 'nul' : '/dev/null';

export default function replaygain(fp: string, cb: (error: Error, gain?: number) => void) {
  const enc = spawn('ffmpeg', [
    '-i', fp,
    '-af', 'replaygain',
    '-f', 'null',
    nul,
  ]);

  let found = false;

  enc.stderr.setEncoding('utf8');
  enc.stderr.on('data', (data: string) => {
    if (data.indexOf('replaygain') === -1) return;

    const match = data.match(regex);
    if (!match) return;

    found = true;
    cb(null, parseFloat(match[1]));
  });

  enc.on('close', (code) => {
    if (code !== 0) {
      cb(new Error(`ffmpeg return code: ${code}`));
    } else if (!found) {
      cb(new Error('No ReplayGain data received'));
    }
  });
};
