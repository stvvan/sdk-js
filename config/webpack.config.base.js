// @noflow
const path = require('path');
const webpack = require('webpack');

const getBabelConfig = require('./babel.config');

const webResolve = {
  fallback: {
    // libsodium does not use fs nor path in browsers.
    // These packages are referenced in node environment only
    fs: false,
    path: false,
    // libsodium uses node's crypto as a fallback if it doesn't find any other secure
    // random number generator. In our case `window.crypto` is always available
    crypto: false,

    // Node.js polyfills were removed from default behavior in Webpack 5
    // But buffer and process.nextTick are used in `readable-stream` see the README:
    // - https://github.com/nodejs/readable-stream#usage-in-browsers
    buffer: require.resolve('buffer/'),
    process: require.resolve('process/browser'),
  },
};

const getBabelLoaders = (env) => {
  const babelConfig = getBabelConfig(env);
  const babelConfigForceUMD = getBabelConfig({ ...env, modules: 'umd' });

  return [
    {
      test: /\.js$/,
      loader: 'babel-loader',
      options: babelConfig,
      exclude: /node_modules/,
    },
    {
      test: /\.js$/,
      loader: 'babel-loader',
      options: babelConfig,
      include: [
        // babelify our own stuff
        /node_modules(\\|\/)@tanker/,
        // babelify all es libs when included (except core-js-pure ponyfills)
        /node_modules(\\|\/)((?!core-js-pure).).*(\\|\/)es(\\|\/)/,
        // ws lib is es6 (it assumes the users will run it in nodejs directly)
        /node_modules(\\|\/)ws/,
        // supports-color is es6
        /node_modules(\\|\/)supports-color/,
        // they use arrow functions and probably more
        /node_modules(\\|\/)query-string/,
      ],
    },
    {
      test: /\.js$/,
      loader: 'babel-loader',
      options: babelConfigForceUMD,
      include: [
        // they use arrow functions
        /node_modules(\\|\/)chai-as-promised/,
        // they use arrow functions
        /node_modules(\\|\/)chai-exclude/,
        // they use object destructuring
        /node_modules(\\|\/)parse5/,
      ],
    },
  ];
};

const makeBaseConfig = ({ mode, target, react, hmre, devtool, plugins }) => {
  const base = {
    target,
    mode,
    devtool: devtool || (mode === 'development' ? 'source-map' : false),

    context: path.resolve(__dirname, '..'),

    output: {
      filename: mode === 'development' ? 'bundle.js' : 'bundle-[chunkhash].js',
      publicPath: '/',
    },

    module: {
      rules: [
        ...getBabelLoaders({ target, react, hmre }),
        {
          test: /\.(eot|ttf|woff|woff2|svg|png|jpg)$/,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 25000
            },
          },
        },
      ],
    },

    plugins: [
      // Always expose NODE_ENV to webpack, in order to use `process.env.NODE_ENV`
      // inside your code for any environment checks; Terser will automatically
      // drop any unreachable code.
      new webpack.EnvironmentPlugin({ NODE_ENV: mode }),
      ...(plugins || []),
    ],

    node: undefined,
    devServer: undefined,
  };

  if (target === 'web') {
    // 'es5' is necessary to support IE
    base.target = ['web', 'es5'];
    base.resolve = webResolve;
    base.plugins.push(
      // Node.js Polyfills were removed in Webpack 5
      new webpack.ProvidePlugin({
        process: 'process/browser',
      }),
    );
  }

  return base;
};

module.exports = { makeBaseConfig };
