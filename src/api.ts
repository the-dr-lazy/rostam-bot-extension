import { fromFetch } from 'rxjs/fetch'
import { switchMap } from 'rxjs/operators'
import { joinPath } from './utils'

export const rostamBotAPIBaseURL = process.env.ROSTAM_BOT_API_BASE_URL!

export const endpoints = {
  isUserBlocked(username: string) {
    return joinPath(
      rostamBotAPIBaseURL,
      'SuspiciousActivity/IsTwitterUserBlocked',
      username
    )
  },
}

export function isUserBlocked(username: string) {
  return fromFetch(endpoints.isUserBlocked(username)).pipe(
    switchMap(response => response.json())
  )
}
