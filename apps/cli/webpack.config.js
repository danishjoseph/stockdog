const path = require('path');
const webpack = require(
  require.resolve('webpack', {
    paths: [path.dirname(require.resolve('@nx/webpack'))],
  })
);
const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { version } = require('../../package.json');

module.exports = {
  plugins: [
    new webpack.DefinePlugin({
      'process.env.STOCKDOG_VERSION': JSON.stringify(version),
    }),
    new NxAppWebpackPlugin({
      main: './src/main.ts',
      target: 'node',
      compiler: 'tsc',
      tsConfig: './tsconfig.app.json',
      outputPath: 'dist/apps/cli',
      outputHashing: 'none',
      optimization: process.env.NODE_ENV === 'production',
      sourceMap: process.env.NODE_ENV !== 'production',
    }),
  ],
};
