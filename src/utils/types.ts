import { Maybe } from 'monet'

export type UnwrapMaybe<TMaybe extends Maybe<any>> = TMaybe extends Maybe<
  infer T
>
  ? T
  : never
