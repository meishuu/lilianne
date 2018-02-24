import {INITIALIZE, SET_DJ_ORDER} from '../actions';

export default function members(state = [], action) {
  switch (action.type) {
    case INITIALIZE:
      return action.payload.order.map(user => user.id);
    case SET_DJ_ORDER:
      return action.payload.map(user => user.id);
    default:
      return state;
  }
}

export function getMemberList(state) {
  return {
    members: state.members.map(member => ({
      ...state.users[member],
      self: member === state.self,
      inactive: false,
    })),
  };
}
