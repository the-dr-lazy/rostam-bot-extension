import { filter } from 'rxjs/operators'
import * as R from 'ramda'

import { castArray } from './data'
import * as Bus from '../bus'

export function ofType<TType extends string>({ type }: { type: TType }) {
  const predict = R.compose<Bus.Message<TType, any>, TType, boolean>(
    R.equals(type),
    R.prop('type')
  )

  return filter(predict)
}

export function ofName(castableName: any | any[]) {
  const names = castArray(castableName)

  const predict = R.compose<any, any, any>(
    R.contains(R.__, names),
    R.prop('name')
  )

  return filter(predict)
}
