import { of, EMPTY } from 'rxjs'
import { switchMap } from 'rxjs/operators'
import * as R from 'ramda'

import * as Bus from './bus'

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
      const route = routes.find(
        R.compose(
          R.test(R.__, path),
          R.prop('path')
        )
      )

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
