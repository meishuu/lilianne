const path = require('path');
const paths = require('./paths');

module.exports = {
  resolve: {
    modules: ['node_modules', paths.appNodeModules],
    extensions: ['.js', '.json'],
    alias: {
      'socket.io-client': 'socket.io-client/dist/socket.io.slim.js',
    },
  },
};
