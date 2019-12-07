import { Observable, Observer, from, merge } from 'rxjs'
import { flatMap } from 'rxjs/operators'
import { notNil, getCommonAncestorFromNodes } from '../utils'

const selectors = {
  tweet: '[data-testid="tweet"]',
}

export function getTweet(parentNode: ParentNode) {
  return parentNode.querySelector(selectors.tweet)
}

export function getTweets(targetNode: ParentNode = document) {
  return Array.from(targetNode.querySelectorAll(selectors.tweet))
}

function emitTweetNodes(observer: Observer<Element[]>) {
  const tweets = getTweets()

  if (tweets.length >= 2) {
    observer.next(tweets)
    observer.complete()
    return
  }
}

export const initialTweets$ = new Observable<Element[]>(observer => {
  emitTweetNodes(observer)

  if (observer.closed) {
    return
  }

  const mutationObserver = new MutationObserver(
    () => observer.closed || emitTweetNodes(observer)
  )

  mutationObserver.observe(document, { childList: true, subtree: true })

  return () => mutationObserver.disconnect()
})

export function getIncrementalTweets(targetNode: Node) {
  return new Observable<Element>(observer => {
    const mutationObserver = new MutationObserver(mutationList =>
      mutationList
        .flatMap(mutationRecord =>
          Array.from(<NodeListOf<Element>>mutationRecord.addedNodes)
        )
        .map(getTweet)
        .filter(notNil)
        .forEach(tweetNode => observer.next(tweetNode))
    )

    mutationObserver.observe(targetNode, { childList: true })

    return () => mutationObserver.disconnect()
  })
}

export const tweet$ = initialTweets$.pipe(
  flatMap(tweets =>
    merge(
      from(tweets),
      getIncrementalTweets(getCommonAncestorFromNodes(tweets))
    )
  )
)

export function createContainers() {
  const snackbar = document.createElement('div')

  document.body.append(snackbar)

  return { snackbar }
}
