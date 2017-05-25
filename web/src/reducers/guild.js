import { INITIALIZE } from '../actions';

export default function guild(state = {}, action) {
  if (action.type === INITIALIZE) {
    return action.payload.server;
  }

  return state;
}

export function getGuild(state) {
  return state.guild;
}
