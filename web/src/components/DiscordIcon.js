import React from 'react';

export default function DiscordIcon(props) {
  const { type, id, icon } = props;
  if (!id || !icon) {
    return (
      <div className={`${props.type}-wrap`}>
        <img
          className={props.type}
          src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
          alt=""
        />
      </div>
    );
  }

  const baseUrl = `https://cdn.discordapp.com/${type}s/${id}/${icon}`;
  return (
    <div className={`${type}-wrap`}>
      <picture>
        <source srcSet={baseUrl + '.webp'} type="image/webp" />
        <img className={type} src={baseUrl + '.jpg'} alt="" />
      </picture>
    </div>
  );
}

export function UserAvatar(props) {
  return <DiscordIcon type="avatar" id={props.user} icon={props.avatar} />;
}

export function GuildIcon(props) {
  return <DiscordIcon type="icon" id={props.id} icon={props.icon} />;
}
