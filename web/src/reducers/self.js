import { INITIALIZE } from '../actions';

export default function self(state = null, action) {
  if (action.type === INITIALIZE) return action.payload.id;
  return state;
}
