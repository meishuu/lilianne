import React from 'react';
import { connect } from 'react-redux';
import { getSongHistory } from '../reducers/songs/history';
import SongHistoryItem from './SongHistoryItem';

function SongHistory({ songs }) {
  return (
    <div className="scroller-wrap">
      <div className="song-history scroller">
        <h2>Song History</h2>
        {songs.map((item) =>
          <SongHistoryItem key={item.song.uid} {...item} />
        )}
      </div>
    </div>
  );
}

export default connect(getSongHistory)(SongHistory);
