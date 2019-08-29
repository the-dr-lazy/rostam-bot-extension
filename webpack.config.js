const path = require('path')
const MiniCSSExtractPlugin = require('mini-css-extract-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const CleanPlugin = require('clean-webpack-plugin').CleanWebpackPlugin
const CheckerPlugin = require('awesome-typescript-loader').CheckerPlugin
const DotenvPlugin = require('webpack-dotenv-plugin')

const pkg = require('./package.json')

function root(...args) {
  return path.resolve(__dirname, ...args)
}

const paths = {
  src: root('src'),
  assets: root('assets'),
  build: root('build'),
  cache: root('node_modules/.cache'),
  get manifest() {
    return path.join(this.src, 'manifest.json')
  },
}

module.exports = {
  context: paths.src,
  mode: 'development',
  entry: {
    'content-script': './content-script.ts',
  },
  output: {
    path: paths.build,
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/i,
        loader: 'awesome-typescript-loader',
        options: {
          transpileModule: true,
          forceIsolatedModules: true,
          useCache: true,
          cacheDirectory: path.join(paths.cache),
        },
      },
      {
        test: /\.scss$/i,
        use: [
          { loader: MiniCSSExtractPlugin.loader },
          'css-loader',
          'postcss-loader',
          'sass-loader',
        ],
      },
    ],
  },

  plugins: [
    new CleanPlugin({
      cleanOnceBeforeBuildPatterns: [paths.build],
    }),
    new CopyPlugin(
      [
        {
          from: path.join(paths.src, 'manifest.json'),
          transform(content) {
            const manifest = {
              ...JSON.parse(content.toString()),
              description: pkg.description,
              version: pkg.version,
            }

            return Buffer.from(JSON.stringify(manifest, null, 2))
          },
        },
        { from: paths.assets, to: path.join(paths.build, 'assets') },
      ],
      { copyUnmodified: true }
    ),
    new CheckerPlugin(),
    new MiniCSSExtractPlugin({
      filename: '[name].css',
    }),
    new DotenvPlugin({
      sample: root('.env.example'),
      path: root('.env'),
    }),
  ],
}
