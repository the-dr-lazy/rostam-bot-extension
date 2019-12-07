import { of, EMPTY, OperatorFunction } from 'rxjs'
import { switchMap, filter } from 'rxjs/operators'
import * as R from 'ramda'

import * as Bus from './bus'
import { castArray } from './utils'

type RouterSpec<TName> = {
  name: TName
  path: RegExp
}

type Route<TName> = {
  name: TName
  path: string
  params: string[]
}

type CreateRouterDependencies = {
  path$: Bus.PathSubject
}

export function createRouter<TName>(
  routes: RouterSpec<TName>[],
  { path$ }: CreateRouterDependencies
) {
  return path$.pipe(
    switchMap(path => {
      const route = routes.find(R.compose(R.test(R.__, path), R.prop('path')))

      if (!route) {
        return EMPTY
      }

      return route
        ? of(<Route<TName>>{
            path,
            name: route.name,
            params: R.tail(path.match(route.path)!),
          })
        : EMPTY
    })
  )
}

export type ExtractRoute<TRoute, TName> = Extract<TRoute, Route<TName>>

export function ofName<
  TSource extends Route<any>,
  TName,
  TSink extends TSource = ExtractRoute<TSource, TName>
>(castableName: TName | TName[]): OperatorFunction<TSource, TSink> {
  const names = castArray(castableName)

  return filter((route: TSource): route is TSink => names.includes(route.name))
}
