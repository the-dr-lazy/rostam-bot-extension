import { joinPath } from './data'

export const extensionBaseURL = chrome.extension.getURL('')

export function getAssetURL(...paths: string[]) {
  return joinPath(extensionBaseURL, 'assets', ...paths)
}

export enum Icon {
  PoisonStroke = require('../icons/poison-stroke.svg'),
  PoisonFill = require('../icons/poison-fill.svg'),
}

export function getIconURL(name: Icon) {
  return joinPath(extensionBaseURL, `${name}`)
}
