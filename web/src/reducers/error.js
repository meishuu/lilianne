import { APP_ERROR, SHOW_DISCONNECT } from '../actions';

export default function error(state = null, action) {
  switch (action.type) {
    case APP_ERROR:
      return action.payload;
    case SHOW_DISCONNECT:
      return { type: 'disconnected' };
    default:
      return state;
  }
}

export function getError(state) {
  return state.error || { type: 'none' };
}
