import {INITIALIZE, ADD_SONG, REMOVE_SONG, SET_LOCAL_QUEUE, SET_SONG_STATUS} from '../actions';

export default function queue(state = {queue: [], errors: [], processing: null}, action) {
  switch (action.type) {
    case INITIALIZE:
      return {
        queue: action.payload.queue,
      };

    case REMOVE_SONG: {
      const {id} = action.payload;
      return {
        queue: state.queue.filter(item => item.id !== id),
      };
    }

    case SET_LOCAL_QUEUE: {
      return {
        ...state,
        queue: action.payload,
      };
    }

    case SET_SONG_STATUS: {
      const queueItem = action.payload;

      return {
        ...state,
        queue: state.queue.map(item => (item.id === queueItem.id ? queueItem : item)),
      };
    }

    default:
      return state;
  }
}

export function getSongQueues(state) {
  return {queues: state.queue};
}
