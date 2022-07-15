var webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  output: {
    path: path.join(__dirname, '/dist'),
    filename: 'index.bundle.js',
    // publicPath: '/secure-remote-storage/'
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'src'),
    },
    port: 3001,
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /nodeModules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif|mp3)$/i,
        type: 'asset/resource',
      },
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: "index.html",
    }),
    new webpack.ProvidePlugin({
      title: "Secure Remote Storage",
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
      stream: 'stream-browserify',
    }),
  ],
  resolve: {
    alias: {
      stream: "stream-browserify",
    },
    extensions: ['.js'],
  },
  devtool: 'source-map',
};
