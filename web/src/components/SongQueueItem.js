import React from 'react';
import classNames from 'classnames';
import {timeStr} from '../util/song';

const QueueItemStatus = {
  INVALID: 0,
  UNKNOWN: 1,
  WAITING: 2,
  DOWNLOADING: 3,
  PROCESSING: 4,
  DONE: 5,
};

function getStatusText(status) {
  switch (status) {
    case QueueItemStatus.INVALID:
      return 'Error';
    case QueueItemStatus.UNKNOWN:
      return 'adding...';
    case QueueItemStatus.WAITING:
      return 'waiting...';
    case QueueItemStatus.DOWNLOADING:
      return 'downloading...';
    case QueueItemStatus.PROCESSING:
      return 'processing...';
    case QueueItemStatus.DONE:
    default:
      return 'ready';
  }
}

function ItemWaiting({index, data, onDelete}) {
  const songClass = classNames({
    song: true,
    inactive: !data.error,
    error: !!data.error,
  });

  return (
    <div className={songClass}>
      <div className="index">{index + 1}</div>
      <div className="info">
        <a href={data.url}>{data.url}</a>
      </div>
      <div className="status">{getStatusText(data.status)}</div>
      <div className="actions">
        <button className="btn-delete" type="button" onClick={onDelete}>
          &times;
        </button>
      </div>
    </div>
  );
}

function ItemResolved({index, data, onDelete}) {
  const {song} = data;
  return (
    <div className="song">
      <div className="index">{index + 1}</div>
      <div className="thumbnail">
        <img className="image" src={song.image} alt="" />
      </div>
      <div className="info">
        <div className="title">
          <a href={song.url} rel="external noreferrer">
            {song.title}
          </a>
        </div>
        <div className={classNames('uploader', song.service)}>{song.uploader.name}</div>
      </div>
      <div className="status">{getStatusText(data.status)}</div>
      <div className="time">{timeStr(song.duration)}</div>
      <div className="actions">
        <button className="btn-delete" type="button" onClick={onDelete}>
          &times;
        </button>
      </div>
    </div>
  );
}

export default function SongQueueItem(props) {
  if (!props.data.song) {
    return ItemWaiting(props);
  } else {
    return ItemResolved(props);
  }
}
