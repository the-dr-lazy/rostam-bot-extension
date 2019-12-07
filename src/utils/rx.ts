import { filter } from 'rxjs/operators'
import * as R from 'ramda'

import { castArray } from './data'

export function ofName(castableName: any | any[]) {
  const names = castArray(castableName)

  const predict = R.compose<any, any, any>(
    R.contains(R.__, names),
    R.prop('name')
  )

  return filter(predict)
}
