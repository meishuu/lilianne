import React from 'react';
import classNames from 'classnames';
import {connect} from 'react-redux';
import {getCurrentSong} from '../reducers/songs/current';

import {UserAvatar} from './DiscordIcon';
import SongProgress from './SongProgress';

function CurrentSong({song, dj, startTime, offset}) {
  if (!song)
    return (
      <div className="current-song-wrap flex-horizontal">
        <div className="no-song">
          <h1>There is no song playing.</h1>
        </div>
      </div>
    );

  return (
    <div className="current-song-wrap flex-horizontal">
      <div className="current-song flex-horizontal">
        <div className="song-image">
          <a href={song.url} rel="external noreferrer">
            <img className="image" src={song.image} alt="" />
          </a>
        </div>
        <div className="song-info flex-vertical">
          <div>
            <h1>
              <a href={song.url} rel="external noreferrer">
                {song.title}
              </a>
            </h1>
          </div>
          <div>
            <a className={classNames('uploader', song.service)} href={song.uploader.url} rel="external noreferrer">
              {song.uploader.name}
            </a>
          </div>
          <span className="extra">{parseInt(song.plays, 10).toLocaleString()} plays</span>
        </div>
      </div>
      <div className="song-progress-wrap flex-vertical flex-spacer">
        <div className="dj">
          <span>played by</span>
          <UserAvatar user={dj.id} avatar={dj.avatar} />
          <span className="dj-name">{dj.name}</span>
        </div>
        <div className="skip">
          <button className="btn" disabled>
            Skip
          </button>
          <span>{/* TODO */}</span>
        </div>
        <SongProgress startTime={startTime + offset} duration={song.duration} />
      </div>
    </div>
  );
}

export default connect(getCurrentSong)(CurrentSong);
