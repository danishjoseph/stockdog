const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');

module.exports = {
  plugins: [
    new NxAppWebpackPlugin({
      main: './src/main.ts',
      target: 'node',
      compiler: 'tsc',
      tsConfig: './tsconfig.app.json',
      outputPath: 'dist/apps/backend',
      outputHashing: 'none',
      optimization: false,
    }),
  ],
};
