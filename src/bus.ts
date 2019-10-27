import { Subject, Observable } from 'rxjs'
import * as R from 'ramda'
import { ofType } from './utils'
import { map, publishBehavior, refCount } from 'rxjs/operators'

export type Message<TType extends string, TPayload = undefined> = {
  type: TType
  payload?: TPayload
}

export type MessageSubject = ReturnType<typeof createMessageSubject>

export function createMessageSubject() {
  const message$ = new Subject<Message<any, any>>()

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

export function sendMessage(message: Message<any, any>) {
  return new Observable(observer =>
    chrome.runtime.sendMessage(message, observer.complete)
  )
}

export function createMessage<TType extends string, TPayload = undefined>(
  type: TType,
  payload?: TPayload
): Message<TType, TPayload> {
  return {
    type,
    ...(payload === undefined ? {} : { payload }),
  }
}

export function createMessageCreator<
  TType extends string,
  TArgs extends any[] = [],
  TPayload = undefined
>(
  type: TType,
  createPayload: (...args: TArgs) => TPayload = <any>R.always(undefined)
) {
  return Object.assign(
    (...args: TArgs) => createMessage(type, createPayload(...args)),
    { type }
  )
}

export const historyUpdated = createMessageCreator('HISTORY_UPDATED')
