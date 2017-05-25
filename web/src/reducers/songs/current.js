import { INITIALIZE, SET_CURRENT_SONG } from '../../actions';
import { getUid } from './items';
import { getSong } from '../songs';
import { getUser } from '../users';

function reduceSong(song) {
  if (!song) return null;
  return {
    song: getUid(song),
    dj: song.player.dj.id,
    startTime: song.player.startTime,
    offset: song.player.startTime - song.player.currentTime,
  };
}

export default function reduceCurrent(state = null, action, songs) {
  switch (action.type) {
    case INITIALIZE:
      return reduceSong(action.payload.current);

    case SET_CURRENT_SONG:
      return reduceSong(action.payload);

    default:
      return state;
  }
}

export function getCurrentSong(state) {
  const { current } = state.songs;
  if (!current) return { song: null }; // TODO

  return {
    ...current,
    song: getSong(state, current.song),
    dj: getUser(state, current.dj),
  };
}
