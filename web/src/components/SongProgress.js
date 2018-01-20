import React, {Component} from 'react';
import {timeStr} from '../util/song';

export default class SongProgress extends Component {
  // properties
  requestAnim = 0;

  state = {
    progress: this.calcProgress(),
  };

  tick = () => {
    if (!this.requestAnim) return;
    this.setState({progress: this.calcProgress()});
    this.requestAnim = requestAnimationFrame(this.tick);
  };

  // methods
  componentDidMount() {
    this.requestAnim = requestAnimationFrame(this.tick);
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.requestAnim);
    this.requestAnim = 0;
  }

  calcProgress() {
    const {startTime, duration} = this.props;
    const progress = (Date.now() - startTime) / (duration * 1000);
    if (progress < 0) return 0;
    if (progress > 1) return 1;
    return progress;
  }

  render() {
    const durationStr = timeStr(this.props.duration);
    const progressStyle = {width: `${this.state.progress * 100}%`};

    return (
      <div className="progress flex-horizontal">
        <span className="current-time">
          <span className="hidden-time">
            {/* hack to make sure bar width doesn't change */}
            {durationStr.replace(/\d/g, '8')}
          </span>
          <span className="display-time">{timeStr(this.state.progress * this.props.duration)}</span>
        </span>
        <div className="progress-bar">
          <div className="progress-value" style={progressStyle} />
        </div>
        <span className="song-duration">{durationStr}</span>
      </div>
    );
  }
}
