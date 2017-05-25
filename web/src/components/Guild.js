import React from 'react';

import { GuildIcon } from './DiscordIcon';

export default function Guild(props) {
  return (
    <div className="guild">
      <GuildIcon id={props.id} icon={props.icon} />
      <div className="guild-inner">
        <div className="guild-name">{props.name}</div>
        <div className="channel-name">{props.channel}</div>
      </div>
    </div>
  );
}
