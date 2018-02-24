import {INITIALIZE, REMOVE_SONG, SET_LOCAL_QUEUE, SET_SONG_STATUS} from '../actions';

export default function queue(state = [], action) {
  switch (action.type) {
    case INITIALIZE:
      return action.payload.queue;

    case REMOVE_SONG: {
      const {id} = action.payload;
      return state.filter(item => item.id !== id);
    }

    case SET_LOCAL_QUEUE: {
      return action.payload;
    }

    case SET_SONG_STATUS: {
      const queueItem = action.payload;
      return state.map(item => (item.id === queueItem.id ? queueItem : item));
    }

    default:
      return state;
  }
}

export function getSongQueues(state) {
  return {queue: state.queue};
}
