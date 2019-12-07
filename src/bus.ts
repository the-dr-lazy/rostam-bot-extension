import { Subject, Observable } from 'rxjs'
import { map, publishBehavior, refCount } from 'rxjs/operators'
import { createActionCreator, Action, ofType } from 'deox'

export type MessageSubject = ReturnType<typeof createMessageSubject>

export function createMessageSubject() {
  const message$ = new Subject<Action<any, any, any>>()

  chrome.runtime.onMessage.addListener(message => {
    message$.next(message)
  })

  return message$
}

export type PathSubject = ReturnType<typeof createPathSubject>

export function createPathSubject(message$: MessageSubject) {
  return message$.pipe(
    ofType(historyUpdated),
    map(() => window.location.pathname),
    publishBehavior(window.location.pathname),
    refCount()
  )
}

export function sendMessage(message: Action<any, any, any>) {
  return new Observable(observer =>
    chrome.runtime.sendMessage(message, observer.complete)
  )
}

export const historyUpdated = createActionCreator('HISTORY_UPDATED')
