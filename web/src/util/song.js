function pad(n) {
  return `0${n}`.slice(-2);
}

export function timeStr(s) {
  s = Math.floor(s);
  let m = Math.floor(s / 60);
  s %= 60;
  let h = Math.floor(m / 60);
  m %= 60;

  if (h > 0) {
    return [h, pad(m), pad(s)].join(':');
  } else {
    return [m, pad(s)].join(':');
  }
}
