<h1 align="center">Rostam Bot</h1>

<h3 align="center">Browser extension that notify you suspicious accounts on Twitter</h3>

<p align="center">
  <a href="LICENSE">
    <img alt="License" src="https://img.shields.io/npm/l/deox.svg?logo=License&style=flat-square">
  </a>
  <a href="https://github.com/semantic-release/semantic-release">
    <img alt="Semantic Release" src="https://img.shields.io/badge/%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square">
  </a>
  <a href="CONTRIBUTING.md">
    <img alt="PRs welcome" src="https://img.shields.io/badge/PRs-welcome-green.svg?style=flat-square">
  </a>
</p>

⚠️ **The extension is in beta state and only works on Chrome browser** ⚠️

If you wanna be a beta tester, you can follow the [installtion instruction](#install).
Do you found any bug with extension? well, please let us know by [opening an issue](https://github.com/thebrodmann/rostam-bot-extension/issues).

## Install

Prerequisites:

- [Node.js](https://nodejs.org/)
- [NPM](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/)

Install dependencies

```bash
# For NPM
npm install

# For Yarn
yarn install
```

Then you need to build the extension to install it on Chrome as an unpacked extension :

```bash
# For NPM
npm run build

# For Yarn
yarn run build
```

The command should exit with zero exit code and in the root of project the `build` directory should be appeared. Open `chrome://extensions` URL in Chrome browser; Click on `Load unpacked` button and select `build` directory. If there is not any `Load unpacked` button on page please make sure the developer mode options is turned on.

Now you can go to twitter and be integrated with [Rostam Bot](rostambot.com) without installing any twitter application so you should not be worry about your privacy.

## Features

## Versioning

Rostam bot browser extension uses [Semantic Versioning 2.0.0](https://semver.org/).

## Contributing

Please read through our [contributing guidelines](CONTRIBUTING.md).

## 👏 Respect earns Respect

Please respect our [Code of Conduct](CODE_OF_CONDUCT.md), in short:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

## License

Rostam bot browser extension is released under [MIT license](LICENSE).
