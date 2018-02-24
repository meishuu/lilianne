import React from 'react';
import TimeAgo from 'react-timeago';

import {UserAvatar} from './DiscordIcon';

export default function SongHistoryItem({song, dj, startTime}) {
  return (
    <div className="item">
      <div className="song">
        <div className="thumbnail">
          <a href={song.url} rel="external noreferrer">
            <img className="image" src={song.image} alt="" />
          </a>
        </div>
        <div className="info">
          <a className="title" href={song.url} rel="external noreferrer">
            {song.title}
          </a>
          <div className="played-by">
            <UserAvatar user={dj.id} avatar={dj.avatar} />
            <span className="dj-name">{dj.name || dj.username}</span>
          </div>
          <TimeAgo date={startTime} />
        </div>
      </div>
    </div>
  );
}
