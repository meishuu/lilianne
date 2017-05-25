import React from 'react';

import ErrorConnector from '../connectors/ErrorConnector';
import GuildConnector from '../connectors/GuildConnector';
import MemberList from './MemberList';
import CurrentSong from './CurrentSong';
import SongQueue from './SongQueue';
import SongHistory from './SongHistory';

export default function App() {
  return (
    <div>
      <ErrorConnector />
      <div className="app flex-horizontal">
        <div className="channel-members-wrap flex-vertical">
          <GuildConnector />
          <MemberList />
        </div>
        <div className="song-info-wrap flex-vertical flex-spacer">
          <CurrentSong />
          <SongQueue />
        </div>
        <div className="song-history-wrap flex-vertical">
          <SongHistory />
        </div>
      </div>
    </div>
  );
}
