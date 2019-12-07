import h from 'snabbdom/h'
import { of, Observable, race } from 'rxjs'
import {
  withLatestFrom,
  switchMap,
  mapTo,
  take,
  delayWhen,
  delay,
  debounceTime,
} from 'rxjs/operators'
import { Maybe, Some, None } from 'monet'
import * as R from 'ramda'

import { getIconURL, Icon, svgInjectEventHandler, UnwrapMaybe } from '~/utils'
import * as Monarch from '~/monarch'

type State = Maybe<{
  show: boolean
  title: string
  description: string
  action: string
}>

type ProposeShowActionSpec = {
  title: string
  description: string
  action: string
  timeout: number
}

type NextShowActionSpec = ProposeShowActionSpec

const actions = {
  show: {
    propose: Monarch.createActionCreator(
      'SHOW_SNACKBAR_PROPOSE',
      resolve => ({ timeout, ...payload }: ProposeShowActionSpec) =>
        resolve(payload, timeout)
    ),
    next: Monarch.createActionCreator(
      'SHOW_SNACKBAR_NEXT',
      resolve => ({ timeout, ...payload }: NextShowActionSpec) =>
        resolve(payload, timeout)
    ),
    complete: Monarch.createActionCreator('SHOW_SNACKBAR_COMPLETE'),
  },
  hide: {
    next: Monarch.createActionCreator('HIDE_SNACKBAR_NEXT'),
    complete: Monarch.createActionCreator('HIDE_SNACKBAR_COMPLETE'),
  },
}

const classes = {
  block: 'c-snackbar',
  elements: {
    icon: 'c-snackbar__icon',
    content: 'c-snackbar__content',
    title: 'c-snackbar__title',
    description: 'c-snackbar__description',
    action: 'c-snackbar__action',
  },
  modifiers: {
    isActive: '-is-active',
  },
}

function renderIcon() {
  return h('img', {
    attrs: { class: classes.elements.icon, src: getIconURL(Icon.PoisonStroke) },
    on: { load: svgInjectEventHandler },
  })
}

function renderContent({
  title,
  description,
}: Pick<UnwrapMaybe<State>, 'title' | 'description'>) {
  return h('div', { props: { className: classes.elements.content } }, [
    h('h3', { props: { className: classes.elements.title } }, title),
    h('p', { props: { className: classes.elements.description } }, description),
  ])
}

function renderAction(action: string) {
  return h('button', { props: { className: classes.elements.action } }, action)
}

function render(state: State) {
  const children = state.cata(
    () => [renderIcon()],
    ({ title, description, action }) => [
      renderIcon(),
      renderContent({ title, description }),
      renderAction(action),
    ]
  )

  const show = state.cata(R.always(false), R.prop('show'))

  return h(
    'div',
    {
      class: {
        [classes.modifiers.isActive]: show,
      },
      props: { className: classes.block },
      on: {
        transitionend({ propertyName }: any) {
          if (propertyName !== 'opacity') {
            return
          }

          component.action$.next(
            show ? actions.show.complete() : actions.hide.complete()
          )
        },
      },
    },
    children
  )
}

const initialState = <State>None()

const reducer = Monarch.createReducer(initialState, handleAction => [
  handleAction(actions.show.next, (_, { payload }) =>
    Some({ ...payload, show: true })
  ),
  handleAction(actions.hide.next, state =>
    state.map(R.evolve({ show: R.always(false) }))
  ),
  handleAction(actions.hide.complete, () => <State>None()),
])

type Action =
  | Monarch.ActionType<typeof actions.show.propose>
  | Monarch.ActionType<typeof actions.show.next>
  | Monarch.ActionType<typeof actions.show.complete>
  | Monarch.ActionType<typeof actions.hide.next>
  | Monarch.ActionType<typeof actions.hide.complete>

function showEpic(action$: Observable<Action>, state$: Observable<State>) {
  return action$.pipe(
    Monarch.ofType(actions.show.propose),
    debounceTime(250),
    withLatestFrom(state$),
    switchMap(([action, state]) => {
      const nextAction = actions.show.next({
        ...action.payload,
        timeout: action.meta,
      })

      return state.cata(
        () => of(nextAction),
        () =>
          action$.pipe(
            Monarch.ofType(actions.hide.complete),
            take(1),
            mapTo(nextAction)
          )
      )
    })
  )
}

function hideEpic(action$: Observable<Action>) {
  return action$.pipe(
    Monarch.ofType(actions.show.next),
    delayWhen(({ meta }) =>
      race(
        action$.pipe(
          Monarch.ofType(actions.show.complete),
          take(1),
          delay(meta)
        ),
        action$.pipe(Monarch.ofType(actions.show.propose), take(1))
      )
    ),
    mapTo(actions.hide.next())
  )
}

const component = Monarch.createComponent<State, Action>({
  render,
  reducer,
  epic: Monarch.combineEpics([showEpic, hideEpic]),
})

type ShowSpec = ProposeShowActionSpec

export function show(spec: ShowSpec) {
  component.action$.next(actions.show.propose(spec))

  return component.action$.pipe(
    Monarch.ofType(actions.show.complete),
    mapTo(<void>undefined),
    take(1)
  )
}

export function hide(): Observable<void> {
  component.action$.next(actions.hide.next())

  return component.action$.pipe(
    Monarch.ofType(actions.hide.complete),
    mapTo(<void>undefined),
    take(1)
  )
}

export const subscribe = component.subscribe
