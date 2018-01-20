import React from 'react';
//import './Member.css';
import classNames from 'classnames';

import {UserAvatar} from './DiscordIcon';

export default function Member(props) {
  const memberClasses = classNames('member', {
    me: props.self,
    active: props.active,
  });

  return (
    <div className={memberClasses}>
      <UserAvatar user={props.id} avatar={props.avatar} />
      <div className="member-inner">
        <div className="member-username">
          <span className="member-username-inner">{props.name}</span>
        </div>
      </div>
    </div>
  );
}
