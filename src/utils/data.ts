import { isNil } from 'rambda'
import { identity } from 'rxjs'

export function notNil<TValue>(
  value: TValue | undefined | null
): value is TValue {
  return !isNil(value)
}

export const isTrue = <(value: Boolean) => value is true>identity

export function getUsernameFromPathname(pathname: string) {
  return pathname.replace('/', '')
}

export function joinPath(...paths: string[]) {
  return paths.map(path => path.trim().replace(/^\/+|\/+$/g, '')).join('/')
}

export function clone<TObject extends {}>(object: TObject): TObject {
  return { ...object }
}
