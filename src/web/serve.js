/* @flow */

import path from 'path';
import {static as serveStatic, Express} from 'express';

export default function serve(app: Express) {
  // serve compiled content
  if (process.env.NODE_ENV === 'production') {
    app.use(serveStatic(path.join(__dirname, '../../web/build')));
  } else {
    const webpack = require('webpack');
    const webpackDevMiddleware = require('webpack-dev-middleware');
    const webpackHotMiddleware = require('webpack-hot-middleware');

    const config = require('../../web/config/webpack.config.dev');
    const compiler = webpack(config);

    app.use(
      webpackDevMiddleware(compiler, {
        publicPath: config.output.publicPath,
      })
    );

    app.use(webpackHotMiddleware(compiler));
  }

  // serve static content
  app.use(serveStatic(path.join(__dirname, '../../web/public')));
}
