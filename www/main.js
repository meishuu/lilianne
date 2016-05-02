(jQuery(function($) {

$.timeago.settings.localeTitle = true;

function $text(text) {
  return document.createTextNode(text);
}

function $make(element, classes) {
  return $(document.createElement(element)).addClass(classes);
}

function $div(classes) {
  return $make('div', classes);
}

function $span(classes) {
  return $make('span', classes);
}

function $a(href, classes) {
  return $make('a', classes).attr({ href: href, target: '_blank' });
}

function getIcon(server) {
  return 'https://cdn.discordapp.com/icons/' + server.id + '/' + server.icon + '.jpg';
}

function getAvatar(user) {
  return 'https://cdn.discordapp.com/avatars/' + user.id + '/' + user.avatar + '.jpg';
}

function timeStr(s) {
  function pad(n) {
    return ('0' + n).slice(-2);
  }

  var m = Math.floor(s / 60);
  s %= 60;
  var h = Math.floor(m / 60);
  m %= 60;

  if (h > 0) {
    return [h, pad(m), pad(s)].join(':');
  } else {
    return [m, pad(s)].join(':');
  }
}

var myId;
var currentSong;

function setupInterface() {
  /********
   * HTML *
   ********/
  $('body').append(
    $div('app flex-horizontal').append(
      $div('channel-members-wrap flex-vertical').append(
        $div('guild').append(
          $div('avatar-small'),
          $div('guild-inner').append(
            $div('guild-name'),
            $div('channel-name')
          )
        ),
        $div('scroller-wrap').append(
          $div('channel-members scroller').append(
            $make('h2').text('DJ Order')
          )
        )
      ),
      $div('song-info-wrap flex-vertical flex-spacer').append(
        $div('current-song-wrap flex-horizontal'),
        $div('song-queue-wrap flex-vertical flex-spacer').append(
          $div('flex-vertical flex-spacer').append(
            $div('scroller-wrap').append(
              $div('song-list scroller').append(
                $make('h2').text('Your Queue'),
                $div('song-queue sortable')
              )
            ),
            $make('form').append(
              $div('url-textarea').append(
                $div('url-textarea-inner').append(
                  /* TODO file upload button */
                  $make('input').attr({ type: 'text', placeholder: 'Add a song by URL' })
                )
              )
            )
          )
        )
      ),
      $div('song-history-wrap flex-vertical').append(
        $div('scroller-wrap').append(
          $div('song-history scroller').append(
            $make('h2').text('Song History')
          )
        )
      )
    )
  );

  /**********
   * EVENTS *
   **********/
  $('.song-queue-wrap form').submit(function onSubmit(event) {
    event.preventDefault();
    var $area = $('.url-textarea');
    var $input = $area.find('input');
    var url = $input.val();

    socket.emit('add', url);

    $area.addClass('url-textarea-disabled');
    $input.prop('disabled', true).attr('placeholder', 'Adding song...').val('');

    $('.song-queue').append(
      $div('song inactive').append(
        $div('info').append(
          $a(url).text(url)
        ),
        $div('status').text('waiting...'),
        $div('actions').append(
          $make('button', 'btn-delete').attr('type', 'button').html('&times;')
        )
      )
    );
  });
}

function showServer(server) {
  $('.guild .avatar-small').css('background-image', 'url("' + getIcon(server) + '")');
  $('.guild .guild-name').text(server.name);
  $('.guild .channel-name').text(server.channel);
}

function showOrder(order) {
  var $members = $('.channel-members');
  $members.find('.member').remove(); // TODO
  for (var i = 0, len = order.length; i < len; i++) {
    var user = order[i];
    var member =
      $div('member').append(
        $div('avatar-small').css('background-image', 'url("' + getAvatar(user) + '")'),
        $div('member-inner').append(
          $div('member-username').append(
            $span('member-username-inner').text(user.username)
          )
        )
      );
    member.toggleClass('me', user.id === myId);
    // member.toggleClass('inactive', ...);
    $members.append(member);
  }
}

function showSong(song) {
  if (currentSong) showHistory([currentSong], true);
  currentSong = song;

  var $container = $('.current-song-wrap');
  if (!song) {
    $container.empty().append(
      $div('no-song').append(
        $make('h1').text('There is no song playing.')
      )
    );
  } else {
    var hiddenTime = timeStr(song.duration).replace(/\d/g, '9');

    currentSong.player.startTime += Date.now() - currentSong.player.currentTime;

    $container.empty().append(
      $div('current-song flex-horizontal').append(
        $div('song-image').append(
          $a(song.url).append(
            $make('img', 'image').attr({ src: song.image })
          )
        ),
        $div('song-info flex-vertical').append(
          $div().append(
            $make('h1').append(
              $a(song.url).text(song.title)
            )
          ),
          $div().append(
            $a(song.uploader.url, 'uploader ' + song.service).text(song.uploader.name)
          ),
          $span('extra').text((+song.plays).toLocaleString() + ' plays')
        )
      ),
      $div('song-progress-wrap flex-vertical flex-spacer').append(
        $div('dj').append(
          $make('span').text('played by'),
          $div('avatar-small').css('background-image', 'url("' + getAvatar(song.player.dj) + '")'),
          $span('dj-name').text(song.player.dj.username)
        ),
        $div('skip').append(
          $make('button', 'btn').prop('disabled', true).text('Skip'),
          $make('span')
        ),
        $div('progress flex-horizontal').append(
          $span('current-time').append(
            $span('hidden-time').text(hiddenTime),
            $span('display-time')
          ),
          $div('progress-bar').append(
            $div('progress-value')
          ),
          $span('song-duration').text(timeStr(song.duration))
        )
      )
    );

    updateTime();
  }
}

function showQueue(queue) {
  queue = queue || [];

  var $queue = $('.song-queue');
  var $inactive = $queue.find('.inactive');

  var $songs = $(queue.map(function(data, index) {
    var song = data[0];
    var qid = data[1];
    return (
      $div('song').append(
        $div('index').text(index + 1),
        $div('thumbnail').append(
          $make('img', 'image').attr('src', song.image)
        ),
        $div('info').append(
          $div('title').text(song.title),
          $div('uploader ' + song.service).text(song.uploader.name)
        ),
        $div('status'),
        $div('time').text(timeStr(song.duration)),
        $div('actions').append(
          $make('button', 'btn-delete').attr('type', 'button').data('queue-id', qid).html('&times;')
        )
      )
    ).get(0);
  }));

  $songs.find('.btn-delete').click(function onClick() {
    var $this = $(this);
    socket.emit('delete', $this.data('queue-id'));
    $this.closest('.song').addClass('deleting');
  });

  $queue.empty().append($songs, $inactive);
}

function showHistory(history, animate) {
  var $items = $(history.map(function(song) {
    return (
      $div('item').append(
        $div('song').append(
          $div('thumbnail').append(
            $a(song.url).append(
              $make('img', 'image').attr('src', song.image)
            )
          ),
          $div('info').append(
            $a(song.url, 'title').text(song.title),
            $div('played-by').append(
              $div('avatar-small').css('background-image', 'url("' + getAvatar(song.player.dj) + '")'),
              $span('dj-name').text(song.player.dj.username)
            ),
            $make('time').attr('datetime', new Date(song.player.startTime).toISOString())
          )
        )
      )
    ).get(0);
  })).insertAfter('.song-history h2');
  $items.find('time').timeago();
  if (animate) $items.hide().slideDown();
}

function updateTime() {
  if (!currentSong) return;

  var startTime = currentSong.player.startTime;
  var currentTime = Math.floor((Date.now() - startTime) / 1000);
  if (currentTime < 0) currentTime = 0;
  if (currentTime > currentSong.duration) currentTime = currentSong.duration;

  $('.display-time').text(timeStr(currentTime));
  $('.progress-value').css('width', (currentTime / currentSong.duration) * 100 + '%');
}

setInterval(updateTime, 500);

var socket = io();
socket.on('app error', function ioAppError(err) {
  $('.front').empty().append(
    $div('application-icon').append(
      $div('application-icon-inner').css('background-image', 'url("https://cdn.discordapp.com/app-icons/165597416433778688/71352fda21f75626f26a6764c0482f79.jpg")')
    ),
    $div('front-inner')
  );

  switch (err.type) {
    default:
    case 'not authenticated':
      $('.front-inner').append(
        $make('header').append(
          $make('h1').text('Huh?!')
        ),
        $div('scroller-wrap').append(
          $div('details scroller').append(
            $make('section').append(
              $make('p').text('Well, this is embarrassing. I don\'t know how you got here!'),
              $make('p').text('This isn\'t normal at all, so I\'m not really sure how to proceed...'),
              $make('p').text('Maybe try refreshing? Let\'s hope for the best!')
            )
          )
        ),
        $make('footer')
      );
      break;

    case 'not connected':
      $('.front-inner').append(
        $make('header').append(
          $make('h1').text('I fell asleep!')
        ),
        $div('scroller-wrap').append(
          $div('details scroller').append(
            $make('section').append(
              $text('Give me a couple of seconds to wake up, then try refreshing the page!')
            )
          )
        ),
        $make('footer')
      );
      break;

    case 'not in server':
      $('.front-inner').append(
        $make('header').append(
          $make('h1').text('Access denied!')
        ),
        $div('scroller-wrap').append(
          $div('details scroller').append(
            $make('section').append(
              $text('You need to be on:'),
              $div('guild').append(
                $div('avatar-small').css('background-image', 'url("' + getIcon(err.server) + '")'),
                $div('guild-inner').append(
                  $div('guild-name').text(err.server.name),
                  $div('channel-name').text(err.server.channel)
                )
              )
            ),
            $make('section').append(
              $text('You are logged in as:'),
              $div('member').append(
                $div('avatar-small').css('background-image', 'url("' + getAvatar(err.user) + '")'),
                $div('member-inner').append(
                  $div('member-username').append(
                    $span('member-username-inner').text(err.user.username)
                  ),
                  $span('member-discriminator').text('#' + err.user.discriminator)
                )
              )
            ),
            $make('section').append(
              $make('p').append(
                $make('strong').text('If this is the correct account'),
                $text(', you\'re out of luck, buddy.')
              ),
              $make('p').append(
                $make('strong').text('If this is the wrong account'),
                $text(', '),
                $a('https://discordapp.com/channels/@me').text('open Discord in your browser'),
                $text(' and log into the correct account. Then click the button below.')
              )
            )
          )
        ),
        $make('footer').append(
          $make('form').attr({ method: 'POST', action: 'logout' }).append(
            $make('button', 'primary').attr('type', 'submit').text('Re-authenticate')
          )
        )
      );
      break;
  }
});

socket.on('error', function ioError(err) {
  console.warn('socket.io error');
  console.warn(err);
});

socket.on('disconnect', function ioDisconnect() {
  $('.front').empty().append(
    $div('front-inner').append(
      $make('header').append(
        $make('h1').text('Disconnected!')
      ),
      $div('scroller-wrap').append(
        $div('details scroller').append(
          $make('section').append(
            $make('p').text('Sorry! I might have gone to sleep for the night!'),
            $make('p').text('If you know I\'m supposed to be awake, try giving this page a refresh!')
          )
        )
      ),
      $make('footer')
    )
  ).fadeIn(function() {
    $('.app').remove();
  });
});

socket.on('load', function ioLoad(data) {
  myId = data.id;
  setupInterface();
  showServer(data.server);
  showSong(data.current);
  showOrder(data.order);
  showQueue(data.queue);
  showHistory(data.history);
  $('.front').fadeOut();
});

socket.on('song', function ioSong(song) {
  console.log(song);
  showSong(song);
});

socket.on('order', function ioOrder(order) {
  showOrder(order);
});

socket.on('queue', function ioQueue(queue) {
  showQueue(queue);
});

function readyToAdd() {
  var $form = $('.song-queue-wrap form');
  var $area = $form.find('.url-textarea');
  var $input = $area.find('input');

  $area.removeClass('url-textarea-disabled');
  $input.prop('disabled', false).attr('placeholder', 'Add a song by URL');
};

socket.on('add status', function ioAddStatus(type, data) {
  var $song = $('.inactive');
  if (!$song) return console.warn('no song found with add status ' + type);

  switch (type) {
    case 'error':
      $song.removeClass('inactive').addClass('error');
      console.error(data); // TODO
      readyToAdd();
      break;

    case 'meta':
      $song.find('.info, .status').remove();
      $song.prepend(
        $div('index'),
        $div('thumbnail').append(
          $make('img', 'image').attr('src', data.image)
        ),
        $div('info').append(
          $div('title').text(data.title),
          $div('uploader ' + data.service).text(data.uploader.name)
        ),
        $div('status').text('waiting...'),
        $div('time').text(timeStr(data.duration))
      );
      break;

    case 'downloading':
      $song.find('.status').text('downloading...');
      break;

    case 'processing':
      $song.find('.status').text('processing...');
      break;

    case 'done':
      $song.removeClass('inactive');
      readyToAdd();
      break;
  }
});

}));
