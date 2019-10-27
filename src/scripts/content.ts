import { merge, throwError, Subscription } from 'rxjs'
import { flatMap, filter, mapTo, tap, switchMapTo } from 'rxjs/operators'

import { createRouter } from '~/router'
import {
  getUsernameFromPathname,
  isTrue,
  makeAvatarSuspicous,
  ofName,
} from '~/utils'
import * as Rostam from '~/api'
import * as Bus from '~/bus'
import * as UI from '~/ui'

import '~/scss/content.scss'

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

const enum Route {
  Home,
  Explore,
  Search,
  Hashtag,
  Notifications,
  Messages,
  Tweet,
  Profile,
}

function main() {
  const message$ = Bus.createMessageSubject()
  const path$ = Bus.createPathSubject(message$)
  const route$ = createRouter(
    [
      { name: Route.Home, path: /^\/home\/?$/i },
      { name: Route.Explore, path: /^\/explore\/?$/i },
      { name: Route.Search, path: /^\/search\?/i },
      { name: Route.Hashtag, path: /^\/hashtag\/?/i },
      { name: Route.Notifications, path: /^\/notifications/i },
      { name: Route.Messages, path: /^\/messages\/?/i },
      { name: Route.Tweet, path: /^\/([A-z0-9_]{1,15})\/status\/\d+$/i },
      {
        name: Route.Profile,
        path: /^\/([A-z0-9_]{1,15})\/?(?:with_replies|media|likes)?$/i,
      },
    ],
    { path$ }
  )

  const router$ = merge(
    route$.pipe(
      ofName([
        Route.Home,
        Route.Explore,
        Route.Search,
        Route.Hashtag,
        Route.Notifications,
        Route.Tweet,
        Route.Profile,
      ]),
      switchMapTo(suspiciousAvatarNode$),
      tap(makeAvatarSuspicous)
    )
  )

  const subscription = new Subscription()
  window.addEventListener('beforeunload', subscription.unsubscribe)

  subscription.add(router$.subscribe())
}

main()
