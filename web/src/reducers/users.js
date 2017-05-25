import { INITIALIZE, SET_CURRENT_SONG, SET_DJ_ORDER } from '../actions';

export default function users(state = {}, action) {
  switch (action.type) {
    case INITIALIZE: {
      const users = { ...state };
      const { history, order, current } = action.payload;

      for (const song of history) {
        const user = song.player.dj;
        users[user.id] = user;
      }

      for (const user of order) {
        users[user.id] = user;
      }

      if (current) {
        const user = current.player.dj;
        users[user.id] = user;
      }

      return users;
    }

    case SET_CURRENT_SONG: {
      const song = action.payload;
      if (!song) return state;

      const user = song.player.dj;
      return {
        ...state,
        [user.id]: user,
      };
    }

    case SET_DJ_ORDER: {
      const users = { ...state };

      for (const user of action.payload) {
        users[user.id] = user;
      }

      return users;
    }

    default:
      return state;
  }
}

export function getUser(state, id) {
  return state.users[id];
}
