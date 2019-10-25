const path = require('path')
const mergeDeep = require('merge-deep')

const MiniCSSExtractPlugin = require('mini-css-extract-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const CleanPlugin = require('clean-webpack-plugin').CleanWebpackPlugin
const CheckerPlugin = require('awesome-typescript-loader').CheckerPlugin
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

const paths = {
  src: root('src'),
  assets: root('assets'),
  build: {
    toString() {
      return root('build')
    },
    get chrome() {
      return path.join(this.toString(), 'chrome')
    },
    get firefox() {
      return path.join(this.toString(), 'firefox')
    },
  },
  dist: {
    toString() {
      return root('dist')
    },
    get chrome() {
      return path.join(this.toString(), 'chrome')
    },
    get firefox() {
      return path.join(this.toString(), 'firefox')
    },
  },
  cache: root('node_modules/.cache'),
  get manifests() {
    const paths = this

    return {
      toString() {
        return path.join(paths.src, 'manifests')
      },
      get chrome() {
        return path.join(this.toString(), 'manifest.chrome.json')
      },
      get firefox() {
        return path.join(this.toString(), 'manifest.firefox.json')
      },
    }
  },
  get manifest() {
    return path.join(this.src, 'manifest.json')
  },
}

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
      'content-script': './content-script.ts',
      'background-script': './background-script.ts',
    },
    output: {
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
    plugins: [copyManifest(paths.manifests.chrome)],
  }
  const development = {
    output: {
      path: paths.build.chrome,
    },
    plugins: [
      new CleanPlugin({
        cleanOnceBeforeBuildPatterns: [paths.build.chrome],
      }),
      copyAssets(paths.build.chrome),
    ],
  }
  const production = {
    output: {
      path: paths.dist.chrome,
    },
    plugins: [
      new CleanPlugin({
        cleanOnceBeforeBuildPatterns: [paths.dist.chrome],
      }),
      copyAssets(paths.dist.chrome),
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
    plugins: [copyManifest(paths.manifests.firefox)],
  }
  const development = {
    output: {
      path: paths.build.firefox,
    },
    plugins: [
      new CleanPlugin({
        cleanOnceBeforeBuildPatterns: [paths.build.firefox],
      }),
      copyAssets(paths.build.firefox),
    ],
  }
  const production = {
    output: {
      path: paths.dist.firefox,
    },
    plugins: [
      new CleanPlugin({
        cleanOnceBeforeBuildPatterns: [paths.dist.firefox],
      }),
      copyAssets(paths.dist.firefox),
    ],
  }

  return {
    development: mergeDeep(base.development, common, development),
    production: mergeDeep(base.production, common, production),
  }
}

module.exports = createConfig
