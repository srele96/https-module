const { resolve } = require('path');

module.exports = {
  mode: 'development',
  entry: resolve(__dirname, 'src/client.js'),
  output: {
    path: resolve(__dirname, 'build'),
    filename: 'bundle.js',
  },
};
