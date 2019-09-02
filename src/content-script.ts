import {
  Observable,
  merge,
  from,
  interval,
  EMPTY,
  throwError,
  Observer,
} from 'rxjs'
import {
  flatMap,
  map,
  filter,
  mapTo,
  publishBehavior,
  distinctUntilKeyChanged,
  refCount,
} from 'rxjs/operators'
import { always } from 'rambda'

import * as Rostam from './api'
import {
  getCommonAncestorFromNodes,
  notNil,
  getUsernameFromPathname,
  route,
  isTrue,
  clone,
  getAllTweetNodes,
  getTweetNode,
  makeAvatarSuspicous,
} from './utils'

import './content-script.scss'

function getNewAddedTweetNodes(targetNode: Node) {
  return new Observable<Element>(observer => {
    const mutationObserver = new MutationObserver(mutationList =>
      mutationList
        .flatMap(mutationRecord =>
          Array.from(<NodeListOf<Element>>mutationRecord.addedNodes)
        )
        .map(getTweetNode)
        .filter(notNil)
        .forEach(tweetNode => observer.next(tweetNode))
    )

    mutationObserver.observe(targetNode, { childList: true })

    return () => mutationObserver.disconnect()
  })
}

function emitTweetNodes(observer: Observer<Element[]>) {
  const tweetNodes = getAllTweetNodes()

  if (tweetNodes.length >= 2) {
    observer.next(tweetNodes)
    observer.complete()
    return
  }
}

const initialTweetNodes$ = new Observable<Element[]>(observer => {
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

const tweetNode$ = initialTweetNodes$.pipe(
  flatMap(tweetNodes =>
    merge(
      from(tweetNodes),
      getNewAddedTweetNodes(getCommonAncestorFromNodes(tweetNodes))
    )
  )
)

const suspiciousAvatarNode$ = tweetNode$.pipe(
  flatMap(tweetNode => {
    const avatarNode = tweetNode.querySelector('a')

    if (!avatarNode) {
      return throwError(
        'Invalid tweet node: tweet node does not contain avatar node'
      )
    }

    const username = getUsernameFromPathname(avatarNode.pathname)

    return Rostam.isUserBlocked(username).pipe(
      filter(isTrue),
      mapTo(avatarNode)
    )
  })
)

function main() {
  const tick$ = interval(100)

  const location$ = tick$.pipe(
    map(() => clone(window.location)),
    publishBehavior(clone(window.location)),
    refCount(),
    distinctUntilKeyChanged('pathname')
  )

  const notSupportedRoutes = {
    matches: [/^\/(explore|messages|settings|logout|i)(\/.*)?$/i],
    switchMap: always(EMPTY),
  }

  const suspiciousAvatarNodeRoute$ = route(location$, [
    notSupportedRoutes,
    {
      matches: [/^\/notifications\/?$/i],
      switchMap() {
        return merge(suspiciousAvatarNode$)
      },
    },
    {
      matches: [/^\/(home|search|hashtag|[A-z0-9_]{1,15})\/?/i],
      switchMap: always(suspiciousAvatarNode$),
    },
  ])

  suspiciousAvatarNodeRoute$.subscribe({ next: makeAvatarSuspicous })
}

main()
