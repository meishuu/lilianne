export const APP_ERROR = 'APP_ERROR';
export const SHOW_DISCONNECT = 'SHOW_DISCONNECT';
export const INITIALIZE = 'INITIALIZE';
export const SET_DJ_ORDER = 'SET_DJ_ORDER';
export const SET_CURRENT_SONG = 'SET_CURRENT_SONG';
export const SET_LOCAL_QUEUE = 'SET_LOCAL_QUEUE';
export const SET_SONG_STATUS = 'SET_SONG_STATUS';

export const ADD_SONG = 'ADD_SONG';
export const REMOVE_SONG = 'REMOVE_SONG';

const createAction = type => payload => ({type, payload});

export const appError = createAction(APP_ERROR);
export const showDisconnect = createAction(SHOW_DISCONNECT);
export const initialize = createAction(INITIALIZE);
export const setDjOrder = createAction(SET_DJ_ORDER);
export const setCurrentSong = createAction(SET_CURRENT_SONG);
export const setLocalQueue = createAction(SET_LOCAL_QUEUE);
export const setSongStatus = createAction(SET_SONG_STATUS);

export const addSong = createAction(ADD_SONG);
export const removeSong = createAction(REMOVE_SONG);
