import { joinPath } from './data'

export const extensionBaseURL = chrome.extension.getURL('')

export function getAssetURL(...paths: string[]) {
  return joinPath(extensionBaseURL, 'assets', ...paths)
}

export enum Icon {
  Poison = 'poison',
}

export function getIconURL(name: Icon) {
  return getAssetURL('icons', `${name}.svg`)
}
