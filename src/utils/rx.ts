import { Observable, EMPTY, interval, BehaviorSubject } from 'rxjs'
import { switchMap } from 'rxjs/operators'

type RouteConfig<TValue> = {
  matches: RegExp[]
  switchMap(location: Location): Observable<TValue>
}

type InferReturningObservable<TRouteConfig> = TRouteConfig extends RouteConfig<
  infer V
>
  ? Observable<V>
  : never
export function route<TRouteConfig extends RouteConfig<any>>(
  location$: Observable<Location>,
  configs: TRouteConfig[]
) {
  return <InferReturningObservable<TRouteConfig>>location$.pipe(
    switchMap(({ pathname }) => {
      const route = configs.find(({ matches }) =>
        matches.some(match => {
          return match.test(pathname)
        })
      )

      return route ? route.switchMap(location) : EMPTY
    })
  )
}
