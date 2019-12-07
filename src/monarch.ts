import {
  merge,
  animationFrameScheduler,
  scheduled,
  Subject,
  Observable,
} from 'rxjs'
import {
  tap,
  scan,
  distinctUntilChanged,
  publishBehavior,
  refCount,
  map,
  startWith,
  pairwise,
} from 'rxjs/operators'
import { action as createAction, AnyAction } from 'deox'
import { VNode } from 'snabbdom/vnode'
import * as snabbdom from 'snabbdom'

export { createActionCreator, createReducer, ofType, ActionType } from 'deox'

const patch = snabbdom.init([
  require('snabbdom/modules/attributes').default,
  require('snabbdom/modules/class').default,
  require('snabbdom/modules/props').default,
  require('snabbdom/modules/eventlisteners').default,
])

export type Reducer<TState, TAction> = (
  state: TState | undefined,
  action: TAction
) => TState

const init = createAction('INIT')

type CreateComponentSpec<TState, TAction extends AnyAction> = {
  render: (state: TState) => VNode
  reducer: Reducer<TState, TAction>
  epic: Epic<TAction, TAction, TState>
}

export function createComponent<TState, TAction extends AnyAction>(
  spec: CreateComponentSpec<TState, TAction>
) {
  const initialState = spec.reducer(undefined, <TAction>init)

  const action$ = new Subject<TAction>()

  const state$ = action$.pipe(
    scan(spec.reducer, initialState),
    distinctUntilChanged(),
    publishBehavior(initialState),
    refCount()
  )

  const epic$ = spec.epic(action$.asObservable(), state$)
  const vdoms$ = state$.pipe(map(spec.render), startWith(undefined), pairwise())

  epic$.subscribe(action$)

  function subscribe(container: Element) {
    return scheduled(
      vdoms$,
      animationFrameScheduler
    ).subscribe(([prevVDOM, nextVDOM]) =>
      patch(prevVDOM || container, <VNode>nextVDOM)
    )
  }

  return { action$, subscribe }
}

export type Epic<
  TInputAction extends AnyAction,
  TOutputAction extends AnyAction,
  TState
> = (
  action$: Observable<TInputAction>,
  state$: Observable<TState>
) => Observable<TOutputAction>

type InferInputActionFromEpic<TEpic> = TEpic extends Epic<
  infer TInputAction,
  any,
  any
>
  ? TInputAction
  : never
type InferOutputActionFromEpic<TEpic> = TEpic extends Epic<
  any,
  infer TOutputAction,
  any
>
  ? TOutputAction
  : never
type InferStateFromEpic<TEpic> = TEpic extends Epic<any, any, infer TState>
  ? TState
  : never

export function combineEpics<TEpic extends Epic<any, any, any>>(
  epics: TEpic[]
): Epic<
  InferInputActionFromEpic<TEpic>,
  InferOutputActionFromEpic<TEpic>,
  InferStateFromEpic<TEpic>
> {
  return (...args) => merge(...epics.map(epic => epic(...args)))
}
