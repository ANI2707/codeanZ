const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    'background/service-worker': './extension/background/service-worker.js',
    'content/content-script': './extension/content/content-script.js',
    'popup/popup': './extension/popup/popup.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'extension/manifest.json', to: 'manifest.json' },
        { from: 'extension/popup/popup.html', to: 'popup/popup.html' },
        { from: 'extension/popup/popup.css', to: 'popup/popup.css' },
        { from: 'extension/content/content-styles.css', to: 'content/content-styles.css' },
        { from: 'extension/assets', to: 'assets' }
      ],
    }),
  ],
  resolve: {
    extensions: ['.js', '.ts'],
  },
};
