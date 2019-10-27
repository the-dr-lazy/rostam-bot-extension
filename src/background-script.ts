import * as Bus from './bus'

chrome.webNavigation.onHistoryStateUpdated.addListener(
  ({ tabId }) => chrome.tabs.sendMessage(tabId, Bus.historyUpdated()),
  { url: [{ hostContains: 'twitter.com' }] }
)
