import reduceCurrent from './songs/current';
import reduceHistory from './songs/history';
import reduceItems from './songs/items';

export default function songs(state = {}, action) {
  return {
    current: reduceCurrent(state.current, action, state),
    history: reduceHistory(state.history, action, state),
    items: reduceItems(state.items, action, state),
  };
}

export function getSong(state, id) {
  return state.songs.items[id];
}
