import { INITIALIZE, SET_CURRENT_SONG } from '../../actions';

export function getUid(song) {
  return `${song.service}-${song.id}`;
}

export default function reduceItems(state = {}, action, songs) {
  switch (action.type) {
    case INITIALIZE: {
      const newState = {};
      const { history, current } = action.payload;

      for (const song of history) {
        const uid = getUid(song);
        newState[uid] = { ...song, uid };
      }

      if (current) {
        const uid = getUid(current);
        newState[uid] = { ...current, uid };
      }

      return newState;
    }

    case SET_CURRENT_SONG: {
      const song = action.payload;
      if (!song) return state;

      const uid = getUid(song);
      return {
        ...state,
        [uid]: { ...song, uid },
      };
    }

    default:
      return state;
  }
}
