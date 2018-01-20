import React from 'react';
import Guild from './Guild';
import {UserAvatar} from './DiscordIcon';

export default class ErrorScreen extends React.Component {
  render() {
    const props = this.makeInner();
    if (!props) return null;

    return (
      <div className="front flex-vertical flex-spacer">
        <div className="application-icon">
          <div className="application-icon-inner" />
        </div>
        <div className="front-inner">
          <header>
            <h1>{props.header}</h1>
          </header>
          <div className="scroller-wrap">
            <div className="details scroller">{props.body}</div>
          </div>
          <footer>{props.footer}</footer>
        </div>
      </div>
    );
  }

  makeInner() {
    const {type, data} = this.props;
    if (!type || type === 'none') return null;

    switch (type) {
      case 'not authenticated':
        return {
          header: 'Huh?!',
          body: (
            <section>
              <p>Well, this is embarrassing. I don't know how you got here!</p>
              <p>This isn't normal at all, so I'm not really sure how to proceed...</p>
              <p>Maybe try refreshing? Let's hope for the best!</p>
            </section>
          ),
        };

      case 'not connected':
        return {
          header: 'I fell asleep!',
          body: (
            <section>
              <p>Give me a couple of seconds to wake up, then try refreshing the page!</p>
            </section>
          ),
        };

      case 'not in server':
        return {
          // TODO
          header: 'Access denied!',
          body: (
            <div>
              <section>
                You need to be on:
                <Guild />
                {/* TODO */}
              </section>
              <section>
                You are logged in as:
                <div className="member">
                  <UserAvatar user={data.user.id} avatar={data.user.avatar} />
                  <div className="member-inner">
                    <div className="member-username">
                      <span className="member-username-inner">{data.user.username}</span>
                    </div>
                    <span className="member-discriminator">#{data.user.discriminator}</span>
                  </div>
                </div>
              </section>
              <section>
                <p>
                  <strong>If this is the correct account</strong>, you're out of luck, buddy.
                </p>
                <p>
                  <strong>If this is the wrong account</strong>,{' '}
                  <a href="https://discordapp.com/channels/@me">open Discord in your browser</a> and log into the
                  correct account. Then click the button below.
                </p>
              </section>
            </div>
          ),
          footer: (
            <form method="POST" action="logout">
              <button className="primary" type="submit">
                Re-authenticate
              </button>
            </form>
          ),
        };

      case 'disconnected':
        return {
          header: 'Disconnected!',
          body: (
            <section>
              <p>Sorry! I might have gone to sleep for the night!</p>
              <p>If you know I'm supposed to be awake, try giving this page a refresh!</p>
            </section>
          ),
        };

      default:
        return {
          // TODO
          header: 'Wha?!',
          body: (
            <section>
              <p>???</p>
            </section>
          ),
        };
    }
  }
}
