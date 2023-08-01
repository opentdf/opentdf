var webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  optimization: {
    minimize: false
  },
  output: {
    path: path.join(__dirname, '/dist'),
    filename: 'index.bundle.js',
    publicPath: '/secure-remote-storage/'
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
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
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
    extensions: ['.js'],
    fallback: {
      constants: false,
      // fs should resolve to undefined
      fs: false,
      // Required by hmmac, but we do not use HMAC auth in the browser.
      querystring: false,
      crypto: false,
      // https: 'https-browserify',
      // http: 'stream-http',
      // stream: 'stream-browserify',
      url: false,
      path: false,
    },
    modules: [path.join(__dirname, './node_modules')],
  },
};
