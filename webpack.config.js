const path = require('path')
const mergeDeep = require('merge-deep')

const MiniCSSExtractPlugin = require('mini-css-extract-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const CleanPlugin = require('clean-webpack-plugin').CleanWebpackPlugin
const {
  CheckerPlugin,
  TsConfigPathsPlugin,
} = require('awesome-typescript-loader')
const DotenvPlugin = require('dotenv-webpack')

const pkg = require('./package.json')

// Utils

let __DEV__

function root(...args) {
  return path.resolve(__dirname, ...args)
}

function copyAssets(destination) {
  return new CopyPlugin(
    [{ from: paths.assets, to: path.join(destination, 'assets') }],
    { copyUnmodified: true }
  )
}

function copyManifest(manifest) {
  return new CopyPlugin(
    [
      {
        from: manifest,
        to: 'manifest.json',
        transform: manifestTransform,
      },
    ],
    { copyUnmodified: true }
  )
}

// Reusable stuffs

const defaultEnv = { production: false }

const paths = Object.freeze({
  src: root('src'),
  get scripts() {
    return path.join(paths.src, 'scripts')
  },
  get contentScript() {
    return path.join(paths.scripts, 'content.ts')
  },
  get backgroundScript() {
    return path.join(paths.scripts, 'background.ts')
  },
  get manifests() {
    return path.join(paths.src, 'manifests')
  },
  get chromeManifest() {
    return path.join(paths.manifests, 'manifest.chrome.json')
  },
  get firefoxManifest() {
    return path.join(paths.manifests, 'manifest.firefox.json')
  },
  assets: root('assets'),
  build: root('build'),
  get buildChrome() {
    return path.join(paths.build, 'chrome')
  },
  get buildFirefox() {
    return path.join(paths.build, 'firefox')
  },
  dist: root('dist'),
  get distChrome() {
    return path.join(paths.dist, 'chrome')
  },
  get distFirefox() {
    return path.join(paths.dist, 'firefox')
  },
  cache: root('node_modules/.cache'),
})

// Configuration

function createConfig({ production } = defaultEnv) {
  const base = createBaseConfig()
  const chrome = createChromeConfig(base)
  const firefox = createFirefoxConfig(base)

  __DEV__ = !production

  return production
    ? [chrome.production, firefox.production]
    : [chrome.development, firefox.development]
}

function manifestTransform(content) {
  const manifest = {
    ...JSON.parse(content.toString()),
    description: pkg.description,
    version: pkg.version,
    content_security_policy: __DEV__
      ? "script-src 'self' 'unsafe-eval'; object-src 'self'"
      : "script-src 'self'; object-src 'self'",
  }

  return Buffer.from(JSON.stringify(manifest, null, 2))
}

function createBaseConfig() {
  const common = {
    context: paths.src,
    entry: {
      'content-script': paths.contentScript,
      'background-script': paths.backgroundScript,
    },
    output: {
      filename: '[name].js',
    },
    resolve: {
      extensions: ['.ts', '.js'],
      plugins: [new TsConfigPathsPlugin()],
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
      new CheckerPlugin(),
      new MiniCSSExtractPlugin({
        filename: '[name].css',
      }),
      new DotenvPlugin({
        path: root('.env'),
        defaults: root('.env.defaults'),
        safe: root('.env.example'),
      }),
    ],
  }
  const development = { mode: 'development' }
  const production = { mode: 'production' }

  return {
    development: mergeDeep(common, development),
    production: mergeDeep(common, production),
  }
}

function createChromeConfig(base) {
  const common = {
    name: 'chrome',
    plugins: [copyManifest(paths.chromeManifest)],
  }
  const development = {
    output: {
      path: paths.buildChrome,
    },
    plugins: [
      new CleanPlugin({
        cleanOnceBeforeBuildPatterns: [paths.buildChrome],
      }),
      copyAssets(paths.buildChrome),
    ],
  }
  const production = {
    output: {
      path: paths.distChrome,
    },
    plugins: [
      new CleanPlugin({
        cleanOnceBeforeBuildPatterns: [paths.distChrome],
      }),
      copyAssets(paths.distChrome),
    ],
  }

  return {
    development: mergeDeep(base.development, common, development),
    production: mergeDeep(base.production, common, production),
  }
}

function createFirefoxConfig(base) {
  const common = {
    name: 'firefox',
    plugins: [copyManifest(paths.firefoxManifest)],
  }
  const development = {
    output: {
      path: paths.buildFirefox,
    },
    plugins: [
      new CleanPlugin({
        cleanOnceBeforeBuildPatterns: [paths.buildFirefox],
      }),
      copyAssets(paths.buildFirefox),
    ],
  }
  const production = {
    output: {
      path: paths.distFirefox,
    },
    plugins: [
      new CleanPlugin({
        cleanOnceBeforeBuildPatterns: [paths.distFirefox],
      }),
      copyAssets(paths.distFirefox),
    ],
  }

  return {
    development: mergeDeep(base.development, common, development),
    production: mergeDeep(base.production, common, production),
  }
}

module.exports = createConfig
