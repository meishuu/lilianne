import io from 'socket.io-client';
import * as actions from './actions';

let socket;

export const socketMiddleware = store => next => action => {
  if (socket) {
    switch (action.type) {
      case actions.ADD_SONG:
        socket.emit('add', action.payload.url);
        break;
      case actions.REMOVE_SONG:
        socket.emit('delete', action.payload.id);
        break;
      // TODO
      default:
        break;
    }
  }

  return next(action);
};

export default store => {
  socket = io();

  socket.on('app error', err => {
    store.dispatch(actions.appError(err));
  });

  socket.on('error', err => {
    // TODO
    console.warn('socket.io error');
    console.warn(err);
  });

  socket.on('disconnect', () => {
    store.dispatch(actions.showDisconnect());
  });

  socket.on('load', data => {
    store.dispatch(actions.initialize(data));
    //$('.front').fadeOut();
  });

  socket.on('song', song => {
    store.dispatch(actions.setCurrentSong(song));
  });

  socket.on('order', order => {
    store.dispatch(actions.setDjOrder(order));
  });

  socket.on('queue', queue => {
    store.dispatch(actions.setLocalQueue(queue));
  });

  socket.on('add status', (type, data) => {
    store.dispatch(actions.setSongStatus([type, data]));
  });
};
