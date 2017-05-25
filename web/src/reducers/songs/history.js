import { INITIALIZE, SET_CURRENT_SONG } from '../../actions';
import { getSong } from '../songs';
import { getUser } from '../users';

export default function reduceHistory(state = [], action, songs) {
  switch (action.type) {
    case INITIALIZE: {
      return action.payload.history.map(song => ({
        song: `${song.service}-${song.id}`,
        dj: song.player.dj.id,
        startTime: song.player.startTime,
      }));
    }

    case SET_CURRENT_SONG: {
      if (!songs.current) return state;
      const { offset, ...current } = songs.current;
      return [current, ...state];
    }

    default:
      return state;
  }
}

export function getSongHistory(state) {
  return {
    songs: state.songs.history.map(item => ({
      ...item,
      song: getSong(state, item.song),
      dj: getUser(state, item.dj),
    })),
  };
}
