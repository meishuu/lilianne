import {INITIALIZE, ADD_SONG, REMOVE_SONG, SET_LOCAL_QUEUE, SET_SONG_STATUS} from '../actions';

let i = 0;

const QueueItemStatus = {
  INVALID: 0,
  UNKNOWN: 1,
  WAITING: 2,
  DOWNLOADING: 3,
  PROCESSING: 4,
  DONE: 5,
};

export default function queue(state = {queue: [], errors: [], processing: null}, action) {
  switch (action.type) {
    case INITIALIZE:
      return {
        queue: action.payload.queue,
        errors: [],
        processing: null,
      };

    case ADD_SONG:
      return {
        ...state,
        processing: {
          id: i++,
          url: action.payload.url,
          status: 'waiting...',
        },
      };

    case REMOVE_SONG: {
      const {id} = action.payload;
      const {processing} = state;
      return {
        queue: state.queue.filter(item => item.id !== id),
        errors: state.errors.filter(item => item.id !== id),
        processing: processing && processing.id !== id ? processing : null,
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
