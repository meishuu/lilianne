import {
  INITIALIZE,
  ADD_SONG,
  REMOVE_SONG,
  SET_LOCAL_QUEUE,
  SET_SONG_STATUS,
} from '../actions';

let i = 0;

function updateStatus(item, type, data) {
  switch (type) {
    case 'error':
      return { ...item, error: data, status: data.error };
    case 'meta':
      return { ...item, song: data, status: 'waiting...' };
    case 'downloading':
      return { ...item, status: 'downloading...' };
    case 'processing':
      return { ...item, status: 'processing...' };
    case 'done':
      return { ...item, status: null };
    default:
      console.log(type, data);
      return { ...item, status: 'unknown' };
  }
}

export default function queue(state = { queue: [], errors: [], processing: null }, action) {
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
      const { id } = action.payload;
      const { processing } = state;
      return {
        queue: state.queue.filter(item => item.id !== id),
        errors: state.errors.filter(item => item.id !== id),
        processing: (processing && processing.id !== id) ? processing : null,
      };
    }

    case SET_LOCAL_QUEUE: {
      return {
        ...state,
        queue: action.payload,
      };
    }

    case SET_SONG_STATUS: {
      const [type, data] = action.payload;
      const newItem = updateStatus(state.processing, type, data);

      switch (type) {
        case 'done':
          return {
            ...state,
            queue: [...state.queue, newItem],
            processing: null,
          };
        case 'error':
          return {
            ...state,
            errors: [...state.errors, newItem],
            processing: null,
          };
        default:
          return {
            ...state,
            processing: newItem,
          };
      }
    }

    default:
      return state;
  }
}

export function getSongQueues(state) {
  return { queues: state.queue };
}
