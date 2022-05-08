const { resolve } = require('path');

module.exports = {
  mode: 'development',
  entry: resolve(__dirname, 'client/index.js'),
  output: {
    path: resolve(__dirname, 'build'),
    filename: 'bundle.js',
  },
};
