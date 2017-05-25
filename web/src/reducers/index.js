import { combineReducers } from 'redux'
import error from './error';
import self from './self';
import guild from './guild';
import members from './members';
import users from './users';
import queue from './queue';
import songs from './songs';

export default combineReducers({
  error,
  self,
  guild,
  members,
  users,
  queue,
  songs,
});

if (module.hot) module.hot.decline();
