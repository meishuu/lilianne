import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware, compose } from 'redux';
import rootReducer from './reducers';
import { Provider } from 'react-redux';
import App from './components/App';
import startSocket, { socketMiddleware } from './socket';
//import registerServiceWorker from './registerServiceWorker';
import './index.css';

/*
const props = {
  self: "96742532448280576",
  guild: {
    id: "118834166719709184",
    icon: "f1e735802582094aff8b384a07a5e6cf",
    name: "Mahou Shoujo",
    channel: "🎵 Music",
  },
  members: [
    "96742532448280576",
    "170798412784992256",
  ],
  users: {
    "87116290535198720": {
      id: "87116290535198720",
      name: "Meishu",
      avatar: "b2cccbe32f0833b680ecf5171df8cf98",
    },
    "96742532448280576": {
      id: "96742532448280576",
      avatar: "8942a7f9e6b0f3118405963972720fca",
      name: "Jesari",
    },
    "170798412784992256": {
      id: "170798412784992256",
      avatar: "4debc8a750478eb2de28179db3f2539b",
      name: "qyu",
    },
  },
  queue: [
  ],
  songs: {
    current: {
      song: "youtube-WGUYfhqCgug",
      dj: "87116290535198720",
      startTime: Date.now(),
      offset: -5000,
    },
    history: [
      {
        song: "youtube-WGUYfhqCgug",
        dj: "87116290535198720",
        startTime: Date.now(),
      },
    ],
    items: {
      "youtube-WGUYfhqCgug": {
        id: 'WGUYfhqCgug',
        url: "https://www.youtube.com/watch?v=WGUYfhqCgug",
        title: "Camellia - Ring",
        image: "https://i.ytimg.com/vi/WGUYfhqCgug/hqdefault.jpg",
        service: "youtube",
        plays: 3327,
        duration: 282,
        uploader: {
          url: "https://www.youtube.com/channel/UCfjfynO4qiGwB5xO_ZtAlfQ",
          name: "ΕΛΠΙΣ",
        },
      },
    },
  },
};
*/

const composer = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
  rootReducer,
  {},
  composer(applyMiddleware(socketMiddleware)),
);

startSocket(store);

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);

//registerServiceWorker();

if (module.hot) {
  module.hot.accept('./components/App', () => {
    const NextApp = require('./components/App').default;
    ReactDOM.render(
      <Provider store={store}>
        <NextApp />
      </Provider>,
      document.getElementById('root')
    );
  });
}
