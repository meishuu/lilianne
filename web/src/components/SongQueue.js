import React from 'react';
import {connect} from 'react-redux';
import {getSongQueues} from '../reducers/queue';

import {addSong, removeSong} from '../actions';
import SongQueueItem from './SongQueueItem';

function SongQueue({queues, doQueueAdd, doQueueRemove}) {
  const {queue} = queues;
  let input;

  function onSubmit(event) {
    event.preventDefault();

    const value = input.value.trim();
    if (value) {
      doQueueAdd(value);
      input.value = '';
    }
  }

  function onDelete(id) {
    return () => doQueueRemove(id);
  }

  return (
    <div className="song-queue-wrap flex-vertical flex-spacer">
      <div className="flex-vertical flex-spacer">
        <div className="scroller-wrap">
          <div className="song-list scroller">
            <h2>Your Queue</h2>
            <div className="song-queue sortable">
              {queue.map((data, index) => (
                <SongQueueItem key={data.id} index={index} data={data} onDelete={onDelete(data.id)} />
              ))}
            </div>
          </div>
        </div>
        <form onSubmit={onSubmit}>
          <div className="url-textarea">
            <div className="url-textarea-inner">
              <input
                type="text"
                placeholder="Add a song by URL"
                ref={node => {
                  input = node;
                }}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function mapDispatchToProps(dispatch) {
  return {
    doQueueAdd(url) {
      dispatch(addSong({url}));
    },

    doQueueMove() {
      // TODO
    },

    doQueueRemove(id) {
      dispatch(removeSong({id}));
    },
  };
}

export default connect(getSongQueues, mapDispatchToProps)(SongQueue);
