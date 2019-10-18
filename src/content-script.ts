import { merge, interval, EMPTY, throwError } from 'rxjs'
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
  getUsernameFromPathname,
  route,
  isTrue,
  clone,
  makeAvatarSuspicous,
} from './utils'

import * as UI from './ui'

import './content-script.scss'

const suspiciousAvatarNode$ = UI.twitter.tweet$.pipe(
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
